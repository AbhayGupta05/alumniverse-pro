# 🚀 AlumniVerse Pro Deployment Guide

This guide provides step-by-step instructions for deploying AlumniVerse Pro to Vercel via GitHub integration.

## 📋 Prerequisites

Before deploying, ensure you have:

- **GitHub Account**: For code repository hosting
- **Vercel Account**: For hosting and deployment (free tier available)
- **Database**: PostgreSQL database (recommended: Vercel Postgres or Supabase)
- **OpenAI API Key**: For AI-powered features (required)
- **Domain** (optional): Custom domain for production

## 🔧 Step 1: Environment Configuration

### 1.1 Required Environment Variables

Copy `.env.local.example` to `.env.local` and configure the following **required** variables:

```bash
# Core Application
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-super-secret-key-64-characters-long"
DATABASE_URL="postgresql://user:password@host:port/database"

# AI Features (Required)
NEXT_PUBLIC_OPENAI_API_KEY="sk-your-openai-api-key"

# App Environment
NEXT_PUBLIC_APP_ENV="production"
NODE_ENV="production"
```

### 1.2 Optional Environment Variables

For enhanced features, configure these optional variables:

```bash
# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"

# Blockchain/NFT Features
NEXT_PUBLIC_WEB3_INFURA_ID="your-infura-project-id"
NEXT_PUBLIC_ACHIEVEMENT_CONTRACT_ADDRESS="0x..."
PINATA_API_KEY="your-pinata-api-key"
PINATA_SECRET_API_KEY="your-pinata-secret-key"

# Real-time Features
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS="G-XXXXXXXXXX"

# Email Services
SENDGRID_API_KEY="your-sendgrid-api-key"
```

## 🗄️ Step 2: Database Setup

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to **Storage** → **Create Database**
3. Select **Postgres** and create database
4. Copy the connection string to `DATABASE_URL`

### Option B: Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **Database**
3. Copy the connection string to `DATABASE_URL`

### Option C: External PostgreSQL

Use any PostgreSQL provider (AWS RDS, DigitalOcean, etc.) and configure the connection string.

### 2.1 Database Schema

The application uses Prisma for database management. After deployment, the schema will be automatically applied.

## 🔑 Step 3: API Keys Setup

### 3.1 OpenAI API Key (Required)

1. Visit [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add to `NEXT_PUBLIC_OPENAI_API_KEY`

**Cost Estimate**: $0.10-$1.00 per 1000 API calls

### 3.2 OAuth Setup (Optional)

#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`

#### LinkedIn OAuth:
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers)
2. Create an OAuth application
3. Add redirect URI: `https://your-domain.vercel.app/api/auth/callback/linkedin`

### 3.3 Blockchain Setup (Optional)

