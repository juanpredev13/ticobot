import { SupabaseClient } from '@supabase/supabase-js';

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  is_revoked: boolean;
  created_at: string;
  revoked_at: string | null;
}

export class TokenRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new refresh token
   */
  async create(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<RefreshToken> {
    const { data, error } = await this.supabase
      .from('refresh_tokens')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as RefreshToken;
  }

  /**
   * Find a valid (non-revoked) refresh token
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    const { data, error } = await this.supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_revoked', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as RefreshToken;
  }

  /**
   * Find token with user info (for reuse detection)
   * This checks ALL tokens, including revoked ones
   */
  async findByTokenWithUser(token: string): Promise<(RefreshToken & { user_id: string }) | null> {
    const { data, error } = await this.supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as RefreshToken & { user_id: string };
  }

  /**
   * Detect token reuse (security breach indicator)
   * Returns true if token exists but is revoked
   * This indicates someone is trying to reuse an old token
   */
  async detectTokenReuse(token: string): Promise<{
    isReused: boolean;
    userId?: string;
  }> {
    const tokenRecord = await this.findByTokenWithUser(token);

    if (!tokenRecord) {
      // Token doesn't exist at all
      return { isReused: false };
    }

    // If token is revoked but someone tries to use it = potential breach
    if (tokenRecord.is_revoked === true) {
      return {
        isReused: true,
        userId: tokenRecord.user_id,
      };
    }

    return { isReused: false };
  }

  /**
   * Revoke a single refresh token
   */
  async revoke(token: string): Promise<void> {
    await this.supabase.rpc('revoke_refresh_token', { token_param: token });
  }

  /**
   * Revoke all refresh tokens for a user
   * Used when security breach is detected
   */
  async revokeAllForUser(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Clean up expired and revoked tokens (maintenance)
   */
  async cleanExpiredTokens(): Promise<number> {
    const { data, error } = await this.supabase.rpc('clean_expired_tokens');

    if (error) throw error;
    return data as number;
  }
}
