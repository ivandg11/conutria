import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patients.routes.js';
import consultationRoutes from './routes/consultations.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);

app.use(errorHandler);
app.use('/api/patients', patientRoutes);
app.use('/api', consultationRoutes);
app.listen(process.env.PORT, () =>
  console.log(`API en http://localhost:${process.env.PORT}`),
);
