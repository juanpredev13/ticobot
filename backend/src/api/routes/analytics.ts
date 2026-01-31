import { Router } from "express";
import { Logger } from "@ticobot/shared";
import { createSupabaseClient } from "../../db/supabase.js";

const logger = new Logger("AnalyticsRoutes");
const router = Router();
const supabase = createSupabaseClient();

/**
 * @swagger
 * /api/analytics/utm-visit:
 *   post:
 *     summary: Track UTM visit from social media
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               utm:
 *                 type: object
 *               referrer:
 *                 type: string
 *               userAgent:
 *                 type: string
 *               timestamp:
 *                 type: string
 */
router.post('/utm-visit', async (req, res, next) => {
  try {
    const { utm, referrer, userAgent, timestamp } = req.body;

    // Store UTM visit data
    const { data, error } = await supabase
      .from('utm_visits')
      .insert({
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
        utm_content: utm.content,
        utm_term: utm.term,
        referrer,
        user_agent: userAgent,
        visit_timestamp: timestamp,
        ip_address: req.ip,
      })
      .select();

    if (error) {
      logger.error('Error storing UTM visit:', error);
      return res.status(500).json({ error: 'Failed to track UTM visit' });
    }

    logger.info(`UTM visit tracked: ${utm.source} - ${utm.medium}`);

    // Track with Umami if available
    if (req.headers['user-agent']?.includes('umami')) {
      // Additional Umami specific tracking
    }

    res.json({ success: true, data: data[0] });
  } catch (error) {
    logger.error('UTM visit tracking error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/track-event:
 *   post:
 *     summary: Track custom analytics event
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *               data:
 *                 type: object
 *               timestamp:
 *                 type: string
 *               utm:
 *                 type: object
 */
router.post('/track-event', async (req, res, next) => {
  try {
    const { event, data, timestamp, utm, referrer } = req.body;

    // Store custom event
    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert({
        event_name: event,
        event_data: data,
        utm_source: utm?.source,
        utm_medium: utm?.medium,
        utm_campaign: utm?.campaign,
        utm_content: utm?.content,
        referrer,
        event_timestamp: timestamp,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      })
      .select();

    if (insertError) {
      logger.error('Error storing analytics event:', insertError);
      return res.status(500).json({ error: 'Failed to track event' });
    }

    logger.info(`Analytics event tracked: ${event}`);

    res.json({ success: true });
  } catch (error) {
    logger.error('Analytics event tracking error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/social-conversion:
 *   post:
 *     summary: Track social media conversion (follow, click, etc.)
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform:
 *                 type: string
 *               action:
 *                 type: string
 *               userId:
 *                 type: string
 */
router.post('/social-conversion', async (req, res, next) => {
  try {
    const { platform, action, userId, utm_source, utm_medium, utm_campaign } = req.body;

    // Store social conversion
    const { error } = await supabase
      .from('social_conversions')
      .insert({
        platform,
        action,
        user_id: userId,
        utm_source,
        utm_medium,
        utm_campaign,
        conversion_timestamp: new Date().toISOString(),
        ip_address: req.ip,
      })
      .select();

    if (error) {
      logger.error('Error storing social conversion:', error);
      return res.status(500).json({ error: 'Failed to track conversion' });
    }

    logger.info(`Social conversion tracked: ${platform} - ${action} - ${userId}`);

    res.json({ success: true });
  } catch (error) {
    logger.error('Social conversion tracking error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/user-activity:
 *   get:
 *     summary: Get user activity analytics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 */
router.get('/user-activity', async (req, res, next) => {
  try {
    const { userId, period = 'week' } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    // Get user activity from various tables
    const [
      { data: utmVisits },
      { data: events },
      { data: conversions }
    ] = await Promise.all([
      supabase
        .from('utm_visits')
        .select('*')
        .eq('user_id', userId)
        .gte('visit_timestamp', startDate.toISOString())
        .lte('visit_timestamp', endDate.toISOString()),
      
      supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .gte('event_timestamp', startDate.toISOString())
        .lte('event_timestamp', endDate.toISOString()),
      
      supabase
        .from('social_conversions')
        .select('*')
        .eq('user_id', userId)
        .gte('conversion_timestamp', startDate.toISOString())
        .lte('conversion_timestamp', endDate.toISOString()),
    ]);

    // Aggregate data
    const analytics = {
      period,
      utmVisits: utmVisits?.length || 0,
      events: events?.length || 0,
      conversions: conversions?.length || 0,
      topUTMSources: aggregateUTMSources(utmVisits || []),
      topEvents: aggregateEvents(events || []),
      conversionsByPlatform: aggregateConversions(conversions || []),
    };

    res.json({ success: true, analytics });
  } catch (error) {
    logger.error('User activity analytics error:', error);
    next(error);
  }
});

// Helper functions
function aggregateUTMSources(visits) {
  const sources = {};
  visits.forEach(visit => {
    const source = visit.utm_source || 'direct';
    sources[source] = (sources[source] || 0) + 1;
  });
  return Object.entries(sources)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));
}

function aggregateEvents(events) {
  const eventCounts = {};
  events.forEach(event => {
    const eventName = event.event_name;
    eventCounts[eventName] = (eventCounts[eventName] || 0) + 1;
  });
  return Object.entries(eventCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([event, count]) => ({ event, count }));
}

function aggregateConversions(conversions) {
  const platforms = {};
  conversions.forEach(conv => {
    const platform = conv.platform;
    platforms[platform] = (platforms[platform] || 0) + 1;
  });
  return Object.entries(platforms)
    .sort(([,a], [,b]) => b - a)
    .map(([platform, count]) => ({ platform, count }));
}

export default router;