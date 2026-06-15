import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { router as authRouter } from './routes/auth.js';
import { router as usersRouter } from './routes/users.js';
import { router as groupsRouter } from './routes/groups.js';
import { router as expensesRouter } from './routes/expenses.js';
import { router as settlementsRouter } from './routes/settlements.js';
import { router as importsRouter } from './routes/imports.js';
import { router as adminRouter } from './routes/admin.js';
import { router as dashboardRouter } from './routes/dashboard.js';
import { router as notificationsRouter } from './routes/notifications.js';
import { authenticateToken } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/dashboard', authenticateToken, dashboardRouter);
app.use('/api/notifications', authenticateToken, notificationsRouter);
app.use('/api/users', authenticateToken, usersRouter);
app.use('/api/groups', authenticateToken, groupsRouter);
app.use('/api/expenses', authenticateToken, expensesRouter);
app.use('/api/settlements', authenticateToken, settlementsRouter);
app.use('/api/imports', authenticateToken, importsRouter);
app.use('/api/admin', authenticateToken, adminRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`SplitFlow API running on port ${PORT}`));
