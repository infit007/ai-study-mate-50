import { useEffect, useState } from "react";

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to view your profile.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Signup Date:</strong> {user.signupDate ? new Date(user.signupDate).toLocaleString() : 'N/A'}</div>
        <div><strong>Status:</strong> {user.lifetimeFree ? <span className="text-green-700 font-semibold">Lifetime Free</span> : <span className="text-blue-700">Standard</span>}</div>
        <div className="mt-6 text-gray-500">Profile editing coming soon...</div>
      </div>
    </div>
  );
};

export default Profile; 