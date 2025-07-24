import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

const StudyRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rooms`);
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (err) {
      setError("Failed to fetch rooms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, subject, maxParticipants }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create room");
      setName("");
      setSubject("");
      setMaxParticipants(5);
      fetchRooms();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (roomId) => {
    setJoining(roomId);
    setError("");
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join room");
      fetchRooms();
      navigate(`/rooms/${roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl space-y-8">
        <h2 className="text-3xl font-bold mb-4 text-center">Study Rooms</h2>
        {error && <div className="text-red-500 text-center">{error}</div>}
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-center mb-8">
          <input
            type="text"
            placeholder="Room Name"
            className="border px-3 py-2 rounded w-full"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Subject"
            className="border px-3 py-2 rounded w-full"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          />
          <input
            type="number"
            min={2}
            max={20}
            className="border px-3 py-2 rounded w-24"
            value={maxParticipants}
            onChange={e => setMaxParticipants(Number(e.target.value))}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            disabled={creating}
          >
            {creating ? "Creating..." : "Create Room"}
          </button>
        </form>
        <div>
          {loading ? (
            <div className="text-center">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center text-gray-500">No rooms yet. Create one above!</div>
          ) : (
            <table className="w-full border rounded">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Name</th>
                  <th className="p-2">Subject</th>
                  <th className="p-2">Participants</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id} className="border-t">
                    <td className="p-2">{room.name}</td>
                    <td className="p-2">{room.subject}</td>
                    <td className="p-2">{room.participants.length} / {room.maxParticipants}</td>
                    <td className="p-2">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                        onClick={() => handleJoin(room.id)}
                        disabled={joining === room.id}
                      >
                        {joining === room.id ? "Joining..." : "Join"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyRooms; 