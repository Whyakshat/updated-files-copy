require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Order = require('./models/Order');
const Review = require('./models/Review');
const fetch = require('node-fetch');

const app = express();

// ── MIDDLEWARE ──
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('../frontend'));

// ── In-Memory Fallback Store (jab MongoDB connect na ho) ──
let inMemoryOrders = [];
let dbConnected = false;
mongoose.connection.on('connected', () => { dbConnected = true; });
mongoose.connection.on('disconnected', () => { dbConnected = false; });

// ── MongoDB Connection ──
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected: freshplate DB'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('💡 Make sure MongoDB chal raha hai ya .env mein MONGO_URI sahi hai');
  });

// ── JWT Token Generator ──
const signToken = (id, role, name, email) => {
  return jwt.sign(
    { id, role, name, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ── Auth Middleware ──
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Please login first' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access only' });
  }
  next();
};

// ═══════════════════════════════════════════════
//  USER ROUTES
// ═══════════════════════════════════════════════

// POST /api/auth/register — Naya user register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email aur password required hain'
      });
    }

    // Cannot register with admin email
    if (email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot use this email'
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Yeh email pehle se registered hai'
      });
    }

    // Create user
    const user = await User.create({ name, email, phone, password });

    const token = signToken(user._id, user.role, user.name, user.email);

    res.status(201).json({
      success: true,
      message: `Welcome ${user.name}! Account ban gaya 🎉`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
});

// POST /api/auth/login — User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email aur password daalen'
      });
    }

    // Do not allow admin to login from user portal
    if (email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Please use admin portal'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ya password galat hai'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ya password galat hai'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated, please contact support'
      });
    }

    const token = signToken(user._id, user.role, user.name, user.email);

    res.json({
      success: true,
      message: `Welcome back ${user.name}! 👋`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
});

// ═══════════════════════════════════════════════
//  ADMIN ROUTES
// ═══════════════════════════════════════════════

// POST /api/admin/login — Admin login (hardcoded credentials)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email aur password daalen'
      });
    }

    // Hardcoded admin credentials check
    if (
      email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase() ||
      password !== 'akshat123'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Admin credentials galat hain'
      });
    }

    const token = signToken('admin_001', 'admin', 'Akshat Ojha', email);

    res.json({
      success: true,
      message: 'Admin dashboard mein welcome hai! 🚀',
      token,
      user: {
        id: 'admin_001',
        name: 'Akshat Ojha',
        email: email,
        role: 'admin'
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/users — Saare users dekhein (admin only)
app.get('/api/admin/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch users' });
  }
});

// GET /api/admin/stats — Dashboard stats
app.get('/api/admin/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const newToday = await User.countDocuments({ createdAt: { $gte: todayStart } });

    res.json({
      success: true,
      stats: {
        totalUsers,
        newToday,
        activeUsers: totalUsers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch stats' });
  }
});

// DELETE /api/admin/users/:id — User delete
app.delete('/api/admin/users/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete' });
  }
});

// PATCH /api/admin/users/:id — Update user (role, isActive)
app.patch('/api/admin/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const { isActive, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (isActive !== undefined) user.isActive = isActive;
    if (role !== undefined) user.role = role;
    
    await user.save();
    res.json({ success: true, message: 'User updated successfully', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update user' });
  }
});

// GET /api/admin/reviews — Saare reviews dekhein
app.get('/api/admin/reviews', protect, adminOnly, async (req, res) => {
  try {
    const { sentiment } = req.query;
    let filter = {};
    if (sentiment) {
      if (sentiment.includes(',')) {
         filter.sentiment = { $in: sentiment.split(',') };
      } else {
         filter.sentiment = sentiment;
      }
    }
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch reviews' });
  }
});

// GET /api/user/profile — Logged in user ka profile
app.get('/api/user/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch profile' });
  }
});

// ═══════════════════════════════════════════════
//  ORDER ROUTES
// ═══════════════════════════════════════════════

// POST /api/orders — Website se order save karo (no auth needed)
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, item, price, category } = req.body;
    if (!item) return res.status(400).json({ success: false, message: 'Item name required hai' });

    const orderData = {
      customerName: customerName || 'Guest',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      item,
      price: price || 0,
      category: category || 'Other',
      status: 'pending',
      source: 'website',
      createdAt: new Date()
    };

    if (dbConnected) {
      const order = await Order.create(orderData);
      return res.status(201).json({ success: true, message: 'Order saved', order });
    } else {
      // In-memory fallback
      orderData._id = 'mem_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
      inMemoryOrders.unshift(orderData);
      return res.status(201).json({ success: true, message: 'Order saved (memory)', order: orderData });
    }
  } catch (err) {
    console.error('Order save error:', err.message);
    res.status(500).json({ success: false, message: 'Could not save order' });
  }
});

