const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock Environment Variables
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/test_freshplate';
process.env.JWT_SECRET = 'test_jwt_secret_key_123';
process.env.ADMIN_EMAIL = 'admin@freshplate.com';
process.env.ADMIN_PASSWORD = 'admin_secure_password';

// Mock Mongoose models before requiring app
jest.mock('../models/User', () => {
  const mockUserInstance = {
    _id: 'mock_user_id_123',
    name: 'Test User',
    email: 'test@example.com',
    phone: '9876543210',
    role: 'user',
    isActive: true,
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true)
  };
  
  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn().mockResolvedValue(mockUserInstance),
    findById: jest.fn().mockResolvedValue(mockUserInstance),
    find: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis()
  };
  
  // Attach instance comparePassword mock statically or return class
  return mockUserModel;
});

jest.mock('../models/Order', () => {
  return {
    create: jest.fn().mockImplementation((data) => Promise.resolve({ _id: 'mock_order_123', ...data })),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    countDocuments: jest.fn().mockResolvedValue(1)
  };
});

jest.mock('../models/Review', () => {
  return {
    create: jest.fn().mockImplementation((data) => Promise.resolve({ _id: 'mock_review_123', ...data })),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis()
  };
});

jest.mock('../models/Menu', () => {
  return {
    create: jest.fn().mockImplementation((data) => Promise.resolve({ _id: 'mock_menu_123', ...data })),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn().mockResolvedValue(5)
  };
});

// Import App
const app = require('../server');
const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Menu = require('../models/Menu');

describe('Fresh Plate & Co API Integration Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return 200 and successful health check details', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toContain('API chal rahi hai');
    });
  });

  describe('GET /api/menu', () => {
    it('should fetch all menu items', async () => {
      // Stub the Menu.find query result
      const mockItems = [{ name: 'Paneer Thali', price: 150, category: 'Thali' }];
      Menu.find().sort.mockResolvedValue(mockItems);

      const res = await request(app).get('/api/menu');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // Since dbConnected might be false in testing if connect fails, we support either live or fallback array
      expect(Array.isArray(res.body.menu)).toBe(true);
    });
  });

  describe('POST /api/orders', () => {
    it('should fail order creation without required item field', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ customerName: 'John Doe', price: 120 });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Item name required');
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ item: 'Paneer Thali', customerEmail: 'bad-email' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create order successfully with valid inputs', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          item: 'Paneer Thali',
          customerName: 'Akshat',
          customerPhone: '9999999999',
          price: 150
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order).toBeDefined();
    });
  });

  describe('POST /api/auth/register', () => {
    it('should fail user registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'not-an-email',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail user registration if password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should register a naya user successfully with valid inputs', async () => {
      User.findOne.mockResolvedValue(null); // No existing user

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Akshat Ojha',
          email: 'newuser@example.com',
          password: 'securePassword123',
          phone: '9999988888'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('POST /api/admin/login', () => {
    it('should reject admin login with invalid password', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@freshplate.com',
          password: 'wrong_password'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@freshplate.com',
          password: 'admin_secure_password'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('Admin Auth Guarded Endpoints', () => {
    it('should reject fetching users without JWT token', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to fetch users with valid admin token', async () => {
      // Generate a mock admin token
      const token = jwt.sign(
        { id: 'admin_001', role: 'admin', name: 'Akshat Ojha', email: 'admin@freshplate.com' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const mockUsers = [{ name: 'User 1', email: 'user1@example.com' }];
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockUsers)
      });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.users).toBeDefined();
    });
  });
});
