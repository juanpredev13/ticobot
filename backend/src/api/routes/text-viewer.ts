import { Router, type Router as RouterType } from 'express';
import { createSupabaseClient } from '../../db/supabase.js';

const router: RouterType = Router();

/**
 * @route GET /api/text-viewer/documents
 * @desc Get all documents with basic metadata
 * @access Public (temporarily)
 */
router.get('/documents', async (req, res) => {
  try {
    const supabase = createSupabaseClient();

    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, party_id, page_count, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get party info
    const { data: parties } = await supabase
      .from('parties')
      .select('id, name, abbreviation');

    // Map party names
    const documentsWithParty = documents?.map(doc => {
      const party = parties?.find(p => p.id === doc.party_id);
      return {
        ...doc,
        partyName: party?.name || 'Unknown',
        partyAbbreviation: party?.abbreviation || 'N/A'
      };
    });

    res.json({
      success: true,
      data: documentsWithParty || []
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/text-viewer/documents/:id/chunks
 * @desc Get all chunks for a specific document
 * @access Public (temporarily)
 */
router.get('/documents/:id/chunks', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    console.log(`[TextViewer] Fetching chunks for document ${id}, page ${page}, limit ${limit}`);

    const supabase = createSupabaseClient();

    // Get total count
    const { count, error: countError } = await supabase
      .from('chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', id);

    if (countError) {
      console.error('[TextViewer] Error counting chunks:', countError);
      throw countError;
    }

    console.log(`[TextViewer] Found ${count} total chunks for document ${id}`);

    // Get chunks - Note: Not selecting embedding field as it's very large
    // Join with documents to get party info
    const { data: chunks, error } = await supabase
      .from('chunks')
      .select(`
        id,
        content,
        chunk_index,
        document_id,
        documents!inner(party_id, party_name)
      `)
      .eq('document_id', id)
      .order('chunk_index', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[TextViewer] Error fetching chunks:', error);
      throw new Error(`Supabase error: ${JSON.stringify(error)}`);
    }

    console.log(`[TextViewer] Retrieved ${chunks?.length || 0} chunks`);

    // Check if chunks have embeddings (separate query for performance)
    const chunkIds = chunks?.map(c => c.id) || [];
    const { data: embeddingCheck } = await supabase
      .from('chunks')
      .select('id')
      .in('id', chunkIds)
      .not('embedding', 'is', null);

    const chunksWithEmbeddings = new Set(embeddingCheck?.map(c => c.id) || []);

    // Analyze chunks
    const analyzedChunks = chunks?.map((chunk: any) => {
      const content = chunk.content || '';
      const hasEncoding = content.includes('�') || content.includes('\ufffd');
      const whitespaceRatio = content.length > 0
        ? (content.match(/\s/g) || []).length / content.length
        : 0;
      const hasExcessiveWhitespace = whitespaceRatio > 0.4;

      // Extract party info from joined documents table
      const partyName = chunk.documents?.party_name || 'Unknown';
      const partyId = chunk.documents?.party_id || '';

      return {
        id: chunk.id,
        content: chunk.content,
        chunk_index: chunk.chunk_index,
        party_id: partyId,
        party_name: partyName,
        length: content.length,
        hasEmbedding: chunksWithEmbeddings.has(chunk.id),
        hasEncodingIssues: hasEncoding,
        hasExcessiveWhitespace,
        whitespaceRatio: Math.round(whitespaceRatio * 100)
      };
    }) || [];

    const response = {
      success: true,
      data: {
        chunks: analyzedChunks,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    };

    console.log(`[TextViewer] Sending response with ${analyzedChunks.length} chunks`);
    res.json(response);
  } catch (error) {
    console.error('[TextViewer] Error fetching chunks:', error);
    console.error('[TextViewer] Error type:', typeof error);
    console.error('[TextViewer] Error stack:', error instanceof Error ? error.stack : 'N/A');

    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null
        ? JSON.stringify(error)
        : String(error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch chunks',
      message: errorMessage,
      details: error
    });
  }
});

/**
 * @route GET /api/text-viewer/documents/:id/full-text
 * @desc Get full extracted text for a document
 * @access Public (temporarily)
 */
router.get('/documents/:id/full-text', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = createSupabaseClient();

    const { data: chunks, error } = await supabase
      .from('chunks')
      .select('content, chunk_index')
      .eq('document_id', id)
      .order('chunk_index', { ascending: true });

    if (error) throw error;

    const fullText = chunks?.map(c => c.content).join('\n\n') || '';

    res.json({
      success: true,
      data: {
        fullText,
        chunkCount: chunks?.length || 0,
        totalLength: fullText.length
      }
    });
  } catch (error) {
    console.error('Error fetching full text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch full text',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
