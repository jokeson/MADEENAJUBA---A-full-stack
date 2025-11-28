#!/bin/bash

# Script to push MADEENAJUBA application to GitHub
# Make sure you have authenticated with GitHub first

echo "🚀 Pushing MADEENAJUBA application to GitHub..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the project root directory"
    exit 1
fi

# Check git status
echo "📋 Current git status:"
git status --short
echo ""

# Show current branch
echo "🌿 Current branch:"
git branch
echo ""

# Show remote
echo "🔗 Remote repository:"
git remote -v
echo ""

# Attempt to push
echo "⬆️  Pushing to GitHub..."
echo "   (You may be prompted for GitHub credentials)"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "   Repository: https://github.com/jokeson/MADEENAJUBA---A-full-stack"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "   1. You have authenticated with GitHub"
    echo "   2. You have access to the repository"
    echo "   3. The repository exists at: https://github.com/jokeson/MADEENAJUBA---A-full-stack"
    echo ""
    echo "💡 To authenticate:"
    echo "   - Use a Personal Access Token as your password"
    echo "   - Create one at: https://github.com/settings/tokens"
    echo "   - Select 'repo' scope for full repository access"
fi

