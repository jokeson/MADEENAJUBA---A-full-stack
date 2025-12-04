# 🚀 Quick Deploy Guide

## Super Simple Workflow

```
Write Code → Run Deploy Script → Live on Your Domain!
```

## Method 1: Using the Deploy Script (Recommended)

### Quick Deploy:
```bash
./deploy.sh "Your commit message here"
```

### Example:
```bash
./deploy.sh "Add user profile page"
./deploy.sh "Fix login bug"
./deploy.sh "Update hero section design"
```

### Interactive Mode (if you forget the message):
```bash
./deploy.sh
```
It will prompt you to enter a commit message.

---

## Method 2: Manual Git Commands

If you prefer to do it manually:

```bash
# Stage all changes
git add .

# Commit with message
git commit -m "Your commit message here"

# Push to GitHub
git push origin main
```

---

## What Happens Next?

1. ✅ Your code is pushed to GitHub
2. ⏳ Vercel automatically detects the push (takes ~10 seconds)
3. 🔨 Vercel builds your application (takes 2-5 minutes)
4. 🚀 Your changes go live on your domain!

---

## Check Deployment Status

- **Vercel Dashboard**: https://vercel.com/dashboard
- Click on your project → "Deployments" tab
- You'll see the build progress in real-time

---

## Tips

1. **Test Locally First**: Run `npm run dev` before deploying
2. **Commit Often**: Small, frequent commits are better
3. **Descriptive Messages**: Use clear commit messages
4. **Check Logs**: If deployment fails, check Vercel build logs

---

## Troubleshooting

### Script won't run?
```bash
chmod +x deploy.sh
```

### No changes to commit?
The script will tell you if there are no changes.

### Push failed?
- Check your internet connection
- Verify you're on the `main` branch: `git branch`
- Make sure you have GitHub access configured

---

**That's it! Happy coding! 🎉**

