import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(identifier);
  
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  existing.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client identifier for rate limiting (use auth header or IP)
  const authHeader = req.headers.get('authorization') || '';
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('cf-connecting-ip') || 
                   'unknown';
  const identifier = authHeader ? `auth:${authHeader.slice(-20)}` : `ip:${clientIp}`;
  
  if (!checkRateLimit(identifier)) {
    console.log('Rate limit exceeded for AI analyze:', identifier.slice(0, 20));
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const {
      fileName,
      fileType,
      fileSize,
      fileContent,
      prompt,
      workspaceContext,
      analysisType = 'summary',
    } = await req.json();
    
    console.log(`AI-analyze function called: analysisType=${analysisType}, fileName=${fileName}`);
    
    const aiGatewayApiKey = Deno.env.get("AI_GATEWAY_API_KEY");
    const aiGatewayUrl = Deno.env.get("AI_GATEWAY_URL");
    
    if (!aiGatewayApiKey || !aiGatewayUrl) {
      console.log("AI Gateway not configured - using fallback response mode");
      // Fallback mode: generate response without external API
      let fallbackAnalysis = "";
      
      if (analysisType === 'summary') {
        fallbackAnalysis = `Based on the filename "${fileName}", this appears to be a ${fileType || 'file'} containing relevant information for your workspace. The file is approximately ${(fileSize / (1024 * 1024)).toFixed(2)} MB in size.`;
      } else if (analysisType === 'insights') {
        fallbackAnalysis = `Organize similar files in dedicated folders to improve workflow.`;
      } else if (analysisType === 'assistant') {
        fallbackAnalysis = `Based on your workspace context with ${workspaceContext?.split('\n').length || 0} files, here's a summary: Your workspace contains a variety of files that could benefit from better organization. Consider grouping similar types together and removing duplicate content to optimize storage usage.`;
      }
      
      return new Response(JSON.stringify({ analysis: fallbackAnalysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    // Truncate content to avoid token limits (first 4000 chars)
    const truncatedContent = fileContent ? fileContent.substring(0, 4000) : null;
    
    // Check if content is readable text (not binary/garbled data)
    // Binary content often has high ratio of non-printable/unusual characters
    const isReadableContent = (text: string): boolean => {
      if (!text || text.length < 20) return false;
      
      // Count readable characters (letters, numbers, common punctuation, spaces)
      const readableChars = text.match(/[a-zA-Z0-9\s.,!?;:'"()\-@#$%&*+=\[\]{}\/\\<>]/g)?.length || 0;
      const ratio = readableChars / text.length;
      
      // Require at least 60% readable characters AND at least 20 real words (3+ letters)
      const words = text.match(/[a-zA-Z]{3,}/g) || [];
      return ratio > 0.6 && words.length >= 20;
    };
    
    const hasUsableContent = truncatedContent && isReadableContent(truncatedContent);

    if (analysisType === 'summary') {
      if (hasUsableContent) {
        // Use actual file content - focus on ideas and details, not file type
        systemPrompt = "You are a content analyst. Extract and summarize the key ideas, information, and details. Never mention file type, format, or that this is a document/PDF/image. Focus only on the actual subject matter, insights, and key takeaways.";
        userPrompt = `What are the main ideas and key details in this content? Provide a concise 2-3 sentence summary focusing on the actual information, topics, data, or message. Do not mention file formats or document types.

${truncatedContent}${fileContent && fileContent.length > 4000 ? '\n[...content truncated]' : ''}`;
      } else {
        // Fallback - infer from filename without mentioning file type
        systemPrompt = "You are a helpful assistant. Infer what this might be about based on its name. Never mention file types or formats - focus on the likely subject matter and purpose.";
        userPrompt = `Based on the name "${fileName}", what might this be about? Describe the likely subject or purpose in 1-2 sentences without mentioning file formats or document types.`;
      }
    } else if (analysisType === 'insights') {
      systemPrompt = "You are an AI storage analyst. Return a single, concise recommendation (max 140 characters). No lists, no markdown. Plain sentence.";
      userPrompt = `Context: name=${fileName}, type=${fileType}, sizeMB=${(fileSize / (1024 * 1024)).toFixed(2)}.
Provide one actionable tip about organization or storage optimization. Keep it to one short sentence.`;
    } else if (analysisType === 'assistant') {
      systemPrompt = "You are a helpful workspace assistant for a cloud file manager. Answer the user's request using only the supplied workspace context. Be practical, concise, and specific. If the context is limited, say so clearly instead of inventing files or facts.";
      userPrompt = `User request:
${prompt || "Help me understand this workspace."}

Workspace context:
${(workspaceContext || fileContent || "No workspace context available.").substring(0, 4000)}`;
    }

    let analysis = "";

    if (aiGatewayApiKey && aiGatewayUrl) {
      const response = await fetch(aiGatewayUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${aiGatewayApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 256,
        }),
      });

      console.log(`AI Gateway Response Status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 429) {
          console.error("Rate limit exceeded from AI gateway");
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          console.error("Payment required from AI gateway");
          return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        return new Response(JSON.stringify({ error: `AI analysis failed: ${errorText}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      analysis = data.choices?.[0]?.message?.content || "Unable to generate response for this workspace prompt.";
    } else {
      // Fallback mode when credentials aren't configured
      console.log("Using fallback analysis mode (no API credentials)");
      if (analysisType === 'summary') {
        analysis = `Based on the filename "${fileName}", this appears to be a ${fileType || 'file'} containing relevant information for your workspace. The file is approximately ${(fileSize / (1024 * 1024)).toFixed(2)} MB in size.`;
      } else if (analysisType === 'insights') {
        analysis = `Organize similar files in dedicated folders to improve workflow and storage efficiency.`;
      } else if (analysisType === 'assistant') {
        analysis = `Based on your workspace context, here are some recommendations: Consider organizing your files by type and category to improve accessibility. Remove duplicate files to optimize storage usage. Create a clear folder structure that matches your workflow needs.`;
      } else {
        analysis = `Your workspace is ready for analysis. Add AI credentials in Supabase for more detailed insights.`;
      }
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-analyze function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
