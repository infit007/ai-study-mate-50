# AI Study Mate 🧠

A modern, collaborative study platform that combines AI-powered learning assistance with real-time collaboration tools.

## ✨ Features

### 🎨 Collaborative Whiteboard
- **Real-time Drawing**: Draw, annotate, and solve problems together with live collaboration
- **Multiple Colors**: Choose from 8 different colors for your drawings
- **Brush Sizes**: 5 different brush sizes (1px to 12px) for precise drawing
- **Eraser Tool**: Remove mistakes with the built-in eraser
- **Save & Load**: Download your whiteboard as PNG or upload existing images
- **Active Users**: See who's currently drawing on the whiteboard
- **Clear Canvas**: Reset the whiteboard for a fresh start

### ⏱️ Pomodoro Timer
- **Focus Sessions**: Customizable focus time (1-60 minutes)
- **Break Management**: Automatic short and long breaks
- **Progress Tracking**: Visual progress bar and session counter
- **Settings Panel**: Adjust focus time, break duration, and intervals
- **Session Notifications**: Get notified when focus sessions complete

### 💬 AI-Powered Chat
- **Smart AI Assistant**: Get instant help with study questions
- **Context Awareness**: AI remembers conversation history
- **STEM Enhancement**: Specialized responses for science, math, and engineering topics
- **Code Highlighting**: Syntax-highlighted code blocks in responses
- **Markdown Support**: Rich text formatting in chat messages

### 👥 Study Rooms
- **Create Rooms**: Set up study spaces for different subjects
- **Join Collaboratively**: Real-time participant management
- **Private Rooms**: Secure study environments
- **Subject Organization**: Categorize rooms by academic subjects

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- SQLite (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-study-mate-50
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in backend directory
   cp backend/.env.example backend/.env
   
   # Add your OpenAI API key
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev
   
   # Terminal 2: Start frontend
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **Socket.io Client** for real-time features
- **React Router** for navigation
- **React Markdown** for rich text rendering

### Backend
- **Node.js** with Express
- **Socket.io** for real-time communication
- **Prisma** ORM with SQLite
- **OpenAI API** for AI assistance
- **JWT** for authentication
- **bcrypt** for password hashing

## 🎯 How to Use

### Creating a Study Room
1. Navigate to the Study Rooms page
2. Fill in the room details (name, subject, max participants)
3. Click "Create Room"
4. Share the room link with your study group

### Using the Whiteboard
1. **Join a room** and navigate to the room details page
2. **Select a color** from the color palette
3. **Choose brush size** for your drawing
4. **Start drawing** by clicking and dragging on the canvas
5. **Use the eraser** to remove mistakes
6. **Save your work** by clicking the download button
7. **Clear the canvas** for a fresh start

### Using the Pomodoro Timer
1. **Configure settings** by clicking the settings button
2. **Set focus time** (default: 25 minutes)
3. **Adjust break times** (short: 5 min, long: 15 min)
4. **Start the timer** and focus on your work
5. **Take breaks** when the timer completes
6. **Track progress** with the session counter

### Getting AI Help
1. **Type your question** in the chat
2. **Prefix with @ai** or /ai for AI assistance
3. **Get instant help** with explanations, examples, and code
4. **Continue the conversation** for follow-up questions

## 🔧 Configuration

### Environment Variables
```env
# Backend (.env)
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret
DATABASE_URL=file:./dev.db
PORT=5000

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Customizing the Whiteboard
The whiteboard supports customization through the component props:
- `roomId`: Unique identifier for the study room
- `socket`: Socket.io connection for real-time updates
- `user`: Current user information

### Customizing the Pomodoro Timer
Adjust timer settings in the settings panel:
- Focus time: 1-60 minutes
- Short break: 1-30 minutes
- Long break: 1-60 minutes
- Long break interval: 1-10 sessions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the AI API
- Socket.io for real-time communication
- Shadcn/ui for beautiful UI components
- Tailwind CSS for utility-first styling

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem

---

**Happy Studying! 🎓**
