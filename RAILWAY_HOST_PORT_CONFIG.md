# Railway Host and Port Configuration

This document confirms that both backend and frontend are configured according to Railway's requirements.

## Railway Requirements

According to [Railway's documentation](https://docs.railway.com/reference/errors/application-failed-to-respond):

1. **Host**: Must bind to `0.0.0.0` (all network interfaces)
2. **Port**: Must use the `PORT` environment variable provided by Railway

## Frontend (Next.js) Configuration

### Current Setup

**File**: `frontend/server.js`

```javascript
// Get port from Railway or default to 3000
const PORT = process.env.PORT || '3000';

// Start Next.js with explicit port and host
const nextProcess = spawn('npx', ['next', 'start', '-H', '0.0.0.0', '--port', PORT], {
  // ...
});
```

✅ **Host**: `-H 0.0.0.0` (correct)
✅ **Port**: `--port ${PORT}` (correct, reads from `process.env.PORT`)

### Railway Recommendation for Next.js

Railway recommends:
```bash
next start --port ${PORT-3000}
```

Our implementation is equivalent but more robust:
- Uses `server.js` to read `process.env.PORT` (works in all environments)
- Uses `-H 0.0.0.0` flag for host (required)
- Uses `--port` flag for port (required)

## Backend (Express) Configuration

### Current Setup

**File**: `backend/src/api/server.ts`

```typescript
export function startServer(port: number = 3000): void {
    const app = createApp();
    
    // Listen on 0.0.0.0 to accept connections from all network interfaces (required for Railway)
    const server = app.listen(port, '0.0.0.0', () => {
        logger.info(`🚀 TicoBot Backend Server started on port ${port}`);
        logger.info(`   Listening on: 0.0.0.0:${port}`);
        // ...
    });
}
```

**File**: `backend/src/index.ts`

```typescript
// Start API server
const port = parseInt(env.PORT as string) || 3001;
startServer(port);
```

✅ **Host**: `'0.0.0.0'` (correct)
✅ **Port**: Reads from `process.env.PORT` via `env.PORT` (correct)

### Railway Recommendation for Express

Railway recommends:
```javascript
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", function () {
  // ...
});
```

Our implementation matches this exactly:
- Reads `PORT` from environment variables
- Listens on `0.0.0.0`
- Has proper error handling and logging

## Verification Checklist

- [x] Frontend binds to `0.0.0.0`
- [x] Frontend uses `PORT` environment variable
- [x] Backend binds to `0.0.0.0`
- [x] Backend uses `PORT` environment variable
- [x] Both services have proper fallback ports (3000 for frontend, 3001 for backend)
- [x] Keep-Alive timeout configured for backend (65 seconds for Railway compatibility)

## Testing Locally

To test that the configuration works:

1. **Frontend**:
   ```bash
   cd frontend
   PORT=8080 node server.js
   # Should start on 0.0.0.0:8080
   ```

2. **Backend**:
   ```bash
   cd backend
   PORT=3001 pnpm start
   # Should start on 0.0.0.0:3001
   ```

## Troubleshooting

If you see "Application Not Listening on the Correct Host or Port" error:

1. **Check logs**: Verify that services show:
   - Frontend: `Host: 0.0.0.0` and `Port: <PORT>`
   - Backend: `Listening on: 0.0.0.0:<PORT>`

2. **Verify PORT is set**: Railway automatically sets `PORT`, but you can check in Railway Dashboard → Variables

3. **Check for port conflicts**: Ensure no other service is using the same port

4. **Verify network binding**: Services must bind to `0.0.0.0`, not `localhost` or `127.0.0.1`

