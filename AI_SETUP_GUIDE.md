# AI Assistant Setup Guide

The AI Assistant feature requires API credentials to work. Follow these steps to set it up:

## 1. Configure Supabase Edge Function Secrets

The AI Assistant uses the `ai-analyze` edge function which needs two environment variables:

### Required Secrets:
- **AI_GATEWAY_API_KEY**: Your API key for the AI gateway service
- **AI_GATEWAY_URL**: The URL endpoint for your AI gateway service

### Supported AI Providers:

#### Option A: Using Google Generative AI (Recommended for beginners)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. Create a new API key
3. Set `AI_GATEWAY_URL` to: `https://generativelanguage.googleapis.com/v1beta/openai/`
4. Set `AI_GATEWAY_API_KEY` to your Google API key

#### Option B: Using Together AI (Higher rate limits)
1. Go to [Together AI Console](https://www.together.ai/)
2. Sign up and create an API key from your dashboard
3. Set `AI_GATEWAY_URL` to: `https://api.together.xyz/v1/chat/completions`
4. Set `AI_GATEWAY_API_KEY` to your Together API key

#### Option C: Using Anthropic Claude
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an API key from the settings
3. Set `AI_GATEWAY_URL` to: `https://api.anthropic.com/v1/messages`
4. Set `AI_GATEWAY_API_KEY` to your Anthropic API key

## 2. Add Secrets to Supabase

### Via Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions** or **Secrets**
3. Add two new secrets:
   ```
   AI_GATEWAY_API_KEY = your_api_key_here
   AI_GATEWAY_URL = your_gateway_url_here
   ```
4. Deploy/redeploy the `ai-analyze` function if needed

### Via Supabase CLI:
```bash
supabase secrets set AI_GATEWAY_API_KEY=your_key_here AI_GATEWAY_URL=your_url_here
```

## 3. Verify the Setup

Once you've added the secrets:

1. **Clear browser cache** (to ensure fresh environment)
2. Go to the **AI Assistant** page
3. Upload a few files to your workspace
4. Try submitting a prompt in the "Ask Clever Vault" section
5. Check the browser console (F12) and Supabase logs for any errors

## Troubleshooting

### Error: "AI_GATEWAY_API_KEY is not configured"
- **Solution**: Make sure you've added the secret to your Supabase project
- Check the secret name is exactly `AI_GATEWAY_API_KEY` (case-sensitive)
- Wait a minute for changes to propagate

### Error: "AI_GATEWAY_URL is not configured"
- **Solution**: Add the `AI_GATEWAY_URL` secret to your Supabase project
- Verify the URL is correct for your chosen AI provider

### Error: "Rate limit exceeded"
- **Solution**: Wait a minute and try again
- Consider upgrading your API plan with your AI provider

### Error: "Payment required"
- **Solution**: Your AI gateway account has run out of credits
- Add payment/credits to your AI provider account

### Function fails silently with no files
- **Solution**: Upload at least one file to your workspace first
- The assistant needs workspace context to work

## Testing the Setup

You can test if the API is working by running this in your browser console:

```javascript
const { data, error } = await supabase.functions.invoke('ai-analyze', {
  body: {
    analysisType: 'assistant',
    prompt: 'Hello, are you working?',
    workspaceContext: 'Test context',
    fileName: 'Test',
    fileType: 'test',
    fileSize: 1000
  }
});
console.log('Response:', data);
console.log('Error:', error);
```

## Local Development

If you're running Supabase locally, make sure to:

1. Start Supabase: `supabase start`
2. Set local secrets: `supabase secrets set --local AI_GATEWAY_API_KEY=your_key`
3. Deploy functions: `supabase functions deploy`

## Production Deployment

When deploying to production Supabase:

1. Ensure secrets are set in your production project
2. Test the AI Assistant after deployment
3. Monitor Supabase function logs for errors
4. Set up proper error tracking/alerting

---

**Need help?** Check your Supabase project logs at: Project Settings → Edge Functions Logs
