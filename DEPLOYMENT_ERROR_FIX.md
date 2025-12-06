# 🔧 Deployment Error Fix Guide

## Common Deployment Errors and Solutions

### ❌ Error 1: Build Failures with React 19 + Next.js 16.0.1

**Problem:**
- Build fails with errors like: "Cannot read properties of null (reading 'useState'/'useContext')"
- Security vulnerabilities in React Server Components
- Static generation failures

**Root Cause:**
- React 19.2.0 is incompatible with Next.js 16.0.1
- Next.js 16.0.1 has known issues with React 19

**Solution:**
✅ **FIXED** - Updated `package.json`:
- Upgraded Next.js from `16.0.1` to `^16.0.7` (or latest)
- Downgraded React from `19.2.0` to `^19.0.1` (stable version)
- Updated `eslint-config-next` to match Next.js version

**Action Required:**
1. Run `npm install` locally to update dependencies
2. Test build locally: `npm run build`
3. Commit and push changes
4. Redeploy on Vercel

---

### ❌ Error 2: "MONGODB_URI is not set"

**Problem:**
- Build fails with error: "MONGODB_URI is not set"

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `MONGODB_URI` with your MongoDB Atlas connection string
3. Select environments: Production, Preview, Development
4. **Redeploy** after adding variables

**Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/madeenajuba?retryWrites=true&w=majority
```

---

### ❌ Error 3: "Cloudinary configuration error"

**Problem:**
- Image uploads fail
- Cloudinary errors in build logs

**Solution:**
Add these environment variables in Vercel:
1. `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Your cloud name
2. `CLOUDINARY_API_KEY` - Your API key
3. `CLOUDINARY_API_SECRET` - Your API secret

**Important:** 
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` must have `NEXT_PUBLIC_` prefix
- All three variables are required
- Redeploy after adding

---

### ❌ Error 4: Build Timeout

**Problem:**
- Build takes too long and times out
- Vercel build fails after several minutes

**Solutions:**
1. **Check build logs** in Vercel dashboard for specific errors
2. **Reduce build complexity:**
   - Remove unused dependencies
   - Optimize images
   - Check for infinite loops in build process
3. **Increase build timeout** (Vercel Pro plan)
4. **Check for missing dependencies** in `package.json`

---

### ❌ Error 5: TypeScript Errors

**Problem:**
- TypeScript compilation errors during build

**Solution:**
1. Run `npm run build` locally to see errors
2. Fix TypeScript errors in your code
3. Ensure all types are properly defined
4. Check `tsconfig.json` configuration

---

### ❌ Error 6: Module Not Found

**Problem:**
- Error: "Cannot find module 'X'"
- Missing dependencies

**Solution:**
1. Check if dependency is in `package.json`
2. Run `npm install` to install missing packages
3. Ensure dependency is in `dependencies` not `devDependencies` (for production)
4. Commit `package-lock.json` if it exists

---

### ❌ Error 7: Environment Variables Not Loading

**Problem:**
- Variables set in Vercel but not working in app
- Runtime errors about missing env vars

**Solution:**
1. **Verify variable names** are exact (case-sensitive):
   - ✅ `MONGODB_URI` (not `mongodb_uri`)
   - ✅ `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (not `CLOUDINARY_CLOUD_NAME`)
2. **Check environment selection:**
   - Variables must be set for Production environment
   - Also set for Preview/Development if needed
3. **Redeploy after adding variables:**
   - Environment variables only load on new deployments
   - Go to Deployments → Click "..." → Redeploy

---

## Quick Fix Checklist

Before deploying, ensure:

- [ ] ✅ Dependencies are compatible (Next.js 16.0.7+ with React 19.0.1)
- [ ] ✅ All environment variables are set in Vercel
- [ ] ✅ Variable names are correct (case-sensitive)
- [ ] ✅ Build works locally: `npm run build`
- [ ] ✅ No TypeScript errors
- [ ] ✅ All dependencies are in `package.json`
- [ ] ✅ MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- [ ] ✅ Cloudinary credentials are correct

---

## Step-by-Step Fix Process

### 1. Fix Dependencies (Already Done)
```bash
# Dependencies have been updated in package.json
npm install
npm run build  # Test locally
```

### 2. Set Environment Variables in Vercel
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all required variables (see VERCEL_DEPLOYMENT.md)
5. Save each variable

### 3. Redeploy
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Or push a new commit to trigger deployment

### 4. Verify
1. Check build logs for errors
2. Visit deployed URL
3. Test key features:
   - Homepage loads
   - User registration/login
   - Database connection
   - Image uploads

---

## Still Having Issues?

1. **Check Vercel Build Logs:**
   - Go to your deployment
   - Click on the failed deployment
   - Review "Build Logs" section
   - Look for specific error messages

2. **Test Locally:**
   ```bash
   npm install
   npm run build
   npm start
   ```
   - If it works locally but fails on Vercel, it's likely an environment variable issue

3. **Check Vercel Function Logs:**
   - Go to your project → Functions tab
   - Check runtime logs for errors

4. **Verify MongoDB Atlas:**
   - Network Access allows 0.0.0.0/0 (or Vercel IPs)
   - Connection string is correct
   - Database user has proper permissions

---

## Common Error Messages and Solutions

| Error Message | Solution |
|-------------|----------|
| "MONGODB_URI is not set" | Add MONGODB_URI in Vercel env vars |
| "Cannot find module" | Add missing dependency to package.json |
| "Build timeout" | Check build logs, optimize build |
| "Type error" | Fix TypeScript errors in code |
| "Cloudinary error" | Add all 3 Cloudinary env vars |
| "Cannot read properties of null" | Update Next.js to 16.0.7+ |

---

**Last Updated:** After fixing React/Next.js compatibility issue
