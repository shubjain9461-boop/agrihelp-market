/**
 * ═══════════════════════════════════════════════════════════════
 * AGRIHELP — Backend Server
 * Node.js + Express.js + MongoDB + Socket.IO
 * 
 * Start: npm install && node server.js
 * ═══════════════════════════════════════════════════════════════
 */

const express   = require('express');
const http      = require('http');
const { Server }= require('socket.io');
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }
});

/* ───────────────────────────────
   MIDDLEWARE
─────────────────────────────── */
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Rate limiting — protect auth routes
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,
  message: { error: 'Too many attempts. Try again in 15 minutes.' } });
const apiLimiter  = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use('/api/', apiLimiter);

/* ───────────────────────────────
   MONGODB MODELS
─────────────────────────────── */

// User Schema (Farmer + Buyer share same collection, role differentiates)
const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  mobile:      { type: String, trim: true },
  password:    { type: String, required: true, select: false },
  role:        { type: String, enum: ['farmer', 'buyer'], required: true },
  // Location (GeoJSON for MongoDB spatial queries)
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  state:       { type: String },
  district:    { type: String },
  primaryCrop: { type: String },            // for farmers
  farmSize:    { type: Number },            // acres
  rating:      { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  isVerified:  { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
  lastSeen:    { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.index({ location: '2dsphere' }); // Geospatial index
const User = mongoose.model('User', userSchema);

// Buyer Requirement Schema
const requirementSchema = new mongoose.Schema({
  buyer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName:   { type: String },
  product:     { type: String, required: true, trim: true },
  quantity:    { type: Number, required: true },         // quintals
  priceOffered:{ type: Number, required: true },         // ₹ per quintal
  phone:       { type: String, required: true },
  buyerType:   { type: String, enum: ['Wholesaler','Retailer','Exporter','Processor','Restaurant'], default: 'Wholesaler' },
  deadline:    { type: Date },
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }      // [lng, lat]
  },
  isActive:    { type: Boolean, default: true },
  urgent:      { type: Boolean, default: false },
  interestedFarmers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

requirementSchema.index({ location: '2dsphere' });
const Requirement = mongoose.model('Requirement', requirementSchema);

// Rating Schema
const ratingSchema = new mongoose.Schema({
  ratedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stars:     { type: Number, min: 1, max: 5, required: true },
  comment:   { type: String, maxlength: 300 },
}, { timestamps: true });
const Rating = mongoose.model('Rating', ratingSchema);

// Chat Message Schema
const messageSchema = new mongoose.Schema({
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true, maxlength: 1000 },
  read:      { type: Boolean, default: false },
}, { timestamps: true });
const Message = mongoose.model('Message', messageSchema);

/* ───────────────────────────────
   JWT MIDDLEWARE
─────────────────────────────── */
const JWT_SECRET = process.env.JWT_SECRET || 'agrihelp_dev_secret_2026';

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const requireRole = (role) => (req, res, next) =>
  req.user.role === role ? next() : res.status(403).json({ error: `Only ${role}s can do this.` });

/* ═══════════════════════════════════════════════════════════════
   AUTH ROUTES — /api/auth
═══════════════════════════════════════════════════════════════ */

/**
 * POST /api/auth/register
 * Register new farmer or buyer
 */
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, mobile, password, role, lat, lng } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }
    if (!['farmer', 'buyer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be farmer or buyer.' });
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email, mobile, password: hashed, role,
      location: lat && lng ? { type: 'Point', coordinates: [lng, lat] } : undefined,
    });

    const token = jwt.sign({ id: user._id, email, role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: user._id, name, email, role }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

/**
 * POST /api/auth/login
 * Login with email + password
 */
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required.' });
    }
    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });
    const token = jwt.sign({ id: user._id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, email, role: user.role, rating: user.rating }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

/* ═══════════════════════════════════════════════════════════════
   USER ROUTES — /api/users
═══════════════════════════════════════════════════════════════ */

/** GET /api/users/profile — Get own profile */
app.get('/api/users/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch { res.status(500).json({ error: 'Failed to fetch profile.' }); }
});

/** PUT /api/users/profile — Update profile + location */
app.put('/api/users/profile', authenticate, async (req, res) => {
  try {
    const { name, mobile, state, district, primaryCrop, farmSize, lat, lng } = req.body;
    const update = { name, mobile, state, district, primaryCrop, farmSize };
    if (lat && lng) update.location = { type: 'Point', coordinates: [lng, lat] };

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    res.json({ message: 'Profile updated.', user });
  } catch { res.status(500).json({ error: 'Update failed.' }); }
});

/* ═══════════════════════════════════════════════════════════════
   REQUIREMENTS (BUYER POSTS) — /api/requirements
═══════════════════════════════════════════════════════════════ */

/**
 * POST /api/requirements
 * Buyer posts a new requirement
 */
