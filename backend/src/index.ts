import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';

import authRoutes from './modules/auth/routes';
import factoryRoutes from './modules/factories/routes';
import productionRoutes from './modules/production/routes';
import dispatchRoutes from './modules/dispatch/routes';
import customerRoutes from './modules/customers/routes';
import fuelRoutes from './modules/fuel/routes';
import labourRoutes from './modules/labour/routes';
import rawMaterialRoutes from './modules/raw-materials/routes';
import reportRoutes from './modules/reports/routes';
import superAdminRoutes from './modules/super-admin/routes';
import userRoutes from './modules/users/routes';
import expenditureRoutes from './modules/expenditure/routes';
import editRoutes from './modules/edit/routes';
import invoiceRoutes from './modules/invoice/routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting - higher for super admin
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });

app.use('/api/super-admin', adminLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/factories', factoryRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/labour', labourRoutes);
app.use('/api/raw-materials', rawMaterialRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenditure', expenditureRoutes);
app.use('/api/edit', editRoutes);
app.use('/api', invoiceRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.listen(config.port, () => {
  console.log(`BrickPro API running on port ${config.port}`);
});

export default app;