// GET /api/admin/orders — Admin: saare orders dekhein
app.get('/api/admin/orders', protect, adminOnly, async (req, res) => {
  try {
    const { status, limit = 200 } = req.query;

    if (dbConnected) {
      const filter = {};
      if (status && status !== 'all') filter.status = status;
      const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
      const totalRevenue = orders.reduce((s, o) => s + (o.price || 0), 0);
      return res.json({ success: true, count: orders.length, totalRevenue, orders });
    } else {
      // In-memory fallback
      let orders = [...inMemoryOrders];
      if (status && status !== 'all') orders = orders.filter(o => o.status === status);
      orders = orders.slice(0, parseInt(limit));
      const totalRevenue = orders.reduce((s, o) => s + (o.price || 0), 0);
      return res.json({ success: true, count: orders.length, totalRevenue, orders, mode: 'memory' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch orders' });
  }
});

// PATCH /api/admin/orders/:id/status — Order status update karo
app.patch('/api/admin/orders/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const id = req.params.id;

    if (dbConnected) {
      const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      return res.json({ success: true, message: 'Status updated', order });
    } else {
      const order = inMemoryOrders.find(o => o._id === id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      order.status = status;
      return res.json({ success: true, message: 'Status updated', order });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update status' });
  }
});

// DELETE /api/admin/orders/:id — Order delete karo
app.delete('/api/admin/orders/:id', protect, adminOnly, async (req, res) => {
  try {
    const id = req.params.id;
    if (dbConnected) {
      await Order.findByIdAndDelete(id);
    } else {
      inMemoryOrders = inMemoryOrders.filter(o => o._id !== id);
    }
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete' });
  }
});

// GET /api/admin/order-stats — Order stats for dashboard
app.get('/api/admin/order-stats', protect, adminOnly, async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);

    if (dbConnected) {
      const total = await Order.countDocuments();
      const todayOrders = await Order.find({ createdAt: { $gte: todayStart } });
      const todayRevenue = todayOrders.reduce((s, o) => s + (o.price || 0), 0);
      const pending = await Order.countDocuments({ status: 'pending' });
      return res.json({ success: true, stats: { total, todayCount: todayOrders.length, todayRevenue, pending } });
    } else {
      const todayOrders = inMemoryOrders.filter(o => new Date(o.createdAt) >= todayStart);
      const todayRevenue = todayOrders.reduce((s, o) => s + (o.price || 0), 0);
      const pending = inMemoryOrders.filter(o => o.status === 'pending').length;
      return res.json({ success: true, stats: { total: inMemoryOrders.length, todayCount: todayOrders.length, todayRevenue, pending }, mode: 'memory' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch stats' });
  }
});
// POST /api/reviews — Leave a review with AI sentiment analysis
app.post('/api/reviews', async (req, res) => {
  try {
    const { customerName, customerEmail, text, rating } = req.body;
    if (!text || !customerName) {
      return res.status(400).json({ success: false, message: 'Name and review text are required' });
    }

    // Call Pollinations AI for Sentiment Analysis
    const prompt = `Analyze the following customer review for a restaurant. Respond with ONLY ONE EXACT WORD from this list: [HAPPY, ANGRY, FOOD_QUALITY, NEUTRAL]. Do not include any other words or punctuation. Review: "${text}"`;
    
    let sentiment = 'NEUTRAL';
    if (dbConnected) { // only run AI if db is connected for simplicity, though not strictly required
      try {
        const response = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }]
          })
        });
        if (response.ok) {
          const aiText = await response.text();
          const cleaned = aiText.trim().toUpperCase();
          if (['HAPPY', 'ANGRY', 'FOOD_QUALITY', 'NEUTRAL'].includes(cleaned)) {
            sentiment = cleaned;
          } else {
            if (cleaned.includes('HAPPY')) sentiment = 'HAPPY';
            else if (cleaned.includes('ANGRY')) sentiment = 'ANGRY';
            else if (cleaned.includes('FOOD_QUALITY') || cleaned.includes('QUALITY')) sentiment = 'FOOD_QUALITY';
          }
        }
      } catch (aiErr) {
        console.error('AI Sentiment Analysis failed:', aiErr.message);
      }
    }

    const reviewData = {
      customerName,
      customerEmail: customerEmail || '',
      text,
      rating: rating || 5,
      sentiment
    };

    if (dbConnected) {
      const review = await Review.create(reviewData);
      return res.status(201).json({ success: true, message: 'Review submitted successfully', review });
    } else {
       // fallback for no db
       return res.status(201).json({ success: true, message: 'Review submitted (memory fallback)', review: reviewData });
    }
  } catch (err) {
    console.error('Review save error:', err.message);
    res.status(500).json({ success: false, message: 'Could not save review' });
  }
});


// ── AI CHAT PROXY (FREE / KEYLESS) ──
// Proxy to Pollinations.ai for free, keyless AI chatbot functionality
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system } = req.body;

    // Convert Anthropic-style messages to OpenAI-style for Pollinations
    const formattedMessages = [];
    if (system) {
      formattedMessages.push({ role: 'system', content: system });
    }
    if (messages && messages.length > 0) {
      formattedMessages.push(...messages);
    }

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: formattedMessages
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: 'AI service error' });
    }

    // Pollinations returns pure text. Wrap it to match what the frontend expects (Anthropic style)
    const textData = await response.text();

    res.json({ 
      success: true, 
      content: [{ text: textData }] 
    });
  } catch (err) {
    console.error('Chat proxy error:', err.message);
    res.status(500).json({ success: false, error: 'Chat service unavailable' });
  }
});

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'Fresh Plate & Co API chal rahi hai 🍱',
    db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ── Start Server ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Fresh Plate & Co Backend Server`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`👑 Admin: ${process.env.ADMIN_EMAIL}`);
  console.log(`\n💡 MongoDB URL: ${process.env.MONGO_URI}`);
});
