import express, { Express } from 'express';
import onboardingRoutes from './routes/onboardingRoutes';
import entryRoutes from './routes/entryRoutes';
import customerAuthRoutes from './routes/customerAuthRoutes';
import customerRoutes from './routes/customerRoutes';
import staffRoutes from './routes/staffRoutes';
import { errorMiddleware } from './middleware/errorMiddleware';

export function createExpressApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Security Headers & CORS
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'SEYO Merchant & Customer Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routes
  app.use('/api/onboarding', onboardingRoutes);
  app.use('/api/entry', entryRoutes);
  app.use('/api/auth', customerAuthRoutes);
  app.use('/api/customer', customerRoutes);
  app.use('/api/staff', staffRoutes);

  // Central Error Handler
  app.use(errorMiddleware);

  return app;
}
