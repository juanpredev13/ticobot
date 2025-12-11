import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Database types matching the candidates table schema
 */
export interface Candidate {
  id: string;
  party_id: string;
  name: string;
  slug: string;
  position: string;
  photo_url: string | null;
  birth_date: string | null;
  birth_place: string | null;
  education: string[] | null;
  professional_experience: string[] | null;
  political_experience: string[] | null;
  biography: string | null;
  proposals: {
    topic: string;
    description: string;
  }[] | null;
  social_media: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCandidateData {
  party_id: string;
  name: string;
  slug: string;
  position: string;
  photo_url?: string;
  birth_date?: string;
  birth_place?: string;
  education?: string[];
  professional_experience?: string[];
  political_experience?: string[];
  biography?: string;
  proposals?: {
    topic: string;
    description: string;
  }[];
  social_media?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

export interface UpdateCandidateData {
  party_id?: string;
  name?: string;
  slug?: string;
  position?: string;
  photo_url?: string;
  birth_date?: string;
  birth_place?: string;
  education?: string[];
  professional_experience?: string[];
  political_experience?: string[];
  biography?: string;
  proposals?: {
    topic: string;
    description: string;
  }[];
  social_media?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

/**
 * Repository for candidate database operations
 */
export class CandidatesService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Get all candidates
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
    party_id?: string;
    position?: string;
  }): Promise<Candidate[]> {
    let query = this.supabase
      .from('candidates')
      .select('*')
      .order('name', { ascending: true });

    if (options?.party_id) {
      query = query.eq('party_id', options.party_id);
    }

    if (options?.position) {
      query = query.eq('position', options.position);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset !== undefined) {
      const limit = options.limit || 100;
      query = query.range(options.offset, options.offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as Candidate[];
  }

  /**
   * Get candidate by ID
   */
  async findById(id: string): Promise<Candidate | null> {
    const { data, error } = await this.supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as Candidate;
  }

  /**
   * Get candidate by slug
   */
  async findBySlug(slug: string): Promise<Candidate | null> {
    const { data, error } = await this.supabase
      .from('candidates')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as Candidate;
  }

  /**
   * Get candidates by party ID
   */
  async findByPartyId(partyId: string): Promise<Candidate[]> {
    const { data, error } = await this.supabase
      .from('candidates')
      .select('*')
      .eq('party_id', partyId)
      .order('position', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as Candidate[];
  }

  /**
   * Create a new candidate
   */
  async create(candidateData: CreateCandidateData): Promise<Candidate> {
    const { data, error } = await this.supabase
      .from('candidates')
      .insert({
        party_id: candidateData.party_id,
        name: candidateData.name,
        slug: candidateData.slug,
        position: candidateData.position,
        photo_url: candidateData.photo_url || null,
        birth_date: candidateData.birth_date || null,
        birth_place: candidateData.birth_place || null,
        education: candidateData.education || null,
        professional_experience: candidateData.professional_experience || null,
        political_experience: candidateData.political_experience || null,
        biography: candidateData.biography || null,
        proposals: candidateData.proposals || null,
        social_media: candidateData.social_media || null,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        throw new Error('Candidate with this slug already exists');
      }
      // Check for foreign key violation
      if (error.code === '23503') {
        throw new Error('Party not found');
      }
      throw error;
    }

    return data as Candidate;
  }

  /**
   * Update candidate information
   */
  async update(id: string, updates: UpdateCandidateData): Promise<Candidate> {
    const { data, error } = await this.supabase
      .from('candidates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Candidate;
  }

  /**
   * Delete a candidate
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Check if candidate exists by slug
   */
  async existsBySlug(slug: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('candidates')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  /**
   * Get candidate count
   */
  async count(options?: {
    party_id?: string;
    position?: string;
  }): Promise<number> {
    let query = this.supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true });

    if (options?.party_id) {
      query = query.eq('party_id', options.party_id);
    }

    if (options?.position) {
      query = query.eq('position', options.position);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }
}

