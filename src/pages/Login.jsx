import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate("/admin");
  };

  return (
    <section className="max-w-md mx-auto p-6 bg-surface rounded-lg shadow-lg mt-12">
      <h2 className="text-xl font-bold mb-4 text-primary text-center">Admin Login</h2>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleLogin} className="space-y-4">
        <input type="email" placeholder="Email" className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 transition">Sign In</button>
      </form>
    </section>
  );
}
