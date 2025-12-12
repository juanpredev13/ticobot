# Railway Troubleshooting Guide

## Error: `start.sh: line 35: exec: next: not found`

**Symptom**: Railway is trying to execute `start.sh` which no longer exists.

**Cause**: Railway may be using cached configuration or the dashboard settings are overriding `railway.toml`.

**Solution**:

1. **Verify Railway Config as Code is enabled**:
   - Go to Railway Dashboard → Frontend Service → Settings
   - Find "Config-as-code" section
   - Ensure "Railway config file path" is **empty** or set to `railway.toml`
   - If it's set to something else, clear it

2. **Clear Custom Start Command in Dashboard**:
   - Go to Railway Dashboard → Frontend Service → Settings → Deploy
   - Find "Custom Start Command" field
   - **Clear it completely** (leave it empty)
   - This allows `railway.toml` to take precedence

3. **Force a fresh deployment**:
   - Go to Railway Dashboard → Frontend Service → Deployments
   - Click "Redeploy" or "Deploy Latest"
   - Wait for the build to complete

4. **Verify the correct command is being used**:
   - Check the deployment logs
   - Should show: `pnpm --filter @ticobot/frontend start`
   - Should NOT show: `start.sh` or `bash start.sh`

## Warning: `ExperimentalWarning: Importing JSON modules`

**Symptom**: Multiple warnings about JSON module imports being experimental.

**Cause**: Using `import packageJson from 'package.json' with { type: 'json' }` triggers experimental warnings in Node.js.

**Solution**: This has been fixed by using `readFileSync` and `JSON.parse` instead of JSON imports. The warnings should disappear after the next deployment.

## Warning: `npm warn config production Use --omit=dev instead`

**Symptom**: Warning about production config during install.

**Cause**: When `NODE_ENV=production` is set, npm/pnpm detects production environment and shows this deprecation warning.

**Solution**: This warning is **harmless** and doesn't affect functionality. We need devDependencies (TypeScript, etc.) for the build anyway, so they will be installed regardless.

## Verifying Configuration

To verify your Railway configuration is correct:

1. **Check service names**:
   - Backend service must be named exactly: `backend`
   - Frontend service must be named exactly: `frontend`
   - Case-sensitive!

2. **Check Root Directory**:
   - Both services should have Root Directory = `.` (repository root)
   - NOT `backend/` or `frontend/`

3. **Check Config as Code**:
   - Railway config file path should be empty or `railway.toml`
   - This tells Railway to use the `railway.toml` file

4. **Check deployment logs**:
   - Should show: `pnpm --filter @ticobot/backend start` for backend
   - Should show: `pnpm --filter @ticobot/frontend start` for frontend

## Still Having Issues?

If the problem persists:

1. **Disable Config as Code temporarily**:
   - In Railway Dashboard → Settings → Config-as-code
   - Disable it temporarily
   - Manually set the start command to: `pnpm --filter @ticobot/frontend start`
   - Redeploy

2. **Check for conflicting railway.json files**:
   - `railway.toml` has priority, but if Config as Code is disabled, individual `railway.json` files are used
   - Verify `frontend/railway.json` has the correct start command

3. **Contact Railway Support**:
   - Provide deployment logs
   - Mention that you're using Config as Code with `railway.toml`
   - Include the service names and Root Directory settings

