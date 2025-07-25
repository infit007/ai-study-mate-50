import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import StudyRoomPreview from "@/components/StudyRoomPreview";
import AIAssistantDemo from "@/components/AIAssistantDemo";
import Footer from "@/components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem("user")));
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onStorage = () => setIsLoggedIn(Boolean(localStorage.getItem("user")));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const u = localStorage.getItem("user");
      if (u) setUser(JSON.parse(u));
      fetchRooms();
    }
  }, [isLoggedIn]);

  const fetchRooms = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/rooms`);
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch {
      setError("Failed to fetch study rooms.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);
    window.location.reload();
  };

  if (isLoggedIn && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-end gap-4 p-4">
          <Link to="/pricing" className="text-purple-600 hover:underline">Pricing</Link>
          <Link to="/profile" className="text-gray-700 hover:underline">Profile</Link>
          <button onClick={handleLogout} className="text-red-600 hover:underline">Logout</button>
        </div>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user.name ? user.name : user.email}!</h1>
          <p className="mb-6 text-gray-600">Ready to study? Join or create a study room below.</p>
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Study Rooms</h2>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              onClick={() => navigate("/study-rooms")}
            >
              Go to Study Rooms
            </button>
          </div>
          {loading ? (
            <div>Loading rooms...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : rooms.length === 0 ? (
            <div className="text-gray-500">No study rooms yet. <Link to="/study-rooms" className="text-blue-600 hover:underline">Create one</Link>!</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {rooms.slice(0, 4).map(room => (
                <div key={room.id} className="bg-white rounded shadow p-4 flex flex-col gap-2">
                  <div className="font-bold text-lg">{room.name}</div>
                  <div className="text-gray-600">Subject: {room.subject}</div>
                  <div className="text-gray-500 text-sm">Participants: {room.participants.length} / {room.maxParticipants}</div>
                  <button
                    className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                    Join Room
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Guest home page
  return (
    <div className="min-h-screen">
      {/* Auth Links */}
      <div className="flex justify-end gap-4 p-4">
        <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        <Link to="/register" className="text-green-600 hover:underline">Register</Link>
        <Link to="/pricing" className="text-purple-600 hover:underline">Pricing</Link>
        <Link to="/study-rooms" className="text-blue-700 hover:underline">Study Rooms</Link>
      </div>
      <Navigation />
      <Hero />
      <Features />
      <StudyRoomPreview />
      <AIAssistantDemo />
      <Footer />
    </div>
  );
};

export default Index;
