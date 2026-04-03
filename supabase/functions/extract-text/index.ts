import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Extract text from PDF using simple parsing (for text-based PDFs)
function extractTextFromPDF(uint8Array: Uint8Array): string {
  let extractedText = '';
  
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const pdfContent = decoder.decode(uint8Array);
    
    // Extract text objects from PDF (simplified extraction)
    const textMatches = pdfContent.match(/BT[\s\S]*?ET/g) || [];
    
    for (const block of textMatches) {
      const tjMatches = block.match(/\((.*?)\)\s*Tj/g) || [];
      const TJMatches = block.match(/\[(.*?)\]\s*TJ/gi) || [];
      
      for (const match of tjMatches) {
        const text = match.replace(/\((.*?)\)\s*Tj/, '$1');
        extractedText += text + ' ';
      }
      
      for (const match of TJMatches) {
        const parts = match.match(/\((.*?)\)/g) || [];
        for (const part of parts) {
          extractedText += part.replace(/[()]/g, '') + ' ';
        }
      }
    }

    // Also try to find plain text content in streams
    const streamMatches = pdfContent.match(/stream\r?\n([\s\S]*?)\r?\nendstream/g) || [];
    for (const stream of streamMatches) {
      const readable = stream.replace(/stream\r?\n|\r?\nendstream/g, '')
        .replace(/[^\x20-\x7E\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (readable.length > 20 && /[a-zA-Z]{3,}/.test(readable)) {
        extractedText += readable + ' ';
      }
    }

    extractedText = extractedText
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  } catch (parseError) {
    console.error('PDF parse error:', parseError);
  }

  return extractedText;
}

// Use AI vision to extract text via OCR
async function extractTextWithOCR(base64Data: string, mimeType: string): Promise<string> {
  const aiGatewayApiKey = Deno.env.get('AI_GATEWAY_API_KEY');
  const aiGatewayUrl = Deno.env.get('AI_GATEWAY_URL');
  
  if (!aiGatewayApiKey) {
    console.error('AI_GATEWAY_API_KEY not configured');
    return '';
  }

  if (!aiGatewayUrl) {
    console.error('AI_GATEWAY_URL not configured');
    return '';
  }

  // Map mime types to supported formats
  let imageMimeType = mimeType;
  if (mimeType === 'application/pdf') {
    // PDF can't be sent as image directly - skip OCR for PDFs
    console.log('PDF OCR not supported via vision API');
    return '';
  }
  
  // Ensure valid image mime type
  if (!imageMimeType.startsWith('image/')) {
    console.log('Invalid mime type for OCR:', imageMimeType);
    return '';
  }

  try {
    console.log(`Calling AI gateway for OCR extraction, mime: ${imageMimeType}, base64 length: ${base64Data.length}`);
    
    const requestBody = {
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'You are an OCR assistant. Extract ALL text content visible in this image. Return ONLY the extracted text, preserving the original structure and formatting as much as possible. If there is no text, respond with "NO_TEXT_FOUND".'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageMimeType};base64,${base64Data}`
              }
            }
          ]
        }
      ],
      max_tokens: 4096,
    };

    console.log('Sending OCR request to AI gateway...');
    
    const response = await fetch(aiGatewayUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiGatewayApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('OCR response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI OCR error response:', response.status, errorText);
      return '';
    }

    const data = await response.json();
    console.log('OCR response received:', JSON.stringify(data).substring(0, 500));
    
    const extractedText = data.choices?.[0]?.message?.content || '';
    
    // Filter out "no text" responses
    if (extractedText === 'NO_TEXT_FOUND' || extractedText.toLowerCase().includes('no text')) {
      console.log('No text found in image');
      return '';
    }
    
    console.log(`OCR extracted ${extractedText.length} characters`);
    return extractedText.trim();

  } catch (error) {
    console.error('OCR extraction error:', error);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, storagePath, fileType } = await req.json();

    if (!fileId || !storagePath) {
      return new Response(
        JSON.stringify({ error: 'Missing fileId or storagePath' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Extracting text from file: ${fileId}, type: ${fileType}, path: ${storagePath}`);

    const isPDF = fileType === 'application/pdf';
    const isImage = fileType.startsWith('image/');

    if (!isPDF && !isImage) {
      console.log('Skipping unsupported file type');
      return new Response(
        JSON.stringify({ content: null, message: 'Text extraction only supported for PDFs and images' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-files')
      .download(storagePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let extractedText = '';

    if (isPDF) {
      // First try simple text extraction for text-based PDFs
      extractedText = extractTextFromPDF(uint8Array);
      console.log(`PDF text extraction found ${extractedText.length} characters`);

      // If little text found, it might be a scanned PDF - use OCR
      if (extractedText.length < 100) {
        console.log('PDF appears to be scanned, attempting OCR...');
        const base64 = arrayBufferToBase64(arrayBuffer);
        const ocrText = await extractTextWithOCR(base64, 'application/pdf');
        if (ocrText.length > extractedText.length) {
          extractedText = ocrText;
        }
      }
    } else if (isImage) {
      // Use OCR for images
      console.log('Processing image with OCR...');
      const base64 = arrayBufferToBase64(arrayBuffer);
      extractedText = await extractTextWithOCR(base64, fileType);
    }

    // Limit content to 50KB
    const MAX_CONTENT_LENGTH = 50000;
    if (extractedText.length > MAX_CONTENT_LENGTH) {
      extractedText = extractedText.substring(0, MAX_CONTENT_LENGTH);
    }

    console.log(`Final extracted text: ${extractedText.length} characters`);

    // Update the file record with extracted content
    if (extractedText.length > 0) {
      const { error: updateError } = await supabase
        .from('files')
        .update({ content: extractedText })
        .eq('id', fileId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(`Failed to update file: ${updateError.message}`);
      }

      console.log(`Successfully saved content for file ${fileId}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: extractedText,
        length: extractedText.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-text function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
