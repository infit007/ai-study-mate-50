import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CollaborativeWhiteboard from "@/components/CollaborativeWhiteboard";
import SyncedPomodoroTimer from "@/components/SyncedPomodoroTimer";
import ParticipantsList from "@/components/ParticipantsList";
import InterfaceToggle from "@/components/InterfaceToggle";
import ResizableLayout from "@/components/ResizableLayout";
import AudioStream from "@/components/AudioStream";
import CallButton from "@/components/CallButton";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [interfaceMode, setInterfaceMode] = useState<'chat' | 'whiteboard'>('chat');
  const [participants, setParticipants] = useState<any[]>([]);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!id) return;

    // Fetch room info
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/rooms`);
        const data = await res.json();
        const found = (data.rooms || []).find((r: any) => r.id === id);
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
      } catch (err) {
        console.error("Room fetch error:", err);
        setError("Failed to load room.");
      } finally {
        setLoading(false);
      }
    };

    // Fetch messages
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/rooms/${id}/messages`);
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Messages fetch error:", err);
      }
    };

    fetchRoom();
    fetchMessages();

    // Initialize socket and join room
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    (socket as any).userName = user?.name || 'Anonymous';
    socket.emit("joinRoom", id);
    socket.on("chatMessage", (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      // Hide AI typing indicator when AI responds
      if (msg.sender === 'AI Assistant' || msg.userName === 'AI Assistant') {
        setIsAITyping(false);
      }
    });

    // Listen for user join/leave events
    socket.on('userJoined', (data: { userId: string; userName: string }) => {
      console.log('User joined:', data.userName);
      // Add user to participants if not already present
      setParticipants(prev => {
        const existing = prev.find(p => p.id === data.userId);
        if (!existing) {
          return [...prev, {
            id: data.userId,
            name: data.userName,
            subject: room?.subject || 'General',
            status: 'online'
          }];
        }
        return prev;
      });
    });

    socket.on('userLeft', (data: { userId: string; userName: string }) => {
      console.log('User left:', data.userName);
      // Remove user from participants
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
    });

    socket.on('currentUsers', (users: string[]) => {
      console.log('Current users in room:', users);
      // Add existing users to participants
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

    socketRef.current = socket;

    return () => {
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('currentUsers');
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !socketRef.current) return;
    
    // Check if this is an AI request
    const isAIRequest = input.trim().toLowerCase().startsWith('@ai');
    
    socketRef.current.emit("chatMessage", {
      roomId: id,
      userId: user.id,
      content: input,
    });
    
    // Show AI typing indicator if it's an AI request
    if (isAIRequest) {
      setIsAITyping(true);
      // Set a timeout to hide the indicator if no response comes (fallback)
      setTimeout(() => setIsAITyping(false), 30000); // 30 seconds timeout
    }
    
    setInput("");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error || !room) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error || "Room not found."}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-none mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 mb-4 border border-white/20 flex-shrink-0">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">{room?.name}</h1>
          <p className="text-gray-600 text-sm mb-2">{room?.description}</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-500">Participants: {room?.participants?.length || 0}</span>
            <span className="text-gray-500">Created: {room?.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'Unknown'}</span>
          </div>
        </div>

        {/* Interface Toggle */}
        <div className="mb-4 flex-shrink-0">
          <InterfaceToggle
            currentMode={interfaceMode}
            onToggle={() => setInterfaceMode(interfaceMode === 'chat' ? 'whiteboard' : 'chat')}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-[480px]">
          {/* Whiteboard Mode */}
          {interfaceMode === 'whiteboard' && (
            <ResizableLayout
              defaultLeftWidth={65}
              minLeftWidth={50}
              maxLeftWidth={85}
              leftComponent={
                <CollaborativeWhiteboard 
                  roomId={id!} 
                  socket={socketRef.current} 
                  user={user}
                />
              }
              rightComponent={
                <div className="h-full flex flex-col space-y-2">
                  <ParticipantsList
                    roomId={id!}
                    socket={socketRef.current}
                    user={user}
                    participants={participants}
                  />
                  
                  {/* Chat in sidebar when whiteboard mode is active */}
                  <div className="flex-1 bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden flex flex-col min-h-0">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </h2>
          </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-transparent to-blue-50/30 min-h-0 max-h-[560px]">
                      {messages.slice(-10).map((message) => {
                        const isCurrentUser = message.userId === user?.id;
                        const isAI = message.sender === 'AI Assistant' || message.userName === 'AI Assistant';
                        const displayName = isAI ? 'AI Assistant' : (message.user?.name || message.userName || user?.name || 'User');
                        
                        return (
                          <div key={message.id} className={`flex items-start gap-2 ${
                            isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                          }`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-lg ${
                              isAI
                                ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                                : isCurrentUser
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                            }`}>
                              {isAI ? '🤖' : displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className={`flex-1 min-w-0 ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                              <div className={`flex items-center gap-1 mb-1 ${
                                isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                              }`}>
                                <span className={`text-xs font-semibold ${
                                  isAI
                                    ? 'text-purple-600'
                                    : isCurrentUser 
                                    ? 'text-green-600'
                                    : 'text-blue-600'
                                }`}>
                                  {isCurrentUser ? 'You' : displayName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                              <div className={`rounded-lg p-2 shadow-sm border text-xs ${
                                isAI
                                  ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200/50 text-gray-800'
                                  : isCurrentUser
                                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50 text-gray-800'
                                  : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50 text-gray-800'
                              }`}>
                                <p className="leading-relaxed">{message.content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-3 border-t border-white/20 flex-shrink-0">
                      <form onSubmit={handleSend} className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            className="w-full bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl px-4 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent shadow-sm transition-all duration-200 text-sm"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            required
                          />
                        </div>
                        

                        
                        <button 
                          type="submit" 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-1 font-medium text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              }
              />
            )}
            
            
            
            {/* Chat Mode */}
            {interfaceMode === 'chat' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[480px]">
                {/* Main Chat Area */}
                <div className="lg:col-span-4 bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden flex flex-col">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Group Chat
                    </h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-blue-50/30 min-h-0 max-h-[600px]">
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
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Call Button */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 border-b border-white/20">
                    <CallButton
                      roomId={id!}
                      socket={socketRef.current}
                      user={user}
                      participants={participants}
                    />
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 border-t border-white/20 flex-shrink-0">
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

                {/* Sidebar - Participants */}
                <div className="lg:col-span-1">
                  <ParticipantsList
                    roomId={id!}
                    socket={socketRef.current}
                    user={user}
                    participants={participants}
                    activeSpeakers={activeSpeakers}
                  />
                </div>
              </div>
            )}
          </div>

        {/* Compact Pomodoro Session - Show on both interfaces */}
        <div className="mb-4 mt-4">
          <SyncedPomodoroTimer
            roomId={id!}
            socket={socketRef.current}
            user={user}
            onSessionComplete={() => {
              // Optional: Send notification to chat when session completes
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

        <div className="flex justify-center mt-8 mb-6">
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
