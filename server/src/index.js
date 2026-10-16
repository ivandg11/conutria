import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patients.routes.js';
import appointmentRoutes from './routes/appointments.routes.js';
import consultationRoutes from './routes/consultations.routes.js';
import adminRoutes from './routes/admin.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';
import stripeWebhookRoutes from './routes/stripe-webhook.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.set('trust proxy', 'loopback');

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookRoutes);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api', consultationRoutes);
app.use(errorHandler);
const port = process.env.PORT || 4000;
app.listen(port, '0.0.0.0', () => console.log('API escuchando en el puerto ' + port));
