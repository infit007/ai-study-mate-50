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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
              Study Rooms
            </h1>
            <p className="text-gray-600">Join existing rooms or create your own study space</p>
          </div>
          <button
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center gap-2"
            onClick={() => navigate("/")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-center">
            <div className="text-red-600 font-medium mb-1">⚠️ Error</div>
            <div className="text-red-500">{error}</div>
          </div>
        )}

        {/* Create Room Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Create New Study Room</h2>
              <p className="text-sm text-gray-600">Set up a new space for collaborative learning</p>
            </div>
          </div>
          
          <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Room Name</label>
              <input
                type="text"
                placeholder="e.g., Math Study Group"
                className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                placeholder="e.g., Calculus"
                className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
              <input
                type="number"
                min={2}
                max={20}
                className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200"
                value={maxParticipants}
                onChange={e => setMaxParticipants(Number(e.target.value))}
                required
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center justify-center gap-2"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Room
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        {/* Rooms Display */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-gray-600 font-medium">Loading study rooms...</div>
              </div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Study Rooms Yet</h3>
              <p className="text-gray-600 mb-4">Be the first to create a study room and start collaborating!</p>
              <div className="text-sm text-gray-500">Use the form above to create your first room</div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map(room => (
                <div key={room.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
                  {editingRoom === room.id ? (
                    /* Edit Mode */
                    <form onSubmit={handleEdit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                        <input
                          type="text"
                          className="w-full bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input
                          type="text"
                          className="w-full bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200"
                          value={editSubject}
                          onChange={e => setEditSubject(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                        <input
                          type="number"
                          min={2}
                          max={20}
                          className="w-full bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200"
                          value={editMaxParticipants}
                          onChange={e => setEditMaxParticipants(Number(e.target.value))}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`private-${room.id}`}
                          checked={editIsPrivate}
                          onChange={e => setEditIsPrivate(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`private-${room.id}`} className="text-sm font-medium text-gray-700">Private Room</label>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          className="flex-1 bg-gray-400 text-white py-2 rounded-xl hover:bg-gray-500 transition-all duration-200 font-medium"
                          onClick={() => setEditingRoom(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Display Mode */
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                            {room.subject?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg">{room.name}</h3>
                            <p className="text-gray-600 text-sm">{room.subject}</p>
                          </div>
                        </div>
                        {room.isPrivate && (
                          <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg text-xs font-medium">
                            🔒 Private
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <span>{(room.participants?.length ?? 0)} / {room.maxParticipants} participants</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center justify-center gap-2"
                          onClick={() => handleJoin(room.id)}
                          disabled={joining === room.id}
                        >
                          {joining === room.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Joining...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              </svg>
                              Join Room
                            </>
                          )}
                        </button>
                        
                        {user && room.createdById === user.id && (
                          <div className="flex gap-2">
                            <button
                              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-2 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                              onClick={() => startEdit(room)}
                              title="Edit Room"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-2 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                              onClick={() => handleDelete(room.id)}
                              title="Delete Room"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyRooms; 