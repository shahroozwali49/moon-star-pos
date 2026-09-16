import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const cookieOptions = () => ({
  httpOnly: true, secure: process.env.COOKIE_SECURE === 'true',
  sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  path: '/', maxAge: 8 * 60 * 60 * 1000
});
const publicUser = u => ({ id: u._id, name: u.name, email: u.email, role: u.role, storeIds: u.storeIds, active: u.active });

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: 'Invalid email or password.' });
    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.cookie('pos_token', token, cookieOptions());
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});
router.post('/logout', (_req, res) => {
  res.clearCookie('pos_token', { ...cookieOptions(), maxAge: undefined });
  res.json({ message: 'Logged out.' });
});
router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
export default router;
