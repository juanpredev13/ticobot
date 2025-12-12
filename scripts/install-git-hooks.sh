#!/bin/bash

# Script to install git pre-commit hook for type-checking
# This ensures TypeScript changes are validated before commit

echo "🔧 Installing git pre-commit hook for type-check..."

HOOK_FILE=".git/hooks/pre-commit"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Create hooks directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/.git/hooks"

# Create pre-commit hook
cat > "$PROJECT_ROOT/$HOOK_FILE" << 'EOF'
#!/bin/bash

# Pre-commit hook to run type-check before committing
# This ensures TypeScript changes are validated before commit

echo "🔍 Running type-check before commit..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not a git repository"
  exit 1
fi

# Get list of staged TypeScript files
STAGED_TS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)

# If there are no TypeScript files staged, skip type-check
if [ -z "$STAGED_TS_FILES" ]; then
  echo "✅ No TypeScript files staged, skipping type-check"
  exit 0
fi

echo "📝 Found TypeScript files staged for commit:"
echo "$STAGED_TS_FILES" | sed 's/^/   - /'

# Run type-check
echo ""
echo "🔧 Running pnpm type-check..."
pnpm type-check

# Check exit status
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Type-check failed! Please fix TypeScript errors before committing."
  echo "   You can skip this check with: git commit --no-verify"
  exit 1
fi

# Run build:check to ensure everything builds correctly
echo ""
echo "🔨 Running pnpm build:check..."
pnpm build:check

# Check exit status
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Build check failed! Please fix build errors before committing."
  echo "   You can skip this check with: git commit --no-verify"
  exit 1
fi

echo ""
echo "✅ Type-check and build check passed! Proceeding with commit..."
exit 0
EOF

# Make hook executable
chmod +x "$PROJECT_ROOT/$HOOK_FILE"

echo "✅ Pre-commit hook installed successfully!"
echo ""
echo "📝 The hook will automatically run 'pnpm type-check' before each commit"
echo "   if you have TypeScript files (.ts, .tsx) staged."
echo ""
echo "💡 To skip the hook (not recommended): git commit --no-verify"