#### Infura (for Web3):
1. Create account at [infura.io](https://infura.io)
2. Create new project
3. Copy project ID to `NEXT_PUBLIC_WEB3_INFURA_ID`

#### Pinata (for IPFS):
1. Create account at [pinata.cloud](https://pinata.cloud)
2. Generate API keys
3. Add to `PINATA_API_KEY` and `PINATA_SECRET_API_KEY`

## 📦 Step 4: GitHub Repository Setup

### 4.1 Create Repository

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: AlumniVerse Pro"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/alumniverse-pro.git
git branch -M main
git push -u origin main
```

### 4.2 Repository Structure

Ensure your repository has this structure:

```
alumniverse-pro/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
├── prisma/
│   └── schema.prisma
├── public/
├── .env.local.example
├── package.json
├── tailwind.config.js
├── next.config.ts
├── vercel.json
└── README.md
```

## 🌐 Step 5: Vercel Deployment

### 5.1 Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Select your GitHub repository
4. Click **"Import"**

### 5.2 Configure Build Settings

Vercel should automatically detect Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 5.3 Environment Variables

In Vercel dashboard:

1. Go to **Project Settings** → **Environment Variables**
2. Add all required environment variables from Step 1
3. Set the environment scope (Production, Preview, Development)

### 5.4 Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (~2-5 minutes)
3. Your app will be live at `https://your-project-name.vercel.app`

## 🔧 Step 6: Post-Deployment Configuration

### 6.1 Database Migration

After successful deployment:

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# (Optional) Seed database
npx prisma db seed
```

### 6.2 Domain Configuration (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain

### 6.3 SSL Certificate

Vercel automatically provides SSL certificates for all domains.

## 🔍 Step 7: Verification & Testing

### 7.1 Health Check

Visit these endpoints to verify deployment:

- `https://your-domain.vercel.app` - Main application
- `https://your-domain.vercel.app/api/health` - API health check
- `https://your-domain.vercel.app/api/ai/match` - AI API status

### 7.2 Feature Testing

Test these core features:

1. **User Registration/Login**
2. **AI Alumni Matching** (requires OpenAI API key)
3. **Analytics Dashboard**
4. **NFT Minting** (if blockchain configured)
5. **Real-time Features** (if Supabase configured)

## 📊 Step 8: Monitoring & Analytics

### 8.1 Vercel Analytics

Enable Vercel Analytics for performance monitoring:

1. Go to **Analytics** tab in Vercel dashboard
2. Enable Web Analytics
3. Optionally upgrade for advanced features

### 8.2 Error Tracking

Consider adding error tracking:

```bash
npm install @sentry/nextjs
```

Add to `next.config.ts`:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // Your Next.js config
}, {
  // Sentry webpack plugin options
});
```

## 🚀 Step 9: Performance Optimization

### 9.1 Edge Functions

Vercel automatically uses Edge Functions for API routes. No additional configuration needed.

### 9.2 Image Optimization

Images are automatically optimized. For external images, add domains to `next.config.ts`:

```javascript
module.exports = {
  images: {
    domains: ['example.com', 'via.placeholder.com'],
  },
}
```

### 9.3 Caching Strategy

Implement caching for API routes:

```javascript
// In API route
export const runtime = 'edge';
export const revalidate = 300; // 5 minutes
```

## 🔄 Step 10: CI/CD Pipeline

### 10.1 Automatic Deployments

Vercel automatically deploys on:
- **Push to main branch** → Production deployment
- **Pull requests** → Preview deployments

### 10.2 Branch Protection

Configure branch protection in GitHub:

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch
3. Enable "Require status checks"
4. Select Vercel deployment check

### 10.3 Environment-Specific Deployments

Use different environment variables for:
- **Production**: `NEXTAUTH_URL="https://your-domain.com"`
- **Preview**: `NEXTAUTH_URL="https://your-project-git-branch.vercel.app"`

## 🛠️ Troubleshooting

### Common Issues

#### Build Failures

```bash
# Check build logs in Vercel dashboard
# Common fixes:

# 1. Missing environment variables
npm run build # Test locally first

# 2. TypeScript errors
npm run type-check

# 3. Dependency issues
npm ci # Clean install
```

#### Database Connection Issues

```bash
# Test database connection
npx prisma db push --preview-feature

# Check connection string format
postgresql://user:password@host:port/database?sslmode=require
```

#### API Rate Limits

- OpenAI: Monitor usage in OpenAI dashboard
- Vercel: Check function invocation limits

### Support Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma Documentation**: [prisma.io/docs](https://prisma.io/docs)

## 🎉 Success!

Your AlumniVerse Pro platform is now live! 🚀

**Next Steps:**
1. Configure custom domain (optional)
2. Set up monitoring and alerts
3. Invite users and test features
4. Monitor performance and usage
5. Scale resources as needed

---

## 📞 Support

For deployment issues:
- Check the [GitHub Issues](https://github.com/yourusername/alumniverse-pro/issues)
- Review Vercel deployment logs
- Consult the troubleshooting section above

**Happy Deploying! 🌟**