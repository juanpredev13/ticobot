import { SupabaseClient } from '@supabase/supabase-js';

// Query limit constants
// In development, use much higher limits for easier testing
const isDevelopment = process.env.NODE_ENV === 'development';

const DEFAULT_QUERY_LIMIT_FREE = isDevelopment ? 9999 : 10;
const DEFAULT_QUERY_LIMIT_PREMIUM = isDevelopment ? 9999 : 100;
const DEFAULT_QUERY_LIMIT_ADMIN = 999999;

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  tier: 'free' | 'premium' | 'admin';
  query_count_today: number;
  last_query_date: string | null;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  name?: string;
  tier?: 'free' | 'premium' | 'admin';
}

export interface UpdateUserData {
  name?: string;
  tier?: 'free' | 'premium' | 'admin';
  email_verified?: boolean;
  is_active?: boolean;
}

export class UserRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Create a new user
   */
  async create(userData: CreateUserData): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert({
        email: userData.email,
        password_hash: userData.password_hash,
        name: userData.name || null,
        tier: userData.tier || 'free',
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation (duplicate email)
      if (error.code === '23505') {
        throw new Error('Email already exists');
      }
      throw error;
    }

    return data as User;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as User;
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as User;
  }

  /**
   * Update user information
   */
  async update(userId: string, updates: UpdateUserData): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  /**
   * Increment query count for rate limiting
   * Uses Supabase function for atomic operation
   */
  async incrementQueryCount(userId: string): Promise<void> {
    const { error } = await this.supabase.rpc('reset_query_count_if_needed', {
      user_id_param: userId,
    });

    if (error) throw error;

    // Increment the counter
    const { error: incrementError } = await this.supabase
      .from('users')
      .update({
        query_count_today: this.supabase.rpc('increment', {
          x: 1,
        }),
      })
      .eq('id', userId);

    if (incrementError) throw incrementError;
  }

  /**
   * Check if user has exceeded daily query limit
   */
  async hasExceededQueryLimit(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) {
      return true; // User not found = limit exceeded
    }

    const limit = this.getQueryLimitForTier(user.tier);
    return user.query_count_today >= limit;
  }

  /**
   * Get query limit based on user tier
   */
  private getQueryLimitForTier(tier: 'free' | 'premium' | 'admin'): number {
    const limits: Record<'free' | 'premium' | 'admin', number> = {
      free: DEFAULT_QUERY_LIMIT_FREE,
      premium: DEFAULT_QUERY_LIMIT_PREMIUM,
      admin: DEFAULT_QUERY_LIMIT_ADMIN,
    };

    return limits[tier];
  }

  /**
   * Get user's current query count and limit
   */
  async getQueryStats(userId: string): Promise<{
    count: number;
    limit: number;
    remaining: number;
  }> {
    const user = await this.findById(userId);
    if (!user) {
      return { count: 0, limit: 0, remaining: 0 };
    }

    const limit = this.getQueryLimitForTier(user.tier);
    const count = user.query_count_today;
    const remaining = Math.max(0, limit - count);

    return { count, limit, remaining };
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivate(userId: string): Promise<void> {
    await this.update(userId, { is_active: false });
  }

  /**
   * Reactivate user
   */
  async reactivate(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId: string): Promise<void> {
    await this.update(userId, { email_verified: true });
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Get all users (admin only)
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
  }): Promise<User[]> {
    let query = this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!options?.includeInactive) {
      query = query.eq('is_active', true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as User[];
  }

  /**
   * Get user count by tier (admin stats)
   */
  async getCountByTier(): Promise<Record<string, number>> {
    const { data, error } = await this.supabase
      .from('users')
      .select('tier')
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    const counts: Record<string, number> = {
      free: 0,
      premium: 0,
      admin: 0,
    };

    if (data) {
      data.forEach((user) => {
        counts[user.tier] = (counts[user.tier] || 0) + 1;
      });
    }

    return counts;
  }

  /**
   * Reset query count for a user (development/testing only)
   */
  async resetQueryCount(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({
        query_count_today: 0,
        last_query_date: null,
      })
      .eq('id', userId);

    if (error) throw error;
  }
}
