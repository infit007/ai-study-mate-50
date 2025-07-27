import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import CollaborativeWhiteboard from "@/components/CollaborativeWhiteboard";
import PomodoroTimer from "@/components/PomodoroTimer";
import ParticipantsList from "@/components/ParticipantsList";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

interface Message {
  id: string;
  content: string;
  userId: string;
  userName?: string;
  sender?: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

interface Room {
  id: string;
  name: string;
  subject: string;
  participants: any[];
  createdAt: string;
}

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isAITyping, setIsAITyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  const fetchRoom = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/rooms/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const found = await response.json();
        if (!found) {
          setError("Room not found.");
        } else {
          setRoom(found);
          // Set participants from room data
          if (found.participants) {
            setParticipants(found.participants.map((p: any) => ({
              id: p.userId,
              name: p.user?.name || 'Anonymous',
              subject: found.subject,
              status: 'online'
            })));
          }
        }
      } else {
        setError("Failed to fetch room.");
      }
    } catch (error) {
      console.error("Error fetching room:", error);
      setError("Failed to fetch room.");
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/rooms/${id}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRoom();
      fetchMessages();
    }
  }, [user, id]);

  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    (socket as any).userName = user?.name || 'Anonymous'; // Type assertion for userName
    socket.emit("joinRoom", id);
    socketRef.current = socket;

    socket.on("chatMessage", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("aiResponse", (message: Message) => {
      setMessages((prev) => [...prev, message]);
      setIsAITyping(false);
    });

    socket.on("userTyping", (userName: string) => {
      setTypingUsers((prev) => {
        if (!prev.includes(userName)) {
          return [...prev, userName];
        }
        return prev;
      });
    });

    socket.on("userStoppedTyping", (userName: string) => {
      setTypingUsers((prev) => prev.filter((name) => name !== userName));
    });

    socket.on('userJoined', (userName: string) => {
      setParticipants(prev => {
        const existing = prev.find(p => p.name === userName);
        if (!existing) {
          return [...prev, { id: `temp-${Date.now()}`, name: userName, subject: room?.subject || 'General', status: 'online' }];
        }
        return prev;
      });
    });

    socket.on('userLeft', (userName: string) => {
      setParticipants(prev => prev.filter(p => p.name !== userName));
    });

    socket.on('currentUsers', (users: string[]) => {
      setParticipants(prev => {
        const existingNames = prev.map(p => p.name);
        const newUsers = users.filter(userName => !existingNames.includes(userName));
        return [...prev, ...newUsers.map(userName => ({
          id: `temp-${Date.now()}-${userName}`,
          name: userName,
          subject: room?.subject || 'General',
          status: 'online'
        }))];
      });
    });

    return () => {
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('currentUsers');
      socket.disconnect();
    };
  }, [user, id, room?.subject]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    const message = {
      roomId: id,
      userId: user?.id,
      content: input,
    };

    socketRef.current.emit("chatMessage", message);
    setInput("");

    // Trigger AI response for questions
    if (input.toLowerCase().includes("?") || input.toLowerCase().includes("help")) {
      setIsAITyping(true);
      socketRef.current.emit("requestAIResponse", {
        roomId: id,
        message: input,
        subject: room?.subject || "General",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{error}</h1>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                {room.name}
              </h1>
              <p className="text-gray-600 mb-2">{room.subject}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="text-sm text-gray-500">Participants: {room?.participants?.length || 0}</span>
                <span className="text-sm text-gray-500">Created: {room?.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Toggle Button */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={() => setShowWhiteboard(!showWhiteboard)}
            variant="outline"
            size="lg"
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl"
          >
            {showWhiteboard ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Switch to Chat Mode
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Switch to Whiteboard Mode
              </>
            )}
          </Button>
        </div>

        {showWhiteboard ? (
          // Whiteboard Mode
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
            {/* Main Study Area - Whiteboard and Timer */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-6">
              <CollaborativeWhiteboard 
                roomId={id!} 
                socket={socketRef.current} 
                user={user}
                isOpen={isWhiteboardOpen}
                onToggle={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
              />
              <PomodoroTimer 
                onSessionComplete={() => {
                  if (socketRef.current) {
                    socketRef.current.emit("chatMessage", {
                      roomId: id,
                      userId: 'system',
                      content: "🎉 Focus session completed! Time for a break.",
                    });
                  }
                }}
              />
            </div>

            {/* Sidebar - Participants and Chat */}
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              <ParticipantsList
                roomId={id!}
                socket={socketRef.current}
                user={user}
                participants={participants}
              />
              <div className="bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat
                  </h2>
                </div>

                <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-blue-50/30">
                  {messages.map((message) => {
                    const isCurrentUser = message.userId === user?.id;
                    const isAI = message.sender === 'AI Assistant' || message.userName === 'AI Assistant';
                    const displayName = isAI ? 'AI Assistant' : (message.user?.name || message.userName || user?.name || 'User');
                    
                    return (
                      <div key={message.id} className={`flex items-start gap-3 ${
                        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                      }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg ${
                          isAI
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                            : isCurrentUser
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                            : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                        }`}>
                          {isAI ? '🤖' : displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className={`flex-1 max-w-3xl ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                          <div className={`flex items-center gap-2 mb-2 ${
                            isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                          }`}>
                            <span className={`font-semibold ${
                              isAI
                                ? 'text-purple-600'
                                : isCurrentUser 
                                ? 'text-green-600'
                                : 'text-blue-600'
                            }`}>
                              {isCurrentUser ? 'You' : displayName}
                            </span>
                            <span className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-full">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className={`rounded-2xl p-4 shadow-sm border max-w-2xl ${
                            isAI
                              ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200/50 text-gray-800'
                              : isCurrentUser
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50 text-gray-800'
                              : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 text-gray-800'
                          }`}>
                          {message.sender === 'AI Assistant' || message.userName === 'AI Assistant' ? (
                            <ReactMarkdown
                              components={{
                                code({ node, inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline && match ? (
                                    <div className="my-4">
                                      <div className="bg-gray-800 text-gray-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-t-lg">
                                        {match[1]}
                                      </div>
                                      <SyntaxHighlighter
                                        style={tomorrow}
                                        language={match[1]}
                                        PreTag="div"
                                        className="rounded-b-lg shadow-inner !mt-0"
                                        customStyle={{
                                          margin: 0,
                                          borderTopLeftRadius: 0,
                                          borderTopRightRadius: 0,
                                        }}
                                        {...props}
                                      >
                                        {String(children).replace(/\n$/, '')}
                                      </SyntaxHighlighter>
                                    </div>
                                  ) : (
                                    <code className="bg-gray-800 text-green-400 px-2 py-1 rounded text-sm font-mono" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 ml-4">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 ml-4">{children}</ol>,
                                li: ({ children }) => <li className="mb-1">{children}</li>,
                                h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-purple-700">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-purple-600">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-md font-semibold mb-2 text-purple-600">{children}</h3>,
                                strong: ({ children }) => <strong className="font-semibold text-purple-700">{children}</strong>,
                                em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-purple-300 pl-4 py-2 my-3 bg-purple-50/50 rounded-r">
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          ) : (
                            <p className="leading-relaxed">{message.content}</p>
                          )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Typing Indicators */}
                  {isAITyping && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600">
                        🤖
                      </div>
                      <div className="flex-1 max-w-3xl">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-purple-600">
                            AI Assistant
                          </span>
                          <span className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-full">
                            now
                          </span>
                        </div>
                        <div className="rounded-2xl p-4 shadow-sm border max-w-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200/50 text-gray-800">
                          <div className="flex items-center gap-2 text-purple-600">
                            <span className="text-sm font-medium">AI Assistant is thinking</span>
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {typingUsers.map((userName) => (
                    <div key={userName} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 max-w-3xl">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-blue-600">
                            {userName}
                          </span>
                          <span className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-full">
                            now
                          </span>
                        </div>
                        <div className="rounded-2xl p-4 shadow-sm border max-w-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 text-gray-800">
                          <div className="flex items-center gap-2 text-blue-600">
                            <span className="text-sm font-medium">{userName} is typing</span>
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 border-t border-white/20">
                  <form onSubmit={handleSend} className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        className="w-full bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl px-6 py-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent shadow-sm transition-all duration-200"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message here..."
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Chat-Only Mode
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Chat
                </h2>
              </div>

              <div className="h-[600px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-blue-50/30">
                {messages.map((message) => {
                  const isCurrentUser = message.userId === user?.id;
                  const isAI = message.sender === 'AI Assistant' || message.userName === 'AI Assistant';
                  const displayName = isAI ? 'AI Assistant' : (message.user?.name || message.userName || user?.name || 'User');
                  
                  return (
                    <div key={message.id} className={`flex items-start gap-3 ${
                      isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg ${
                        isAI
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                          : isCurrentUser
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      }`}>
                        {isAI ? '🤖' : displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className={`flex-1 max-w-3xl ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                        <div className={`flex items-center gap-2 mb-2 ${
                          isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                        }`}>
                          <span className={`font-semibold ${
                            isAI
                              ? 'text-purple-600'
                              : isCurrentUser 
                              ? 'text-green-600'
                              : 'text-blue-600'
                          }`}>
                            {isCurrentUser ? 'You' : displayName}
                          </span>
                          <span className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-full">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className={`rounded-2xl p-4 shadow-sm border max-w-2xl ${
                          isAI
                            ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200/50 text-gray-800'
                            : isCurrentUser
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50 text-gray-800'
                            : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 text-gray-800'
                        }`}>
                        {message.sender === 'AI Assistant' || message.userName === 'AI Assistant' ? (
                          <ReactMarkdown
                            components={{
                              code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <div className="my-4">
                                    <div className="bg-gray-800 text-gray-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-t-lg">
                                      {match[1]}
                                    </div>
                                    <SyntaxHighlighter
                                      style={tomorrow}
                                      language={match[1]}
                                      PreTag="div"
                                      className="rounded-b-lg shadow-inner !mt-0"
                                      customStyle={{
                                        margin: 0,
                                        borderTopLeftRadius: 0,
                                        borderTopRightRadius: 0,
                                      }}
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <code className="bg-gray-800 text-green-400 px-2 py-1 rounded text-sm font-mono" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 ml-4">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 ml-4">{children}</ol>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                              h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-purple-700">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-purple-600">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-md font-semibold mb-2 text-purple-600">{children}</h3>,
                              strong: ({ children }) => <strong className="font-semibold text-purple-700">{children}</strong>,
                              em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-purple-300 pl-4 py-2 my-3 bg-purple-50/50 rounded-r">
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="leading-relaxed">{message.content}</p>
                        )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing Indicators */}
                {isAITyping && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600">
                      🤖
                    </div>
                    <div className="flex-1 max-w-3xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-purple-600">
                          AI Assistant
                        </span>
                        <span className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-full">
                          now
                        </span>
                      </div>
                      <div className="rounded-2xl p-4 shadow-sm border max-w-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200/50 text-gray-800">
                        <div className="flex items-center gap-2 text-purple-600">
                          <span className="text-sm font-medium">AI Assistant is thinking</span>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {typingUsers.map((userName) => (
                  <div key={userName} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 max-w-3xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-blue-600">
                          {userName}
                        </span>
                        <span className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-full">
                          now
                        </span>
                      </div>
                      <div className="rounded-2xl p-4 shadow-sm border max-w-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 text-gray-800">
                        <div className="flex items-center gap-2 text-blue-600">
                          <span className="text-sm font-medium">{userName} is typing</span>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 border-t border-white/20">
                <form onSubmit={handleSend} className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className="w-full bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl px-6 py-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent shadow-sm transition-all duration-200"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message here..."
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-8">
          <button
            type="button"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            onClick={() => navigate("/")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
