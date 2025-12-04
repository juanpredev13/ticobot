import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Logger } from '@ticobot/shared';
import ingestRoutes from './routes/ingest';

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

    // Routes
    app.use('/api/ingest', ingestRoutes);

    // Health check
    app.get('/health', (req: Request, res: Response) => {
        res.json({
            status: 'healthy',
            service: 'ticobot-backend',
            timestamp: new Date().toISOString()
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
        logger.info(`   Health: http://localhost:${port}/health`);
        logger.info(`   Ingest API: http://localhost:${port}/api/ingest`);
    });
}

// Start server if this file is run directly
if (require.main === module) {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    startServer(port);
}