app.post('/api/requirements', authenticate, requireRole('buyer'), async (req, res) => {
  try {
    const { product, quantity, priceOffered, phone, buyerType, deadline, lat, lng, urgent } = req.body;

    if (!product || !quantity || !priceOffered || !phone || !lat || !lng) {
      return res.status(400).json({ error: 'Product, quantity, price, phone, and location are required.' });
    }

    const buyer = await User.findById(req.user.id);
    const req_ = await Requirement.create({
      buyer: req.user.id,
      buyerName: buyer.name,
      product, quantity: parseInt(quantity),
      priceOffered: parseInt(priceOffered),
      phone, buyerType, urgent: !!urgent,
      deadline: deadline ? new Date(deadline) : undefined,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }
    });

    // Emit real-time event to all connected farmers
    io.emit('new_requirement', {
      id: req_._id,
      buyerName: buyer.name,
      product, quantity, priceOffered,
      lat, lng, urgent,
      message: `New buyer: ${buyer.name} needs ${quantity} qt ${product} @ ₹${priceOffered}/qt`
    });

    res.status(201).json({ message: 'Requirement posted successfully.', requirement: req_ });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post requirement.' });
  }
});

/**
 * GET /api/requirements/nearby
 * Farmer fetches nearby buyer requirements
 * Query: lat, lng, maxDistanceKm, product, minPrice, sortBy
 * Uses MongoDB $nearSphere for spatial query
 */
app.get('/api/requirements/nearby', authenticate, async (req, res) => {
  try {
    const { lat, lng, maxDistanceKm = 50, product, minPrice = 0, sortBy = 'distance' } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required.' });

    const maxDistM = parseFloat(maxDistanceKm) * 1000; // convert km → meters
    const query = {
      isActive: true,
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: maxDistM
        }
      }
    };
    if (product) query.product = new RegExp(product, 'i');
    if (minPrice) query.priceOffered = { $gte: parseInt(minPrice) };

    let requirements = await Requirement.find(query)
      .populate('buyer', 'name rating ratingCount')
      .limit(50)
      .lean();

    // Add Haversine distance to each result
    requirements = requirements.map(r => {
      const [rLng, rLat] = r.location.coordinates;
      const dist = haversine(parseFloat(lat), parseFloat(lng), rLat, rLng);
      return { ...r, distanceKm: parseFloat(dist.toFixed(2)) };
    });

    // Sort
    if (sortBy === 'price')    requirements.sort((a, b) => b.priceOffered - a.priceOffered);
    if (sortBy === 'quantity') requirements.sort((a, b) => b.quantity - a.quantity);
    // 'distance' is already sorted by MongoDB $nearSphere

    res.json({ count: requirements.length, requirements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch requirements.' });
  }
});

/** GET /api/requirements/my — Buyer's own requirements */
app.get('/api/requirements/my', authenticate, requireRole('buyer'), async (req, res) => {
  try {
    const reqs = await Requirement.find({ buyer: req.user.id }).sort('-createdAt');
    res.json(reqs);
  } catch { res.status(500).json({ error: 'Failed to fetch.' }); }
});

/** DELETE /api/requirements/:id */
app.delete('/api/requirements/:id', authenticate, async (req, res) => {
  try {
    const r = await Requirement.findOne({ _id: req.params.id, buyer: req.user.id });
    if (!r) return res.status(404).json({ error: 'Requirement not found.' });
    await r.deleteOne();
    io.emit('requirement_deleted', { id: req.params.id });
    res.json({ message: 'Requirement deleted.' });
  } catch { res.status(500).json({ error: 'Delete failed.' }); }
});

/** PUT /api/requirements/:id — Update */
app.put('/api/requirements/:id', authenticate, requireRole('buyer'), async (req, res) => {
  try {
    const { quantity, priceOffered, deadline, urgent } = req.body;
    const r = await Requirement.findOneAndUpdate(
      { _id: req.params.id, buyer: req.user.id },
      { quantity, priceOffered, deadline, urgent },
      { new: true }
    );
    if (!r) return res.status(404).json({ error: 'Not found.' });
    io.emit('requirement_updated', r);
    res.json({ message: 'Updated.', requirement: r });
  } catch { res.status(500).json({ error: 'Update failed.' }); }
});

/* ═══════════════════════════════════════════════════════════════
   RATINGS — /api/ratings
═══════════════════════════════════════════════════════════════ */

/** POST /api/ratings — Rate a user */
app.post('/api/ratings', authenticate, async (req, res) => {
  try {
    const { userId, stars, comment } = req.body;
    if (!userId || !stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'userId and stars (1-5) required.' });
    }
    if (userId === req.user.id) {
      return res.status(400).json({ error: "You can't rate yourself." });
    }

    // Upsert — one rating per pair
    await Rating.findOneAndUpdate(
      { ratedBy: req.user.id, ratedUser: userId },
      { stars, comment },
      { upsert: true, new: true }
    );

    // Recalculate user's average rating
    const ratings = await Rating.find({ ratedUser: userId });
    const avg = ratings.reduce((s, r) => s + r.stars, 0) / ratings.length;
    await User.findByIdAndUpdate(userId, { rating: parseFloat(avg.toFixed(1)), ratingCount: ratings.length });

    res.json({ message: 'Rating submitted.', averageRating: avg.toFixed(1) });
  } catch { res.status(500).json({ error: 'Rating failed.' }); }
});

