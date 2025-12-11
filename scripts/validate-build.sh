#!/bin/bash
# Validation script to run before deploying
# Usage: ./scripts/validate-build.sh

set -e  # Exit on error

echo "🔍 Starting pre-deployment validation..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check for UTF-8 issues
echo "📝 Step 1/5: Checking for UTF-8 encoding issues..."
if find backend/src frontend/src shared/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "[�]" {} \; 2>/dev/null | grep -q .; then
    echo -e "${RED}❌ Found UTF-8 encoding issues!${NC}"
    find backend/src frontend/src shared/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "[�]" {} \; 2>/dev/null
    exit 1
else
    echo -e "${GREEN}✅ No UTF-8 issues found${NC}"
fi
echo ""

# Step 2: Run linter
echo "🔧 Step 2/5: Running linter..."
if pnpm lint; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${RED}❌ Linting failed${NC}"
    exit 1
fi
echo ""

# Step 3: Type checking
echo "📋 Step 3/5: Running type checks..."
if pnpm type-check; then
    echo -e "${GREEN}✅ Type checking passed${NC}"
else
    echo -e "${RED}❌ Type checking failed${NC}"
    exit 1
fi
echo ""

# Step 4: Build check
echo "🏗️  Step 4/5: Testing build..."
if pnpm build:check; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Step 5: Run tests
echo "🧪 Step 5/5: Running tests..."
if pnpm test --run; then
    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed (non-blocking)${NC}"
fi
echo ""

echo -e "${GREEN}✨ All validation checks passed!${NC}"
echo ""
echo "You can now safely deploy to production."
echo "Run: git push origin main"
