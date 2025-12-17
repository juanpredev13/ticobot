import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Logger } from '@ticobot/shared';
import { swaggerSpec } from './swagger.js';
import authRoutes from './routes/auth.js';
import ingestRoutes from './routes/ingest.js';
import documentsRoutes from './routes/documents.js';
import searchRoutes from './routes/search.js';
import chatRoutes from './routes/chat.js';
import partiesRoutes from './routes/parties.js';
import candidatesRoutes from './routes/candidates.js';
import compareRoutes from './routes/compare.js';

const logger = new Logger('Server');

export function createApp(): Express {
    const app = express();

    // CORS configuration - Supports both CLIENT_URL and FRONTEND_URL for compatibility
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // In development, allow localhost on any port
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const allowedOrigins = isDevelopment
        ? [
            clientUrl,
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
          ]
        : [clientUrl];
    
    const corsOptions = {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            // Allow requests with no origin (like mobile apps, Postman, etc.) in development
            if (isDevelopment && !origin) {
                return callback(null, true);
            }
            
            // In development, be more permissive for SSE
            if (isDevelopment) {
                return callback(null, true);
            }
            
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control'],
        exposedHeaders: ['Content-Type'],
    };
    app.use(cors(corsOptions));
    
    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request logging middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
        logger.info(`${req.method} ${req.path}`);
        next();
    });

    // Swagger API Documentation
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'TicoBot API Documentation'
    }));

    // Swagger JSON spec
    app.get('/api/docs.json', (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/ingest', ingestRoutes);
    app.use('/api/documents', documentsRoutes);
    app.use('/api/search', searchRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/parties', partiesRoutes);
    app.use('/api/candidates', candidatesRoutes);
    app.use('/api/compare', compareRoutes);

    // Health check
    app.get('/health', (req: Request, res: Response) => {
        res.json({
            status: 'healthy',
            service: 'ticobot-backend',
            timestamp: new Date().toISOString(),
            version: '0.1.0'
        });
    });

    // API info endpoint
    app.get('/api', (req: Request, res: Response) => {
        res.json({
            name: 'TicoBot API',
            version: '0.1.0',
            description: 'API for accessing Costa Rica 2026 Government Plans',
            endpoints: {
                health: '/health',
                auth: {
                    register: 'POST /api/auth/register',
                    login: 'POST /api/auth/login',
                    refresh: 'POST /api/auth/refresh',
                    logout: 'POST /api/auth/logout',
                    me: 'GET /api/auth/me'
                },
                documents: {
                    list: 'GET /api/documents',
                    getById: 'GET /api/documents/:id',
                    getChunks: 'GET /api/documents/:id/chunks'
                },
                search: {
                    semantic: 'POST /api/search',
                    semanticGet: 'GET /api/search?q=query'
                },
                chat: {
                    ask: 'POST /api/chat',
                    stream: 'POST /api/chat/stream'
                },
                ingest: {
                    single: 'POST /api/ingest',
                    bulk: 'POST /api/ingest/bulk'
                },
                parties: {
                    list: 'GET /api/parties',
                    getById: 'GET /api/parties/:id',
                    getBySlug: 'GET /api/parties/slug/:slug',
                    getCandidates: 'GET /api/parties/:id/candidates'
                },
                candidates: {
                    list: 'GET /api/candidates',
                    getById: 'GET /api/candidates/:id',
                    getBySlug: 'GET /api/candidates/slug/:slug'
                },
                compare: {
                    compare: 'POST /api/compare'
                }
            },
            documentation: '/api/docs'
        });
    });

    // 404 handler
    app.use((req: Request, res: Response) => {
        res.status(404).json({
            error: 'Not Found',
            path: req.path
        });
    });

    // Error handler
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        logger.error('Unhandled error:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: err.message
        });
    });

    return app;
}

export function startServer(port: number = 3000): void {
    const app = createApp();

    // Listen on 0.0.0.0 to accept connections from all network interfaces (required for Railway)
    const server = app.listen(port, '0.0.0.0', () => {
        logger.info(`🚀 TicoBot Backend Server started on port ${port}`);
        logger.info(`   Listening on: 0.0.0.0:${port}`);
        logger.info(`   API Info: http://localhost:${port}/api`);
        logger.info(`   API Docs: http://localhost:${port}/api/docs`);
        logger.info(`   Health: http://localhost:${port}/health`);
        logger.info(`   Auth: http://localhost:${port}/api/auth`);
        logger.info(`   Documents: http://localhost:${port}/api/documents`);
        logger.info(`   Search: http://localhost:${port}/api/search`);
        logger.info(`   Chat: http://localhost:${port}/api/chat`);
        logger.info(`   Ingest: http://localhost:${port}/api/ingest`);
        logger.info(`   Parties: http://localhost:${port}/api/parties`);
        logger.info(`   Candidates: http://localhost:${port}/api/candidates`);
        logger.info(`   Compare: http://localhost:${port}/api/compare`);
    });

    // Configure Keep-Alive timeout for Railway compatibility
    // Railway expects connections to stay open for ~60 seconds
    // Node.js default is 5 seconds, which can cause 502 errors
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000; // 66 seconds (must be > keepAliveTimeout)
}

// Start server if this file is run directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
    const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
    startServer(port);
}
