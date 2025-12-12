# Git Hooks - Type Check Before Commit

This project includes a pre-commit git hook that automatically runs TypeScript type-checking before each commit.

## Purpose

The pre-commit hook ensures that:
- TypeScript errors are caught before code is committed
- The codebase maintains type safety
- CI/CD pipelines are less likely to fail due to type errors

## Installation

Run the installation script:

```bash
./scripts/install-git-hooks.sh
```

This will install the pre-commit hook in `.git/hooks/pre-commit`.

## How It Works

1. **Automatic Detection**: The hook only runs if you have TypeScript files (`.ts`, `.tsx`) staged for commit
2. **Type Check**: Runs `pnpm type-check` which checks:
   - `@ticobot/shared` package
   - `@ticobot/backend` package  
   - `@ticobot/frontend` package
3. **Block Commit**: If type-check fails, the commit is blocked
4. **Skip Option**: You can skip the hook with `git commit --no-verify` (not recommended)

## Example Output

### When TypeScript files are staged:
```
🔍 Running type-check before commit...
📝 Found TypeScript files staged for commit:
   - backend/src/api/routes/auth.ts
   - frontend/components/button.tsx

🔧 Running pnpm type-check...
✅ Type-check passed! Proceeding with commit...
```

### When no TypeScript files are staged:
```
🔍 Running type-check before commit...
✅ No TypeScript files staged, skipping type-check
```

### When type-check fails:
```
🔍 Running type-check before commit...
📝 Found TypeScript files staged for commit:
   - backend/src/api/routes/auth.ts

🔧 Running pnpm type-check...
❌ Type-check failed! Please fix TypeScript errors before committing.
   You can skip this check with: git commit --no-verify
```

## Manual Type Check

You can also run type-check manually at any time:

```bash
pnpm type-check
```

## Disabling the Hook

If you need to commit without running type-check (not recommended):

```bash
git commit --no-verify
```

**Warning**: Only use `--no-verify` if absolutely necessary. Type errors should be fixed before committing.

## Troubleshooting

### Hook not running
- Verify the hook is installed: `ls -la .git/hooks/pre-commit`
- Check if it's executable: `chmod +x .git/hooks/pre-commit`
- Reinstall: `./scripts/install-git-hooks.sh`

### Hook too slow
- The hook only runs when TypeScript files are staged
- If it's still slow, consider running type-check only for changed packages

### Hook blocking legitimate commits
- Fix the TypeScript errors first
- Or use `git commit --no-verify` as a last resort

