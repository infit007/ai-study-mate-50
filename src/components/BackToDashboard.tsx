import { useNavigate } from "react-router-dom";
const BackToDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="mb-4">
      <button
        type="button"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        onClick={() => navigate("/")}
      >
        &larr; Back to Dashboard
      </button>
    </div>
  );
};
export default BackToDashboard; 