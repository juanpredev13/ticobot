import { Router, type Router as RouterType } from 'express';
import { createSupabaseClient } from '../../db/supabase.js';
import { QualityAnalysisService } from '../../db/services/quality-analysis.service.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router: RouterType = Router();

/**
 * @route GET /api/quality/analyze
 * @desc Run complete quality analysis
 * @access Admin only (temporarily disabled for testing)
 */
router.get('/analyze', async (req, res) => {
  try {
    const supabase = createSupabaseClient();
    const qualityService = new QualityAnalysisService(supabase);

    const report = await qualityService.analyzeQuality();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Quality analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze content quality',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