/* ═══════════════════════════════════════════════════════════════
   MESSAGES — /api/messages
═══════════════════════════════════════════════════════════════ */

/** POST /api/messages — Send a message */
app.post('/api/messages', authenticate, async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    if (!recipientId || !content) {
      return res.status(400).json({ error: 'recipientId and content required.' });
    }
    const msg = await Message.create({
      sender: req.user.id, recipient: recipientId, content
    });

    // Emit real-time to recipient's socket room
    io.to(`user_${recipientId}`).emit('new_message', {
      from: req.user.id, content, timestamp: msg.createdAt
    });

    res.status(201).json({ message: 'Sent.', msg });
  } catch { res.status(500).json({ error: 'Send failed.' }); }
});

/** GET /api/messages/:userId — Conversation with a user */
app.get('/api/messages/:userId', authenticate, async (req, res) => {
  try {
    const msgs = await Message.find({
      $or: [
        { sender: req.user.id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.id }
      ]
    }).sort('createdAt').limit(100);

    // Mark as read
    await Message.updateMany({ sender: req.params.userId, recipient: req.user.id, read: false }, { read: true });

    res.json(msgs);
  } catch { res.status(500).json({ error: 'Fetch failed.' }); }
});

/* ═══════════════════════════════════════════════════════════════
   ANALYTICS — /api/analytics
═══════════════════════════════════════════════════════════════ */

/** GET /api/analytics/dashboard — Stats for logged-in user */
app.get('/api/analytics/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user   = await User.findById(userId).select('-password');

    if (user.role === 'buyer') {
      const activeListings = await Requirement.countDocuments({ buyer: userId, isActive: true });
      const totalListings  = await Requirement.countDocuments({ buyer: userId });
      const messages       = await Message.countDocuments({ recipient: userId });
      res.json({ role: 'buyer', activeListings, totalListings, messages,
        rating: user.rating, ratingCount: user.ratingCount });
    } else {
      const messages    = await Message.countDocuments({ recipient: userId });
      const nearbyCount = await Requirement.countDocuments({ isActive: true });
      res.json({ role: 'farmer', nearbyBuyers: nearbyCount, messages,
        rating: user.rating, ratingCount: user.ratingCount });
    }
  } catch { res.status(500).json({ error: 'Analytics failed.' }); }
});

/* ═══════════════════════════════════════════════════════════════
   HAVERSINE (Server-side utility)
═══════════════════════════════════════════════════════════════ */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
            Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/* ═══════════════════════════════════════════════════════════════
   SOCKET.IO — REAL-TIME EVENTS
═══════════════════════════════════════════════════════════════ */
const onlineUsers = new Map(); // userId → socketId

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Authenticate socket with JWT
  socket.on('auth', (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.join(`user_${decoded.id}`);
      onlineUsers.set(decoded.id, socket.id);
      io.emit('user_online', { userId: decoded.id, count: onlineUsers.size });
      console.log(`✅ Authenticated socket: ${decoded.id} (${decoded.role})`);
    } catch {
      socket.emit('auth_error', 'Invalid token');
    }
  });

  // Farmer updates location in real-time
  socket.on('update_location', ({ lat, lng }) => {
    if (!socket.userId) return;
    User.findByIdAndUpdate(socket.userId, {
      location: { type: 'Point', coordinates: [lng, lat] }
    }).exec();
    socket.broadcast.emit('farmer_location_updated', { userId: socket.userId, lat, lng });
  });

  // Farmer expresses interest in a requirement
  socket.on('express_interest', async ({ requirementId }) => {
    if (!socket.userId) return;
    const req = await Requirement.findByIdAndUpdate(
      requirementId, { $addToSet: { interestedFarmers: socket.userId } }, { new: true }
    );
    if (req) {
      io.to(`user_${req.buyer}`).emit('farmer_interested', {
        requirementId, farmerId: socket.userId
      });
    }
  });

  // Live chat message
  socket.on('send_message', async ({ to, content }) => {
    if (!socket.userId || !content) return;
    const msg = await Message.create({ sender: socket.userId, recipient: to, content });
    io.to(`user_${to}`).emit('new_message', { from: socket.userId, content, id: msg._id });
    socket.emit('message_sent', { to, content, id: msg._id });
  });

  // Typing indicator
  socket.on('typing', ({ to }) => {
    io.to(`user_${to}`).emit('user_typing', { from: socket.userId });
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user_offline', { userId: socket.userId, count: onlineUsers.size });
    }
    console.log(`❌ Disconnected: ${socket.id}`);
  });
});

/* ═══════════════════════════════════════════════════════════════
   HEALTH CHECK
═══════════════════════════════════════════════════════════════ */
app.get('/api/health', (_, res) => res.json({
  status: 'OK', app: 'AgriHelp API', version: '1.0.0',
  timestamp: new Date().toISOString(), onlineUsers: onlineUsers.size
}));

/* ═══════════════════════════════════════════════════════════════
   START
═══════════════════════════════════════════════════════════════ */
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agrihelp_db')
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => console.log(`🌿 AgriHelp API running on http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ DB error:', err));

module.exports = { app, io };
