import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const StudyRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState("");
  const [editingRoom, setEditingRoom] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editMaxParticipants, setEditMaxParticipants] = useState(5);
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

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

  const handleDelete = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    setError("");
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete room");
      fetchRooms();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (room) => {
    setEditingRoom(room.id);
    setEditName(room.name);
    setEditSubject(room.subject);
    setEditMaxParticipants(room.maxParticipants);
    setEditIsPrivate(room.isPrivate);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/rooms/${editingRoom}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          subject: editSubject,
          maxParticipants: editMaxParticipants,
          isPrivate: editIsPrivate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update room");
      setEditingRoom(null);
      fetchRooms();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl space-y-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-center">Study Rooms</h2>
          <button
            type="button"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            onClick={() => navigate("/")}
          >
            Go to Dashboard
          </button>
        </div>
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
                    <td className="p-2">
                      {editingRoom === room.id ? (
                        <input
                          type="text"
                          className="border px-2 py-1 rounded w-full"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                      ) : (
                        room.name
                      )}
                    </td>
                    <td className="p-2">
                      {editingRoom === room.id ? (
                        <input
                          type="text"
                          className="border px-2 py-1 rounded w-full"
                          value={editSubject}
                          onChange={e => setEditSubject(e.target.value)}
                        />
                      ) : (
                        room.subject
                      )}
                    </td>
                    <td className="p-2">
                      {(room.participants?.length ?? 0) + " / " + room.maxParticipants}
                    </td>
                    <td className="p-2 flex gap-2">
                      {editingRoom === room.id ? (
                        <>
                          <input
                            type="number"
                            min={2}
                            max={20}
                            className="border px-2 py-1 rounded w-20"
                            value={editMaxParticipants}
                            onChange={e => setEditMaxParticipants(Number(e.target.value))}
                          />
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={editIsPrivate}
                              onChange={e => setEditIsPrivate(e.target.checked)}
                            />
                            Private
                          </label>
                          <button
                            className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition"
                            onClick={handleEdit}
                          >
                            Save
                          </button>
                          <button
                            className="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500 transition"
                            onClick={() => setEditingRoom(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                            onClick={() => handleJoin(room.id)}
                            disabled={joining === room.id}
                          >
                            {joining === room.id ? "Joining..." : "Join"}
                          </button>
                          {user && room.createdById === user.id && (
                            <>
                              <button
                                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                                onClick={() => startEdit(room)}
                              >
                                Edit
                              </button>
                              <button
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                                onClick={() => handleDelete(room.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </>
                      )}
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