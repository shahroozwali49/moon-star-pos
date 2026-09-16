import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Store from '../models/Store.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireSuperAdmin);
const safeUser = u => ({ id: u._id, name: u.name, email: u.email, role: u.role, storeIds: u.storeIds, active: u.active, createdAt: u.createdAt });

router.get('/stores', async (_req, res, next) => {
  try { res.json({ stores: await Store.find().sort({ name: 1 }) }); } catch (e) { next(e); }
});
router.post('/stores', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim(), code = String(req.body.code || '').trim().toUpperCase();
    if (!name || !code) return res.status(400).json({ message: 'Store name and code are required.' });
    const store = await Store.create({ name, code, address: String(req.body.address || '').trim() });
    res.status(201).json({ store });
  } catch (e) { if (e.code === 11000) return res.status(409).json({ message: 'Store code already exists.' }); next(e); }
});
router.patch('/stores/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid store ID.' });
    const patch = {};
    for (const k of ['name','code','address','active']) if (req.body[k] !== undefined) patch[k] = req.body[k];
    if (patch.code) patch.code = String(patch.code).trim().toUpperCase();
    const store = await Store.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
    if (!store) return res.status(404).json({ message: 'Store not found.' });
    res.json({ store });
  } catch (e) { if (e.code === 11000) return res.status(409).json({ message: 'Store code already exists.' }); next(e); }
});
router.get('/users', async (_req, res, next) => {
  try { res.json({ users: (await User.find().sort({ name: 1 })).map(safeUser) }); } catch (e) { next(e); }
});
router.post('/users', async (req, res, next) => {
  try {
    const { name, email, password, role, storeIds = [] } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!String(name || '').trim() || !normalizedEmail || String(password || '').length < 12)
      return res.status(400).json({ message: 'Name, email, and a password of at least 12 characters are required.' });
    if (!['STORE_ADMIN','CASHIER'].includes(role)) return res.status(400).json({ message: 'Choose Store Admin or Cashier.' });
    if (!Array.isArray(storeIds) || storeIds.some(id => !mongoose.isValidObjectId(id)))
      return res.status(400).json({ message: 'Invalid store assignment.' });
    const validStores = await Store.countDocuments({ _id: { $in: storeIds }, active: true });
    if (validStores !== new Set(storeIds.map(String)).size) return res.status(400).json({ message: 'One or more stores are invalid or inactive.' });
    const user = await User.create({ name: String(name).trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12), role, storeIds });
    res.status(201).json({ user: safeUser(user) });
  } catch (e) { if (e.code === 11000) return res.status(409).json({ message: 'Email already exists.' }); next(e); }
});
router.patch('/users/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'SUPER_ADMIN') return res.status(400).json({ message: 'Super Admin accounts cannot be edited here.' });
    if (req.body.role !== undefined) {
      if (!['STORE_ADMIN','CASHIER'].includes(req.body.role)) return res.status(400).json({ message: 'Invalid role.' });
      user.role = req.body.role;
    }
    if (req.body.active !== undefined) user.active = Boolean(req.body.active);
    if (req.body.storeIds !== undefined) {
      if (!Array.isArray(req.body.storeIds) || req.body.storeIds.some(id => !mongoose.isValidObjectId(id))) return res.status(400).json({ message: 'Invalid store assignment.' });
      const count = await Store.countDocuments({ _id: { $in: req.body.storeIds }, active: true });
      if (count !== new Set(req.body.storeIds.map(String)).size) return res.status(400).json({ message: 'One or more stores are invalid or inactive.' });
      user.storeIds = req.body.storeIds;
    }
    await user.save();
    res.json({ user: safeUser(user) });
  } catch (e) { next(e); }
});
export default router;
