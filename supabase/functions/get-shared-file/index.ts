import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

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

// Hash password using Web Crypto API (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  console.log('get-shared-file function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client IP for rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('cf-connecting-ip') || 
                   'unknown';
  
  if (!checkRateLimit(clientIp)) {
    console.log('Rate limit exceeded for:', clientIp);
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    let token: string | null = null;
    let password: string | null = null;

    // Support both GET (for backward compatibility) and POST
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      token = body.token || null;
      password = body.password || null;
      console.log('POST request - token:', token ? 'present' : 'missing');
    } else {
      const url = new URL(req.url);
      token = url.searchParams.get('token');
      password = url.searchParams.get('password');
      console.log('GET request - token:', token ? 'present' : 'missing');
    }

    console.log('Password provided:', password ? 'yes' : 'no');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Share token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Creating Supabase client');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get file info directly to check expiration and password
    console.log('Fetching file data for token:', token);
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('id, name, type, size, storage_path, created_at, share_expires_at, share_password')
      .eq('share_token', token)
      .eq('is_shared', true)
      .eq('is_deleted', false)
      .maybeSingle();

    if (fileError) {
      console.error('Database error:', fileError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!fileData) {
      console.log('File not found for token:', token);
      return new Response(
        JSON.stringify({ error: 'File not found or not shared' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('File found:', fileData.name);

    // Check if link has expired
    if (fileData.share_expires_at) {
      const expiresAt = new Date(fileData.share_expires_at);
      if (expiresAt < new Date()) {
        console.log('Share link expired:', fileData.share_expires_at);
        return new Response(
          JSON.stringify({ error: 'Share link has expired', expired: true }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if password is required
    if (fileData.share_password) {
      console.log('Password required for this file');
      
      if (!password) {
        console.log('No password provided, requesting password');
        return new Response(
          JSON.stringify({ 
            error: 'Password required', 
            password_required: true,
            file_name: fileData.name
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash the provided password and compare with stored hash
      const hashedPassword = await hashPassword(password);
      if (hashedPassword !== fileData.share_password) {
        console.log('Invalid password provided');
        return new Response(
          JSON.stringify({ error: 'Invalid password', password_required: true }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Password verified successfully');
    }

    // Generate a signed URL for the file (valid for 1 hour)
    console.log('Generating signed URL for:', fileData.storage_path);
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('user-files')
      .createSignedUrl(fileData.storage_path, 3600);

    if (urlError || !signedUrlData) {
      console.error('Error generating signed URL:', urlError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate file URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Signed URL generated successfully');

    return new Response(
      JSON.stringify({
        file: {
          id: fileData.id,
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
          created_at: fileData.created_at,
          url: signedUrlData.signedUrl,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-shared-file function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
