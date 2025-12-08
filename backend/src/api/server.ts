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

const logger = new Logger('Server');

export function createApp(): Express {
    const app = express();

    // Middleware
    app.use(cors());
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

    app.listen(port, () => {
        logger.info(`🚀 TicoBot Backend Server started on port ${port}`);
        logger.info(`   API Info: http://localhost:${port}/api`);
        logger.info(`   API Docs: http://localhost:${port}/api/docs`);
        logger.info(`   Health: http://localhost:${port}/health`);
        logger.info(`   Auth: http://localhost:${port}/api/auth`);
        logger.info(`   Documents: http://localhost:${port}/api/documents`);
        logger.info(`   Search: http://localhost:${port}/api/search`);
        logger.info(`   Chat: http://localhost:${port}/api/chat`);
        logger.info(`   Ingest: http://localhost:${port}/api/ingest`);
    });
}

// Start server if this file is run directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    startServer(port);
}
