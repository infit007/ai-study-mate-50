import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const API_URL = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

const socket = io(SOCKET_URL);

const RoomDetails = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    // Fetch room info and messages
    const fetchRoom = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/rooms`);
        const data = await res.json();
        const found = (data.rooms || []).find(r => r.id === id);
        setRoom(found);
      } catch {
        setError("Failed to load room.");
      } finally {
        setLoading(false);
      }
    };
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/rooms/${id}/messages`);
        const data = await res.json();
        setMessages(data.messages || []);
      } catch {}
    };
    fetchRoom();
    fetchMessages();
    // Join room via socket
    socket.emit("joinRoom", id);
    // Listen for new messages
    socket.on("chatMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.off("chatMessage");
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    socket.emit("chatMessage", {
      roomId: id,
      userId: user.id,
      content: input,
    });
    setInput("");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error || !room) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || "Room not found."}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 py-8">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-2xl mb-6">
        <h2 className="text-2xl font-bold mb-2">{room.name}</h2>
        <div className="text-gray-600 mb-2">Subject: {room.subject}</div>
        <div className="text-gray-500 text-sm mb-2">Participants: {room.participants.length} / {room.maxParticipants}</div>
      </div>
      <div className="bg-white p-6 rounded shadow-md w-full max-w-2xl flex-1 flex flex-col" style={{ minHeight: 400 }}>
        <div className="flex-1 overflow-y-auto mb-4" style={{ maxHeight: 300 }}>
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-2 ${msg.userId === user?.id ? "text-right" : "text-left"}`}>
              <span className="font-semibold text-blue-700">
                {msg.userId === user?.id ? "You" : (msg.userName || msg.userId)}
              </span>: {msg.content}
              <div className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleTimeString()}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            className="flex-1 border px-3 py-2 rounded"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            required
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Send</button>
        </form>
      </div>
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
  );
};

export default RoomDetails; 