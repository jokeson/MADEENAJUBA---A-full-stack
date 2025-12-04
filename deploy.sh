#!/bin/bash

# Quick Deploy Script for MADEENAJUBA
# Usage: ./deploy.sh "Your commit message here"
# Or: ./deploy.sh (will prompt for message)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 MADEENAJUBA Quick Deploy${NC}\n"

# Check if commit message was provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Enter your commit message:${NC}"
    read -r COMMIT_MSG
else
    COMMIT_MSG="$1"
fi

# Check if there are any changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  No changes to commit.${NC}"
    exit 0
fi

echo -e "\n${BLUE}📦 Staging changes...${NC}"
git add .

echo -e "${BLUE}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MSG"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Commit failed!${NC}"
    exit 1
fi

echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
git push origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Push failed!${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Successfully pushed to GitHub!${NC}"
echo -e "${BLUE}⏳ Vercel will automatically deploy your changes...${NC}"
echo -e "${BLUE}📊 Check deployment status at: https://vercel.com/dashboard${NC}\n"

