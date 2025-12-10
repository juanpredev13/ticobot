// Usage tracking for 2-tier system
// Tier 1: 3 free anonymous chats
// Tier 2: 13 total chats (10 more) with account

export type UsageStatus = {
  tier: "anonymous" | "authenticated"
  chatsUsed: number
  chatsRemaining: number
  totalAllowed: number
  needsAuth: boolean
  limitReached: boolean
}

// In development, use much higher limits
const isDevelopment = process.env.NODE_ENV === 'development' || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')

const ANONYMOUS_LIMIT = isDevelopment ? 9999 : 3
const AUTHENTICATED_LIMIT = isDevelopment ? 9999 : 13

export function getUsageStatus(isAuthenticated: boolean): UsageStatus {
  if (isAuthenticated) {
    const chatsUsed = getAuthenticatedChatsUsed()
    return {
      tier: "authenticated",
      chatsUsed,
      chatsRemaining: Math.max(0, AUTHENTICATED_LIMIT - chatsUsed),
      totalAllowed: AUTHENTICATED_LIMIT,
      needsAuth: false,
      limitReached: chatsUsed >= AUTHENTICATED_LIMIT,
    }
  } else {
    const chatsUsed = getAnonymousChatsUsed()
    return {
      tier: "anonymous",
      chatsUsed,
      chatsRemaining: Math.max(0, ANONYMOUS_LIMIT - chatsUsed),
      totalAllowed: ANONYMOUS_LIMIT,
      needsAuth: chatsUsed >= ANONYMOUS_LIMIT,
      limitReached: false, // Anonymous users can upgrade
    }
  }
}

export function incrementChatUsage(isAuthenticated: boolean): void {
  if (isAuthenticated) {
    const current = getAuthenticatedChatsUsed()
    localStorage.setItem("ticobot_auth_chats", (current + 1).toString())
  } else {
    const current = getAnonymousChatsUsed()
    localStorage.setItem("ticobot_anon_chats", (current + 1).toString())
  }
}

export function canSendMessage(isAuthenticated: boolean): boolean {
  const status = getUsageStatus(isAuthenticated)
  if (!isAuthenticated) {
    return status.chatsUsed < ANONYMOUS_LIMIT
  }
  return status.chatsUsed < AUTHENTICATED_LIMIT
}

function getAnonymousChatsUsed(): number {
  if (typeof window === "undefined") return 0
  const stored = localStorage.getItem("ticobot_anon_chats")
  return stored ? Number.parseInt(stored, 10) : 0
}

function getAuthenticatedChatsUsed(): number {
  if (typeof window === "undefined") return 0
  const stored = localStorage.getItem("ticobot_auth_chats")
  return stored ? Number.parseInt(stored, 10) : 0
}

export function resetUsageForTesting(): void {
  localStorage.removeItem("ticobot_anon_chats")
  localStorage.removeItem("ticobot_auth_chats")
}

/**
 * Reset query count on backend (development only)
 * Call this if you're authenticated and want to reset the server-side counter
 */
export async function resetBackendQueryCount(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    console.warn('No access token found. Cannot reset backend query count.');
    return;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${apiUrl}/api/auth/reset-query-count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'Failed to reset query count');
    }

    console.log('✅ Backend query count reset successfully');
  } catch (error) {
    console.error('❌ Failed to reset backend query count:', error);
    throw error;
  }
}

/**
 * Reset all usage counters (frontend + backend)
 * Use this in development to reset everything at once
 */
export async function resetAllUsageCounters(): Promise<void> {
  // Reset frontend counters
  resetUsageForTesting();
  
  // Reset backend counter if authenticated
  try {
    await resetBackendQueryCount();
  } catch (error) {
    // If not authenticated or endpoint not available, that's okay
    console.log('Backend reset skipped (not authenticated or not in dev mode)');
  }
  
  console.log('✅ All usage counters reset');
}
