import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Database types matching the parties table schema
 */
export interface Party {
  id: string;
  name: string;
  abbreviation: string | null;
  slug: string;
  founded_year: number | null;
  ideology: string[] | null;
  colors: {
    primary: string;
    secondary: string;
  };
  logo_url: string | null;
  description: string | null;
  website: string | null;
  social_media: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  } | null;
  current_representation: {
    deputies: number;
    mayors: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePartyData {
  name: string;
  abbreviation?: string;
  slug: string;
  founded_year?: number;
  ideology?: string[];
  colors: {
    primary: string;
    secondary: string;
  };
  logo_url?: string;
  description?: string;
  website?: string;
  social_media?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  current_representation?: {
    deputies: number;
    mayors: number;
  };
}

export interface UpdatePartyData {
  name?: string;
  abbreviation?: string;
  slug?: string;
  founded_year?: number;
  ideology?: string[];
  colors?: {
    primary: string;
    secondary: string;
  };
  logo_url?: string;
  description?: string;
  website?: string;
  social_media?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  current_representation?: {
    deputies: number;
    mayors: number;
  };
}

/**
 * Repository for party database operations
 */
export class PartiesService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Get all parties
   * Returns top 5 parties first, then remaining parties alphabetically
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Party[]> {
    // Hardcoded top 5 party slugs (in priority order)
    // PLN, CAC, PS (Pueblo Soberano), FA, PUSC
    const TOP_5_SLUGS = ['liberacion-nacional', 'coalicion-agenda-ciudadana', 'pueblo-soberano', 'frente-amplio', 'unidad-social-cristiana'];

    let query = this.supabase
      .from('parties')
      .select('*')
      .order('name', { ascending: true });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset !== undefined) {
      const limit = options.limit || 100;
      query = query.range(options.offset, options.offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    const parties = (data || []) as Party[];

    // Reorder: top 5 first, then remaining alphabetically
    const top5Parties: Party[] = [];
    const otherParties: Party[] = [];

    // Separate parties into top 5 and others
    for (const party of parties) {
      if (TOP_5_SLUGS.includes(party.slug)) {
        top5Parties.push(party);
      } else {
        otherParties.push(party);
      }
    }

    // Sort top 5 by their position in TOP_5_SLUGS array
    top5Parties.sort((a, b) => {
      const indexA = TOP_5_SLUGS.indexOf(a.slug);
      const indexB = TOP_5_SLUGS.indexOf(b.slug);
      return indexA - indexB;
    });

    // Return top 5 first, then others (already alphabetically sorted)
    return [...top5Parties, ...otherParties];
  }

  /**
   * Get party by ID
   */
  async findById(id: string): Promise<Party | null> {
    const { data, error } = await this.supabase
      .from('parties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as Party;
  }

  /**
   * Get party by slug
   */
  async findBySlug(slug: string): Promise<Party | null> {
    const { data, error } = await this.supabase
      .from('parties')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as Party;
  }

  /**
   * Get party by abbreviation
   */
  async findByAbbreviation(abbreviation: string): Promise<Party | null> {
    const { data, error } = await this.supabase
      .from('parties')
      .select('*')
      .eq('abbreviation', abbreviation.toUpperCase())
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as Party | null;
  }

  /**
   * Create a new party
   */
  async create(partyData: CreatePartyData): Promise<Party> {
    const { data, error } = await this.supabase
      .from('parties')
      .insert({
        name: partyData.name,
        abbreviation: partyData.abbreviation || null,
        slug: partyData.slug,
        founded_year: partyData.founded_year || null,
        ideology: partyData.ideology || null,
        colors: partyData.colors,
        logo_url: partyData.logo_url || null,
        description: partyData.description || null,
        website: partyData.website || null,
        social_media: partyData.social_media || null,
        current_representation: partyData.current_representation || null,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        throw new Error('Party with this name or slug already exists');
      }
      throw error;
    }

    return data as Party;
  }

  /**
   * Update party information
   */
  async update(id: string, updates: UpdatePartyData): Promise<Party> {
    const { data, error } = await this.supabase
      .from('parties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Party;
  }

  /**
   * Delete a party
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('parties')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Check if party exists by slug
   */
  async existsBySlug(slug: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('parties')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  /**
   * Get party count
   */
  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from('parties')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }
}

