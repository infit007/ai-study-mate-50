const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const { getAIResponse } = require('./services/aiService');
const { detectSubject, enhancePrompt, getCustomizedSystemMessage } = require('./services/stemEnhancer');

// Load env variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow connections from any origin
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = 5002; // Using port 5002 to avoid conflicts

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'AI Test Server is running!' });
});

// AI response function with context
async function getAIResponseWithContext(prompt, messageHistory = []) {
  try {
    // Detect subject and enhance prompt
    const subject = detectSubject(prompt);
    const enhancedPrompt = enhancePrompt(prompt, subject);
    
    // Get customized system message
    const baseSystemMessage = `You are an AI study assistant specializing in STEM subjects (Science, Technology, Engineering, and Mathematics).
- Provide clear, accurate explanations of STEM concepts
- For math problems, show step-by-step solutions
- For science questions, include relevant formulas and principles
- For programming questions, provide code examples when appropriate
- Format responses with markdown for better readability
- Keep explanations concise but thorough`;
    
    const customizedSystemMessage = getCustomizedSystemMessage(baseSystemMessage, subject);
    
    // Get AI response with context and customized system message
    return await getAIResponse(enhancedPrompt, messageHistory, customizedSystemMessage);
  } catch (error) {
    console.error('Error getting AI response with context:', error);
    return `AI Assistant: I'm having trouble processing your request. Please try again.`;
  }
}

// Socket.IO for real-time chat
io.on('connection', (socket) => {
  console.log('A user connected');
  
  socket.on('joinRoom', (roomId) => {
    console.log(`User joined room: ${roomId}`);
    socket.join(roomId);
  });

  socket.on('chatMessage', async ({ roomId, content, userName = 'User' }) => {
    console.log(`Message in room ${roomId}: ${content}`);
    
    // Emit the user message
    io.to(roomId).emit('chatMessage', {
      id: Date.now().toString(),
      userName: userName,
      content: content,
      createdAt: new Date(),
    });

    // AI response
    if (content.startsWith('/ai') || content.startsWith('@ai')) {
      const question = content.replace(/^\/ai|@ai/, '').trim();
      console.log(`AI question: ${question}`);
      
      const aiResponse = await getAIResponseWithContext(question, []);
      
      io.to(roomId).emit('chatMessage', {
        id: (Date.now() + 1).toString(),
        userName: 'AI Assistant',
        content: aiResponse,
        createdAt: new Date(),
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Test endpoint for AI responses
app.post('/api/ai/test', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  
  try {
    const response = await getAIResponseWithContext(prompt, []);
    res.json({ response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`AI Test Server running on port ${PORT}`);
  console.log(`Test the AI by sending a POST request to http://localhost:${PORT}/api/ai/test`);
  console.log(`Or connect via Socket.IO and send messages starting with /ai or @ai`);
});