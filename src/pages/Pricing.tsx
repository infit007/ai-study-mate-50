import { useEffect, useState } from "react";
import BackToDashboard from "@/components/BackToDashboard";

const Pricing = () => {
  const [lifetimeFree, setLifetimeFree] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      setLifetimeFree(!!parsed.lifetimeFree);
      setUserEmail(parsed.email);
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl space-y-8">
        {isLoggedIn && <BackToDashboard />}
        <h2 className="text-3xl font-bold mb-4 text-center">Pricing</h2>
        {lifetimeFree && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center mb-6">
            <strong>Congratulations!</strong> {userEmail && (<span>{userEmail},</span>)} you signed up during our launch window.<br />
            <span className="font-semibold">You get premium features <span className="text-green-800">free for life</span>!</span>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="border rounded p-6 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <div className="text-3xl font-bold mb-2">$0</div>
            <ul className="mb-4 text-gray-600 list-disc list-inside">
              <li>5 study rooms/month</li>
              <li>Basic AI assistant (20 queries/day)</li>
              <li>Standard notes and materials</li>
            </ul>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">Current Plan</span>
          </div>
          <div className="border rounded p-6 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-2">Premium</h3>
            <div className="text-3xl font-bold mb-2">$9.99<span className="text-base font-normal">/month</span></div>
            <ul className="mb-4 text-gray-600 list-disc list-inside">
              <li>Unlimited study rooms</li>
              <li>Advanced AI features (unlimited queries)</li>
              <li>Advanced analytics and insights</li>
              <li>Priority support</li>
            </ul>
            {lifetimeFree ? (
              <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">Lifetime Free</span>
            ) : (
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Upgrade</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing; 