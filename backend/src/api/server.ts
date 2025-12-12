import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Logger } from '@ticobot/shared';
import { swaggerSpec } from './swagger.js';
import authRoutes from './routes/auth.js';
import ingestRoutes from './routes/ingest.js';
import documentsRoutes from './routes/documents.js';
import searchRoutes from './routes/search.js';
import chatRoutes from './routes/chat.js';
import partiesRoutes from './routes/parties.js';
import candidatesRoutes from './routes/candidates.js';

const logger = new Logger('Server');

export function createApp(): Express {
    const app = express();

    // CORS configuration - Enhanced for Railway deployment
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const corsOptions = {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            // Allow requests with no origin (like mobile apps, Postman, or curl)
            if (!origin) {
                return callback(null, true);
            }
            // Allow requests from frontend URL
            if (origin === frontendUrl) {
                return callback(null, true);
            }
            // In development, allow localhost
            if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
                return callback(null, true);
            }
            // Reject other origins
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Content-Length', 'X-Request-Id'],
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
    app.listen(port, '0.0.0.0', () => {
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
    });
}

// Start server if this file is run directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    startServer(port);
}
