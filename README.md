# 🍱 Fresh Plate & Co — Full Stack Setup Guide

## Project Structure
```
freshplate/
├── backend/
│   ├── models/
│   │   ├── User.js          ← MongoDB User schema
│   │   └── Order.js         ← MongoDB Order schema
│   ├── server.js            ← Express server
│   ├── package.json
│   └── .env                 ← MongoDB URL + secrets
└── frontend/
    ├── index.html           ← Main website
    └── admin-dashboard.html ← Admin control panel
```

---

## ⚡ Quick Setup

### Step 1 — Install Node.js
```
Download Node.js (LTS version) from https://nodejs.org
```

### Step 2 — Set up MongoDB (2 options)

#### Option A: MongoDB Atlas (Cloud — Recommended)
1. Go to https://mongodb.com/atlas → Create a free account
2. Create a new Cluster (M0 Free)
3. Database Access → Create a new user
4. Network Access → Allow from anywhere (0.0.0.0/0)
5. Connect → Drivers → Copy the connection string
6. Update `MONGO_URI` in the `.env` file:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/freshplate
   ```

#### Option B: Local MongoDB
1. Install MongoDB Community from https://mongodb.com/try/download
2. Use the default URL:
   ```
   MONGO_URI=mongodb://localhost:27017/freshplate
   ```

### Step 3 — Start the Backend
```bash
cd freshplate/backend
npm install
npm start
```

Server will run at: http://localhost:3001

### Step 4 — Open the Frontend
- Open `freshplate/frontend/index.html` in your browser
- Or use the **Live Server** extension in VS Code for best results

---

## 🔐 Login Details

### Admin Login
- **Email:** akshatojha820@gmail.com
- **Password:** akshat123
- Click the **"⚙ Admin Portal"** link at the bottom of the website

### User Login
- Users can create their own accounts via the Register button
- After registering, they can log in with their credentials

---

## 🌐 API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | User login |
| POST | /api/admin/login | Admin login |
| GET | /api/admin/users | Get all users (admin only) |
| GET | /api/admin/stats | Dashboard stats (admin only) |
| DELETE | /api/admin/users/:id | Delete a user (admin only) |
| GET | /api/user/profile | Get logged-in user profile |
| POST | /api/orders | Save a website order |
| GET | /api/admin/orders | Get all orders (admin only) |
| PATCH | /api/admin/orders/:id/status | Update order status (admin only) |
| DELETE | /api/admin/orders/:id | Delete an order (admin only) |
| GET | /api/admin/order-stats | Order stats for dashboard |
| GET | /api/health | Server health check |

---

## 💡 Demo Mode

If the backend is not running, the website automatically runs in **Demo Mode**:
- Users are saved in the browser's localStorage
- Admin credentials remain the same
- All features work without a server

---

## 🎨 Features

✅ User Register + Login portal  
✅ Admin Login with hardcoded credentials  
✅ Users stored in MongoDB  
✅ Passwords encrypted with bcrypt  
✅ JWT token authentication  
✅ User list in Admin Dashboard  
✅ Admin can delete users  
✅ **Live order tracking** — every WhatsApp order click is captured  
✅ Orders panel with real-time data, status updates & filters  
✅ WhatsApp quick-reply button per order  
✅ Auto-refresh every 30 seconds on orders panel  
✅ In-memory order fallback if MongoDB is unavailable  
✅ All original animations intact  
✅ Demo mode if backend is offline  
✅ Enter key support in all forms  
✅ ESC key closes modals  
✅ Overlay click closes modals  
✅ Mobile responsive  
