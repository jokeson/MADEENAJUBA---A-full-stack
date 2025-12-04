# 🔧 Fix: Environment Variables Not Working in Vercel

## Problem
Your application is deployed but showing errors like:
- `MONGODB_URI is not set`
- `Error fetching posts`
- `Error getting events`
- No data/images loading

## Solution: Verify Environment Variables in Vercel

### Step 1: Go to Your Vercel Project Settings

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project name
3. Click on **"Settings"** tab (top navigation)
4. Click on **"Environment Variables"** (left sidebar)

### Step 2: Verify All Required Variables Are Set

Make sure you have **ALL** of these variables set:

#### ✅ Required Variables:

1. **MONGODB_URI**
   - Value: Your MongoDB Atlas connection string
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/madeenajuba?retryWrites=true&w=majority`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

2. **MONGODB_DB_NAME**
   - Value: `madeenajuba` (or your database name)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

3. **NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME**
   - Value: Your Cloudinary cloud name
   - Environments: ✅ Production, ✅ Preview, ✅ Development

4. **CLOUDINARY_API_KEY**
   - Value: Your Cloudinary API key
   - Environments: ✅ Production, ✅ Preview, ✅ Development

5. **CLOUDINARY_API_SECRET**
   - Value: Your Cloudinary API secret
   - Environments: ✅ Production, ✅ Preview, ✅ Development

6. **NODE_ENV**
   - Value: `production`
   - Environments: ✅ Production only

### Step 3: Check Variable Names (Case-Sensitive!)

⚠️ **IMPORTANT**: Variable names are case-sensitive! Make sure they match exactly:

- ✅ `MONGODB_URI` (not `mongodb_uri` or `MongoDB_URI`)
- ✅ `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (must have `NEXT_PUBLIC_` prefix)
- ✅ `CLOUDINARY_API_KEY` (not `cloudinary_api_key`)
- ✅ `CLOUDINARY_API_SECRET` (not `cloudinary_api_secret`)

### Step 4: Redeploy After Adding Variables

**CRITICAL**: After adding or updating environment variables:

1. Go to your project's **"Deployments"** tab
2. Click the **"..."** menu (three dots) on the latest deployment
3. Click **"Redeploy"**
4. Or make a small change and push to GitHub to trigger a new deployment

**Why?** Environment variables are only loaded when a new deployment starts. Existing deployments won't pick up new variables.

### Step 5: Verify Variables Are Loaded

After redeploying, check the build logs:

1. Go to your deployment
2. Click on the deployment
3. Check the "Build Logs" section
4. Look for any errors about missing environment variables

## Common Issues

### Issue 1: Variables Set But Still Not Working

**Solution**: 
- Make sure you selected the correct environments (Production, Preview, Development)
- Redeploy your application after adding variables
- Check for typos in variable names

### Issue 2: MongoDB Connection String Format

Make sure your `MONGODB_URI` is in the correct format:
- ✅ `mongodb+srv://username:password@cluster.mongodb.net/madeenajuba?retryWrites=true&w=majority`
- ❌ `mongodb+srv:username:password@cluster...` (missing `//`)

### Issue 3: Cloudinary Variables

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Must have `NEXT_PUBLIC_` prefix (used in client-side code)
- `CLOUDINARY_API_KEY` - No prefix needed (server-side only)
- `CLOUDINARY_API_SECRET` - No prefix needed (server-side only)

## Quick Checklist

- [ ] All 6 environment variables are set in Vercel
- [ ] Variable names match exactly (case-sensitive)
- [ ] All variables are set for Production environment
- [ ] Application has been redeployed after adding variables
- [ ] MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- [ ] Cloudinary credentials are correct

## Still Not Working?

1. **Check Vercel Function Logs**:
   - Go to your project → "Functions" tab
   - Check runtime logs for specific errors

2. **Test Locally First**:
   - Make sure your `.env.local` works locally
   - Copy the exact values to Vercel

3. **Verify MongoDB Atlas**:
   - Check MongoDB Atlas Network Access allows connections from anywhere
   - Verify your connection string is correct
   - Test the connection string in MongoDB Compass

4. **Verify Cloudinary**:
   - Check Cloudinary dashboard for correct credentials
   - Make sure API key has upload permissions

---

**After fixing environment variables, your application should work correctly!** 🚀

