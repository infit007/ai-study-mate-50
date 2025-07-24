import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import StudyRoomPreview from "@/components/StudyRoomPreview";
import AIAssistantDemo from "@/components/AIAssistantDemo";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const Index = () => {
  const isLoggedIn = Boolean(localStorage.getItem("user"));
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.reload();
  };
  return (
    <div className="min-h-screen">
      {/* Auth Links */}
      <div className="flex justify-end gap-4 p-4">
        {!isLoggedIn && <>
          <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
          <Link to="/register" className="text-green-600 hover:underline">Register</Link>
        </>}
        <Link to="/pricing" className="text-purple-600 hover:underline">Pricing</Link>
        <Link to="/study-rooms" className="text-blue-700 hover:underline">Study Rooms</Link>
        {isLoggedIn && <Link to="/profile" className="text-gray-700 hover:underline">Profile</Link>}
        {isLoggedIn && <button onClick={handleLogout} className="text-red-600 hover:underline">Logout</button>}
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
