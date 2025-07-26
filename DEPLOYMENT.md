# 🚀 AI Study Mate - Deployment Guide

## 🔧 Fixing Render Production Deployment

### Current Issues Fixed:
1. ✅ **Missing Dependencies**: Added `openai` and `groq-sdk` to backend/package.json
2. ✅ **CORS Configuration**: Fixed cross-origin requests between Vercel and Render
3. ❌ **Database Configuration**: Need to set proper PostgreSQL URL in Render environment

---

## 🗄️ Database Solutions

### **Option A: Use Render's Built-in PostgreSQL (Recommended)**

This is the easiest and most reliable solution:

1. **Create a new PostgreSQL database on Render:**
   - Go to Render Dashboard → New → PostgreSQL
   - Name it something like "ai-study-mate-db"
   - Choose a plan (Free tier works fine)
   - Note down the connection string

2. **Update your Render environment variable:**
   - Use the **Internal Database URL** from Render (not external)
   - It will look like: `postgresql://username:password@host:port/database`

3. **Run database migrations:**
   - After setting the DATABASE_URL, redeploy your service
   - The Prisma migrations will run automatically

### **Option B: Fix Supabase Connection**

If you prefer to keep using Supabase:

1. **Check Supabase database status**
2. **Verify network restrictions**
3. **Try a new password without special characters**

---

## 📋 Render Environment Variables Setup

To fix the production deployment, you need to set these environment variables in your **Render Dashboard**:

### 🗄️ Database Configuration
```bash
# Option A: Render PostgreSQL (Recommended)
DATABASE_URL=postgresql://username:password@host:port/database

# Option B: Supabase PostgreSQL
DATABASE_URL=postgresql://postgres:Supab975677@db.itccthxorkcnaswlpytn.supabase.co:5432/postgres
```

### �� Authentication
```bash
JWT_SECRET=e0tvejhlt6vw1x66m8baimdjapiskfd3
```

### 🤖 AI API Keys
```bash
# Groq API (Free and recommended)
GROQ_API_KEY=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

# OpenAI API (Optional - has quota limits)
OPENAI_API_KEY=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
```

### 🌐 Server Configuration
```bash
PORT=5000
```

### 🎨 Frontend Environment Variables (Vercel)
```bash
# Set this in your Vercel project environment variables
VITE_API_URL=https://ai-study-mate-50.onrender.com/api
VITE_SOCKET_URL=https://ai-study-mate-50.onrender.com
```

---

## 🛠️ Step-by-Step Render Deployment Fix

### 1. **Create PostgreSQL Database on Render**
   - Go to Render Dashboard → New → PostgreSQL
   - Note down the connection string (Internal Database URL)

### 2. **Update Environment Variables**
   - Go to your Web Service on Render
   - Navigate to Environment tab
   - Add/Update the variables listed above
   - **Important**: Use the PostgreSQL connection string for `DATABASE_URL`

### 3. **Redeploy**
   - Push your latest changes to GitHub (dependencies are now fixed)
   - Render will automatically redeploy
   - Check logs for successful startup

---

## 🏠 Local Development

For local development, the app uses SQLite by default:

```bash
# Backend
cd backend
npm install
npm start

# Frontend  
cd ..
npm install
npm run dev
```

---

## 🔍 Troubleshooting

### Common Issues:

1. **"Cannot find module 'openai'"**
   - ✅ Fixed: Added to package.json

2. **"Invalid DATABASE_URL"**
   - ❌ Fix: Set proper PostgreSQL URL in Render environment variables

3. **"PrismaClientInitializationError"**
   - Ensure DATABASE_URL format: `postgresql://user:pass@host:port/db?sslmode=require`

4. **AI Assistant not working**
   - Ensure GROQ_API_KEY is set in environment variables
   - Fallback responses will work even without API keys

---

## 📊 Environment Variable Summary

| Variable | Local (SQLite) | Production (PostgreSQL) | Frontend (Vercel) |
|----------|---------------|------------------------|-------------------|
| DATABASE_URL | `file:./dev.db` | `postgresql://...` | N/A |
| JWT_SECRET | Same value | Same value | N/A |
| GROQ_API_KEY | Same value | Same value | N/A |
| OPENAI_API_KEY | Same value | Same value | N/A |
| PORT | 5000 | 5000 | N/A |
| VITE_API_URL | N/A | N/A | `https://ai-study-mate-50.onrender.com/api` |
| VITE_SOCKET_URL | N/A | N/A | `https://ai-study-mate-50.onrender.com` |

---

## ✅ Verification

After deployment, verify:
- [ ] Backend starts without errors
- [ ] Database connections work
- [ ] Login/Registration functions
- [ ] AI Assistant responds in chat
- [ ] Study room CRUD operations work

---

**🎯 Next Steps**: Update your Render environment variables with the correct PostgreSQL DATABASE_URL and redeploy!
