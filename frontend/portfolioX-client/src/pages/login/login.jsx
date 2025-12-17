import React, { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // URL de ton backend Django
  const API_BASE_URL = "http://127.0.0.1:8000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      setLoading(false);
      return;
    }

    try {
      // Appel à l'API Django
      const response = await fetch(`${API_BASE_URL}/api/auth/connexion/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Gestion des erreurs
        if (data.detail) {
          throw new Error(data.detail);
        } else if (data.message) {
          throw new Error(data.message);
        } else if (data.email) {
          throw new Error(`Email: ${data.email[0]}`);
        } else {
          throw new Error("Échec de la connexion");
        }
      }

      // Connexion réussie
      if (data.access) {
        localStorage.setItem("portfolioX_access_token", data.access);
      }
      if (data.refresh) {
        localStorage.setItem("portfolioX_refresh_token", data.refresh);
      }
      if (data.user) {
        localStorage.setItem("portfolioX_user", JSON.stringify(data.user));
      }

      // Redirection
      window.location.href = "/";

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      {/* Logo */}
      <div className="mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center">
          <img src="/logo/logo.png" alt="logo" className="w-20" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-black mb-10">
        Welcome back
      </h1>

      {/* Message d'erreur */}
      {error && (
        <div className="w-full max-w-sm mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-6">
        {/* Email */}
        <div className="relative">
          <span className="absolute left-0 top-1.5 text-gray-500 text-xl">
            ✉️
          </span>
          <input
            type="email"
            placeholder="enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-b border-gray-400 pl-8 pb-2 focus:outline-none focus:border-purple-500 transition"
            disabled={loading}
            required
          />
        </div>

        {/* Password */}
        <div>
          <input
            type="password"
            placeholder="enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-b border-gray-400 pb-2 focus:outline-none focus:border-purple-500 transition"
            disabled={loading}
            required
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          className="bg-purple-500 text-white py-2 rounded-md font-medium hover:bg-purple-600 transition mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Connexion en cours..." : "Login"}
        </button>
      </form>

      {/* Lien vers l'inscription */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Pas encore de compte ?{" "}
          <a 
            href="/logout"
            className="text-purple-500 hover:text-purple-600 font-medium"
          >
            S'inscrire
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;