import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import User from './models/User.js';

const required = ['MONGODB_URI','JWT_SECRET','CLIENT_ORIGIN','SEED_ADMIN_EMAIL','SEED_ADMIN_PASSWORD'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters.');
const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_ORIGIN.split(',').map(s => s.trim()), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});

await mongoose.connect(process.env.MONGODB_URI);
const existing = await User.findOne({ role: 'SUPER_ADMIN' });
if (!existing) {
  await User.create({
    name: process.env.SEED_ADMIN_NAME || 'Super Admin',
    email: process.env.SEED_ADMIN_EMAIL.trim().toLowerCase(),
    passwordHash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12),
    role: 'SUPER_ADMIN', storeIds: []
  });
  console.log('Initial Super Admin created. Change its password after first login.');
}
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on ${port}`));
