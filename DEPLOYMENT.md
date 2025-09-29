# ChavrusaAI Deployment Guide

## Quick Deploy to Railway

1. **Push to GitHub**:
   ```bash
   # Create repository on GitHub: https://github.com/new
   # Name: ChavrusaAI
   # Description: AI-powered Torah learning platform with authentic rabbi personalities

   git remote add origin https://github.com/ilayibrahimzadeh1/ChavrusaAI.git
   git push -u origin main
   ```

2. **Deploy to Railway**:
   - Visit [railway.app](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select `ilayibrahimzadeh1/ChavrusaAI`
   - Railway will auto-detect Node.js and deploy

3. **Configure Environment Variables**:
   Add these in Railway dashboard:
   ```
   OPENAI_API_KEY=your-openai-api-key
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
   NODE_ENV=production
   CLIENT_URL=https://your-app.railway.app
   CORS_ORIGIN=https://your-app.railway.app
   ```

## Alternative Deployment Options

### Vercel (Frontend + Serverless)
- Perfect for React frontend
- Serverless functions for backend API
- Built-in CI/CD

### AWS Lightsail
- $5-10/month fixed pricing
- Good for predictable workloads
- Simple container deployment

### AWS Elastic Beanstalk
- Auto-scaling
- More complex but powerful
- Good for production at scale

## Prerequisites

- **OpenAI API Key**: Required for AI rabbi responses
- **Supabase Project**: PostgreSQL database for chat persistence
- **Node.js 16+**: Runtime environment

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key for GPT responses |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `NODE_ENV` | ✅ | Set to 'production' |
| `CLIENT_URL` | ✅ | Frontend URL for CORS |
| `CORS_ORIGIN` | ✅ | Same as CLIENT_URL |
| `PORT` | ❌ | Default: 8081 |

## Database Setup (Supabase)

1. Create tables:
   ```sql
   -- Run in Supabase SQL editor
   \i migrations/001_initial_schema.sql
   ```

2. Enable Row Level Security
3. Configure authentication providers

## Health Check

After deployment, verify:
- `GET /api/health` - Returns 200 OK
- `GET /api/chat/rabbis` - Returns rabbi list
- WebSocket connection works
- Authentication flow works

## Troubleshooting

**Common Issues:**
- **500 Error**: Check environment variables
- **CORS Error**: Verify CLIENT_URL and CORS_ORIGIN
- **Auth Fails**: Check Supabase keys and configuration
- **Chat Not Persisting**: Verify Supabase connection

**Debug Mode:**
Set `LOG_LEVEL=debug` for detailed logs