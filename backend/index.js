const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json());

// Helper: Check if signup is within 3 months from today
function isLifetimeFree(signupDate) {
  const LAUNCH_DATE = new Date();
  LAUNCH_DATE.setMonth(LAUNCH_DATE.getMonth() - 3);
  return signupDate >= LAUNCH_DATE;
}

// Register route
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required.' });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
    const passwordHash = await bcrypt.hash(password, 10);
    const signupDate = new Date();
    // Lifetime free if signup is within 3 months from today
    const lifetimeFree = isLifetimeFree(signupDate);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, signupDate, lifetimeFree },
    });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, lifetimeFree: user.lifetimeFree }, token });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, lifetimeFree: user.lifetimeFree }, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Middleware to authenticate JWT
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token.' });
  try {
    const payload = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

// Get current user info
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, lifetimeFree: user.lifetimeFree } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// Update user name
app.put('/api/auth/me', authMiddleware, async (req, res) => {
  const { name } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name },
    });
    res.json({ user: { id: user.id, email: user.email, name: user.name, lifetimeFree: user.lifetimeFree } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// List all study rooms
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

// Create a new study room
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
          create: [
            {
              userId: req.userId,
            },
          ],
        },
      },
      include: {
        participants: true,
      },
    });
    res.json({ room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create room.' });
  }
});

// Join a study room
app.post('/api/rooms/:id/join', authMiddleware, async (req, res) => {
  const roomId = req.params.id;
  try {
    const room = await prisma.studyRoom.findUnique({ where: { id: roomId } });
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    if (room.participants.includes(req.userId)) return res.json({ success: true });
    if (room.participants.length >= room.maxParticipants) return res.status(403).json({ error: 'Room is full.' });
    const updated = await prisma.studyRoom.update({
      where: { id: roomId },
      data: { participants: { push: req.userId } },
    });
    res.json({ success: true, room: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join room.' });
  }
});

// Get messages for a room
app.get('/api/rooms/:id/messages', async (req, res) => {
  const roomId = req.params.id;
  try {
    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// Edit a study room
app.put('/api/rooms/:id', authMiddleware, async (req, res) => {
  const roomId = req.params.id;
  const { name, subject, maxParticipants, isPrivate } = req.body;
  try {
    const room = await prisma.studyRoom.findUnique({ where: { id: roomId } });
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    if (room.createdById !== req.userId) return res.status(403).json({ error: 'Not authorized.' });

    const updated = await prisma.studyRoom.update({
      where: { id: roomId },
      data: { name, subject, maxParticipants, isPrivate },
    });
    res.json({ room: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update room.' });
  }
});

// Delete a study room
app.delete('/api/rooms/:id', authMiddleware, async (req, res) => {
  const roomId = req.params.id;
  try {
    // Only allow the creator to delete
    const room = await prisma.studyRoom.findUnique({ where: { id: roomId } });
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    if (room.createdById !== req.userId) return res.status(403).json({ error: 'Not authorized.' });

    await prisma.studyRoom.delete({ where: { id: roomId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete room.' });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  });

  socket.on('chatMessage', async ({ roomId, userId, content }) => {
    // Save message to DB
    const message = await prisma.message.create({
      data: { roomId, userId, content },
    });
    io.to(roomId).emit('chatMessage', {
      id: message.id,
      userId: message.userId,
      content: message.content,
      createdAt: message.createdAt,
    });
  });
});

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
}); 