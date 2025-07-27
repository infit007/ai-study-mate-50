const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');
const { getAIResponse } = require('./services/aiService');
const { detectSubject, enhancePrompt, getCustomizedSystemMessage } = require('./services/stemEnhancer');

// Load env variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Try to create tables if they don't exist
    await setupDatabase();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your DATABASE_URL environment variable');
    console.error('Current DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set');
  }
}

// Setup database tables
async function setupDatabase() {
  try {
    console.log('🔧 Setting up database tables...');
    
    // Check if User table exists
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'User'
    `;
    
    if (tables.length === 0) {
      console.log('📋 Creating database tables...');
      // Run migrations manually
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "signupDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lifetimeFree" BOOLEAN NOT NULL DEFAULT false,
        "name" TEXT,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      )`;
      
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`;
      
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "StudyRoom" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "maxParticipants" INTEGER NOT NULL,
        "isPrivate" BOOLEAN NOT NULL DEFAULT false,
        "createdById" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "StudyRoom_pkey" PRIMARY KEY ("id")
      )`;
      
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "Message" (
        "id" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "roomId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
      )`;
      
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "Participant" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "roomId" TEXT NOT NULL,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
      )`;
      
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Participant_userId_roomId_key" ON "Participant"("userId", "roomId")`;
      
      console.log('✅ Database tables created successfully');
    } else {
      console.log('✅ Database tables already exist');
    }
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
}

// Test connection on startup
testDatabaseConnection();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:8080',
      'http://localhost:5173',
      'http://localhost:3000',
      'https://ai-study-mate-50.vercel.app',
      'https://ai-study-mate-50-y3wf.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware
