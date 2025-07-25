import { useEffect, useState } from "react";
import BackToDashboard from "@/components/BackToDashboard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleEdit = () => {
    setEditing(true);
    setNewName(user?.name || "");
    setError("");
    setSuccess("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update name");
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSuccess("Name updated!");
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to view your profile.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-6">
        <BackToDashboard />
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <div><strong>Email:</strong> {user.email}</div>
        <div className="flex items-center gap-2">
          <strong>Name:</strong>
          {editing ? (
            <form onSubmit={handleSave} className="flex gap-2 items-center">
              <input
                type="text"
                className="border px-2 py-1 rounded"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
              />
              <button type="submit" className="bg-green-600 text-white px-2 py-1 rounded" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
              <button type="button" className="bg-gray-400 text-white px-2 py-1 rounded" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <>
              <span>{user.name || <span className="text-gray-400">(not set)</span>}</span>
              <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={handleEdit}>
                Edit
              </button>
            </>
          )}
        </div>
        <div><strong>Signup Date:</strong> {user.signupDate ? new Date(user.signupDate).toLocaleString() : 'N/A'}</div>
        <div><strong>Status:</strong> {user.lifetimeFree ? <span className="text-green-700 font-semibold">Lifetime Free</span> : <span className="text-blue-700">Standard</span>}</div>
        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
      </div>
    </div>
  );
};

export default Profile; 