# Vercel Deployment Guide

This guide will help you deploy your MADEENAJUBA application to Vercel with automatic deployments from GitHub.

## Prerequisites

1. ✅ Your code is committed and pushed to GitHub
2. ✅ You have a Vercel account (sign up at [vercel.com](https://vercel.com))
3. ✅ MongoDB Atlas account (for production database)
4. ✅ Cloudinary account (for image storage)

## Step 1: Prepare Your Repository

Your repository is already prepared with:
- ✅ `.gitignore` configured correctly
- ✅ `.env.example` with all required variables
- ✅ `package.json` with build scripts
- ✅ `next.config.ts` configured

## Step 2: Connect GitHub to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Sign in with your GitHub account (recommended for easy integration)

2. **Import Your Repository**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose your GitHub repository: `Madeenajubafull_stack`
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset**: Vercel will auto-detect "Next.js" ✅
   - **Root Directory**: Leave as default (or set to `./` if needed)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

## Step 3: Configure Environment Variables

**IMPORTANT**: Add all environment variables in Vercel before deploying!

1. In the Vercel project setup, go to "Environment Variables" section
2. Add each variable:

### Required Environment Variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/madeenajuba?retryWrites=true&w=majority
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
NODE_ENV=production
```

**How to add:**
- Click "Add" for each variable
- Enter the variable name (e.g., `MONGODB_URI`)
- Enter the variable value
- Select environments: **Production**, **Preview**, and **Development** (or just Production for now)
- Click "Save"

### Getting Your Values:

#### MongoDB Atlas Connection String:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace `<dbname>` with `madeenajuba` (or your database name)

#### Cloudinary Credentials:
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Navigate to "Settings" → "Security"
3. Copy:
   - **Cloud Name** → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

## Step 4: Deploy

1. After adding all environment variables, click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Build your Next.js application
   - Deploy to production
3. Wait for the build to complete (usually 2-5 minutes)

## Step 5: Verify Deployment

1. Once deployed, Vercel will provide you with a URL like:
   - `https://your-project-name.vercel.app`
2. Visit the URL to verify your application is working
3. Test key features:
   - User authentication
   - Database connections
   - Image uploads (Cloudinary)

## Step 6: Set Up Automatic Deployments

✅ **Automatic deployments are already configured!**

When you connect GitHub to Vercel, automatic deployments are enabled by default:

- **Production**: Every push to `main` branch triggers a production deployment
- **Preview**: Every push to other branches creates a preview deployment
- **Pull Requests**: Creates preview deployments for PRs

### Workflow:
```
Development → Commit → Push to GitHub → Vercel Auto-Deploys → Live!
```

## Step 7: Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails

**Error: "MONGODB_URI is not set"**
- Solution: Make sure you added `MONGODB_URI` in Vercel environment variables

**Error: "Cloudinary configuration error"**
- Solution: Verify all three Cloudinary variables are set:
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

**Error: Build timeout**
- Solution: Check your build logs in Vercel dashboard for specific errors

### Runtime Errors

**Database connection issues**
- Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or add Vercel IPs
- Check your MongoDB connection string is correct

**Image upload fails**
- Verify Cloudinary credentials are correct
- Check Cloudinary API key has upload permissions

## Environment-Specific Configuration

Vercel supports different environment variables for different environments:

- **Production**: Used for production deployments (main branch)
- **Preview**: Used for preview deployments (other branches, PRs)
- **Development**: Used for local development (when running `vercel dev`)

You can set different values for each environment if needed.

## Monitoring & Analytics

Vercel provides:
- **Analytics**: View page views, performance metrics
- **Logs**: Real-time function logs
- **Speed Insights**: Core Web Vitals monitoring

Access these from your Vercel dashboard.

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test all features
3. ✅ Set up custom domain (optional)
4. ✅ Configure monitoring and analytics
5. ✅ Set up database backups (MongoDB Atlas)

## Support

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Next.js Deployment: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- MongoDB Atlas: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

**Your application is now ready for production deployment! 🚀**