app.use(cors({ 
  origin: [
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://ai-study-mate-50.vercel.app',
    'https://ai-study-mate-50-y3wf.vercel.app'
  ], 
  credentials: true 
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database initialization endpoint
app.post('/api/init-db', async (req, res) => {
  try {
    console.log('Initializing database...');
    await prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS public`;
    console.log('Database initialized successfully');
    res.json({ 
      status: 'success', 
      message: 'Database initialized',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper to check if signup is within 3 months
function isLifetimeFree(signupDate) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return signupDate >= threeMonthsAgo;
}

// ------------------------ Auth Routes ------------------------

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required.' });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
    const passwordHash = await bcrypt.hash(password, 10);
    const signupDate = new Date();
    const lifetimeFree = isLifetimeFree(signupDate);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, signupDate, lifetimeFree },
    });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.message.includes('Can\'t reach database server')) {
      res.status(503).json({ error: 'Database connection failed. Please try again later.' });
    } else if (err.message.includes('relation "User" does not exist')) {
      res.status(503).json({ error: 'Database not initialized. Please try again in a moment.' });
    } else {
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    if (err.message.includes('Can\'t reach database server')) {
      res.status(503).json({ error: 'Database connection failed. Please try again later.' });
    } else {
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  }
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

app.put('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name },
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// ------------------------ Study Room Routes ------------------------

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await prisma.studyRoom.findMany({
      orderBy: { createdAt: 'desc' },
      include: { participants: true },
    });
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms.' });
  }
});

app.post('/api/rooms', authMiddleware, async (req, res) => {
  const { name, subject, maxParticipants, isPrivate = false } = req.body;
  if (!name || !subject || !maxParticipants) return res.status(400).json({ error: 'Missing fields.' });
  try {
    const room = await prisma.studyRoom.create({
      data: {
        name,
        subject,
        maxParticipants: Number(maxParticipants),
        isPrivate,
        createdById: req.userId,
        participants: {
          create: [{ userId: req.userId }],
        },
      },
      include: { participants: true },
    });
    res.json({ room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create room.' });
  }
});

app.post('/api/rooms/:id/join', authMiddleware, async (req, res) => {
  const roomId = req.params.id;
  try {
    const room = await prisma.studyRoom.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });
    if (!room) return res.status(404).json({ error: 'Room not found.' });

    const alreadyInRoom = room.participants.some(p => p.userId === req.userId);
    if (alreadyInRoom) return res.json({ success: true });

    if (room.participants.length >= room.maxParticipants) {
      return res.status(403).json({ error: 'Room is full.' });
    }

    await prisma.participant.create({
      data: { roomId, userId: req.userId },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join room.' });
  }
});

// Update room (PUT /api/rooms/:id)
app.put('/api/rooms/:id', authMiddleware, async (req, res) => {
  const roomId = req.params.id;
  const { name, subject, maxParticipants, isPrivate } = req.body;
  
  try {
    // Check if user is the room creator
    const room = await prisma.studyRoom.findUnique({
      where: { id: roomId },
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    
    if (room.createdById !== req.userId) {
      return res.status(403).json({ error: 'Only the room creator can edit this room.' });
    }
    
    const updatedRoom = await prisma.studyRoom.update({
      where: { id: roomId },
      data: {
        name,
        subject,
        maxParticipants: parseInt(maxParticipants),
        isPrivate: !!isPrivate,
      },
      include: { participants: true },
    });
    
    res.json({ room: updatedRoom });
  } catch (err) {
    console.error('Error updating room:', err);
    res.status(500).json({ error: 'Failed to update room.' });
  }
});

// Delete room (DELETE /api/rooms/:id)
app.delete('/api/rooms/:id', authMiddleware, async (req, res) => {
  const roomId = req.params.id;
  
  try {
    // Check if user is the room creator
    const room = await prisma.studyRoom.findUnique({
      where: { id: roomId },
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    
    if (room.createdById !== req.userId) {
      return res.status(403).json({ error: 'Only the room creator can delete this room.' });
    }
    
    // Delete related data first (participants, messages)
    await prisma.participant.deleteMany({
      where: { roomId },
    });
    
    await prisma.message.deleteMany({
      where: { roomId },
    });
    
    // Delete the room
    await prisma.studyRoom.delete({
      where: { id: roomId },
    });
    
    res.json({ success: true, message: 'Room deleted successfully.' });
  } catch (err) {
    console.error('Error deleting room:', err);
    res.status(500).json({ error: 'Failed to delete room.' });
  }
});

app.get('/api/rooms/:id/messages', async (req, res) => {
  const roomId = req.params.id;
  try {
    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });
    res.json({
      messages: messages.map(msg => ({
        id: msg.id,
        userId: msg.userId,
        userName: msg.user?.name || "Unknown",
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// ------------------------ Chat + Socket.IO ------------------------

/**
 * Get AI response with context from the study room
 * @param {string} prompt - The user's question
 * @param {string} roomId - The ID of the study room
 * @returns {Promise<string>} - The AI's response
 */
async function getAIResponseWithContext(prompt, roomId) {
  try {
    // Get recent messages from this room for context (last 5 messages)
    const recentMessages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: true }
    });
    
    // Format messages for context
    const messageHistory = recentMessages
      .reverse()
      .map(msg => ({
        role: msg.user.email === 'ai@studysync.com' ? 'assistant' : 'user',
        content: msg.content.replace(/^\/ai|@ai/, '').trim()
      }));
    
    // Detect subject and enhance prompt
    const subject = detectSubject(prompt);
    const enhancedPrompt = enhancePrompt(prompt, subject);
    
    // Get customized system message
    const baseSystemMessage = `You are a chill, friendly AI who loves casual conversation. When someone says "hello" or "hey", just respond naturally like a friend would - no need to immediately offer academic help or list STEM topics. You can chat about anything: movies, music, life, random thoughts, or yes, studies too if they want. Be conversational and relaxed. Don't be overly helpful or formal - just be a cool chat companion who happens to be smart.`;
    
    const customizedSystemMessage = getCustomizedSystemMessage(baseSystemMessage, subject);
    
    // Get AI response with context and customized system message
    return await getAIResponse(enhancedPrompt, messageHistory, customizedSystemMessage);
  } catch (error) {
    console.error('Error getting AI response with context:', error);
    return `AI Assistant: I'm having trouble processing your request. Please try again.`;
  }
}

io.on('connection', (socket) => {
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    
    // Get current users in the room and send to the new user
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
      const users = Array.from(room).map(socketId => {
        const userSocket = io.sockets.sockets.get(socketId);
        return userSocket?.userName || 'Anonymous';
      }).filter(userName => userName !== (socket.userName || 'Anonymous'));
      
      socket.emit('currentUsers', users);
    }
    
    // Notify other users in the room
    socket.to(roomId).emit('userJoined', socket.userName || 'Anonymous');
  });

  socket.on('chatMessage', async ({ roomId, userId, content }) => {
    const message = await prisma.message.create({
      data: { roomId, userId, content },
    });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    io.to(roomId).emit('chatMessage', {
      id: message.id,
      userId: user.id,
      userName: user.name,
      content: message.content,
      createdAt: message.createdAt,
    });

    // AI response
    if (content.startsWith('/ai') || content.startsWith('@ai')) {
      const question = content.replace(/^\/ai|@ai/, '').trim();
      console.log(`AI question received in room ${roomId}: ${question}`);
      const aiResponse = await getAIResponseWithContext(question, roomId);

      let aiUser = await prisma.user.findUnique({ where: { email: 'ai@studysync.com' } });
      if (!aiUser) {
        aiUser = await prisma.user.create({
          data: {
            email: 'ai@studysync.com',
            passwordHash: 'ai',
            name: 'AI Assistant',
            signupDate: new Date(),
            lifetimeFree: true,
          },
        });
      }

      const aiMessage = await prisma.message.create({
        data: { roomId, userId: aiUser.id, content: aiResponse },
      });

      io.to(roomId).emit('chatMessage', {
        id: aiMessage.id,
        userId: aiUser.id,
        userName: 'AI Assistant',
        content: aiResponse,
        createdAt: aiMessage.createdAt,
      });
    }
  });

  // Whiteboard events
  socket.on('joinWhiteboard', ({ roomId, userName }) => {
    socket.join(`whiteboard-${roomId}`);
    socket.to(`whiteboard-${roomId}`).emit('userJoinedWhiteboard', userName);
    console.log(`${userName} joined whiteboard in room ${roomId}`);
  });

  socket.on('leaveWhiteboard', ({ roomId, userName }) => {
    socket.leave(`whiteboard-${roomId}`);
    socket.to(`whiteboard-${roomId}`).emit('userLeftWhiteboard', userName);
    console.log(`${userName} left whiteboard in room ${roomId}`);
  });

  socket.on('whiteboardDraw', ({ roomId, points, color, brushSize, type, userId, userName }) => {
    // Broadcast drawing action to all users in the whiteboard room
    socket.to(`whiteboard-${roomId}`).emit('whiteboardDraw', {
      points,
      color,
      brushSize,
      type,
      userId,
      userName
    });
    console.log(`Drawing action from ${userName} in room ${roomId}`);
  });

  socket.on('whiteboardClear', ({ roomId }) => {
    // Broadcast clear action to all users in the whiteboard room
    socket.to(`whiteboard-${roomId}`).emit('whiteboardClear');
    console.log(`Whiteboard cleared in room ${roomId}`);
  });

  socket.on('whiteboardImageUpload', ({ roomId, imageData, userId, userName }) => {
    // Broadcast image upload to all users in the whiteboard room
    socket.to(`whiteboard-${roomId}`).emit('whiteboardImageUpload', {
      imageData,
      userName
    });
    console.log(`Image uploaded by ${userName} in room ${roomId}`);
  });

  socket.on('getOnlineUsers', (roomId) => {
    // Get all users in the room
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
      const users = Array.from(room).map(socketId => {
        const userSocket = io.sockets.sockets.get(socketId);
        return userSocket?.userName || 'Anonymous';
      });
      socket.emit('onlineUsers', users);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    // Notify other users when someone leaves
    if (socket.roomId) {
      socket.to(socket.roomId).emit('userLeft', socket.userName || 'Anonymous');
    }
  });
});

// ------------------------ Start Server ------------------------

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
