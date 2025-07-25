const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');

// Load env variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());

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
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
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
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
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

function getAIResponse(prompt) {
  return Promise.resolve(`AI says: This is a sample answer to: "${prompt}"`);
}

io.on('connection', (socket) => {
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
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
      const aiResponse = await getAIResponse(question);

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
});

// ------------------------ Start Server ------------------------

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
