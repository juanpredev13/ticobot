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

const ANONYMOUS_LIMIT = 3
const AUTHENTICATED_LIMIT = 13

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
