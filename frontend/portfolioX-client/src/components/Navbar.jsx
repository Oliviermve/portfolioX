import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Fonction utilitaire pour les appels API
const fetchApi = async (endpoint, method = 'GET', data = null) => {
  const url = `http://localhost:8000${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
  };

  // Ajouter le token JWT s'il existe (utiliser la même clé que Login.jsx)
  const token = localStorage.getItem('portfolioX_access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Si erreur 401, le token est peut-être expiré
      if (response.status === 401) {
        // Essayer de rafraîchir le token
        const refreshToken = localStorage.getItem('portfolioX_refresh_token');
        if (refreshToken) {
          try {
            const refreshResponse = await fetch('http://localhost:8000/api/auth/token/refresh/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken })
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              localStorage.setItem('portfolioX_access_token', refreshData.access);
              headers['Authorization'] = `Bearer ${refreshData.access}`;
              
              // Réessayer la requête originale avec le nouveau token
              config.headers = headers;
              const retryResponse = await fetch(url, config);
              if (!retryResponse.ok) {
                throw new Error(`Erreur HTTP: ${retryResponse.status}`);
              }
              return await retryResponse.json();
            }
          } catch (refreshError) {
            console.error('Erreur rafraîchissement token:', refreshError);
          }
        }
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `Erreur HTTP: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // États pour la modale
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // Composant Login simplifié pour la modale
  const LoginModal = ({ onSwitchToRegister, onClose, onLoginSuccess }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const API_BASE_URL = "http://127.0.0.1:8000";

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      if (!email || !password) {
        setError("Veuillez remplir tous les champs");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/connexion/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.detail) throw new Error(data.detail);
          else if (data.message) throw new Error(data.message);
          else if (data.email) throw new Error(`Email: ${data.email[0]}`);
          else throw new Error("Échec de la connexion");
        }

        // Connexion réussie
        if (data.access) localStorage.setItem("portfolioX_access_token", data.access);
        if (data.refresh) localStorage.setItem("portfolioX_refresh_token", data.refresh);
        if (data.user) localStorage.setItem("portfolioX_user", JSON.stringify(data.user));

        // Fermer la modale et notifier le succès
        onLoginSuccess();
        onClose();

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center bg-white px-8 py-10 rounded-2xl">
        {/* Logo */}
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center">
            <img src="/logo/logo.png" alt="logo" className="w-16" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-black mb-8">
          Welcome back
        </h1>

        {/* Message d'erreur */}
        {error && (
          <div className="w-full max-w-sm mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
          <div className="relative">
            <span className="absolute left-0 top-1.5 text-gray-500">✉️</span>
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

          <button
            type="submit"
            className="bg-purple-500 text-white py-2 rounded-md font-medium hover:bg-purple-600 transition mt-4 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : "Login"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Pas encore de compte ?{" "}
            <button
              onClick={onSwitchToRegister}
              className="text-purple-500 hover:text-purple-600 font-medium"
            >
              S'inscrire
            </button>
          </p>
        </div>
      </div>
    );
  };

  // Composant Register simplifié pour la modale
  const RegisterModal = ({ onSwitchToLogin, onClose, onRegisterSuccess }) => {
    const [formData, setFormData] = useState({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      passwordConfirmation: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const API_BASE_URL = "http://127.0.0.1:8000";

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      setLoading(true);

      if (!formData.nom || !formData.prenom || !formData.email || !formData.password || !formData.passwordConfirmation) {
        setError('Tous les champs sont obligatoires');
        setLoading(false);
        return;
      }

      if (!formData.email.includes('@')) {
        setError('Veuillez entrer un email valide');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.passwordConfirmation) {
        setError('Les mots de passe ne correspondent pas');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/inscription/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
            password: formData.password,
            password_confirmation: formData.passwordConfirmation
          }),
        });

        const data = await response.json();

        if (!response.ok || (data.success === false && data.success !== undefined)) {
          if (data.email?.[0]) throw new Error(`Email: ${data.email[0]}`);
          else if (data.password?.[0]) throw new Error(`Mot de passe: ${data.password[0]}`);
          else if (data.nom?.[0]) throw new Error(`Nom: ${data.nom[0]}`);
          else if (data.prenom?.[0]) throw new Error(`Prénom: ${data.prenom[0]}`);
          else if (data.error) throw new Error(data.error);
          else if (data.message) throw new Error(data.message);
          else if (data.detail) throw new Error(data.detail);
          else throw new Error("Erreur lors de l'inscription");
        }

        setSuccess('Inscription réussie !');
        onRegisterSuccess();
        
        // Auto-switch to login after 2 seconds
        setTimeout(() => {
          onSwitchToLogin();
          setSuccess('');
        }, 2000);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fillTestData = () => {
      setFormData({
        nom: 'Doe',
        prenom: 'John',
        email: `test${Math.floor(Math.random() * 1000)}@example.com`,
        password: 'password123',
        passwordConfirmation: 'password123'
      });
    };

    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center bg-white px-8 py-10 rounded-2xl">
        {/* Logo */}
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center">
            <img src="/logo/logo.png" alt="logo" className="w-16" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-black mb-8">
          Create an account
        </h1>

        {success && (
          <div className="w-full max-w-sm mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="w-full max-w-sm mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
          <div className="relative">
            <span className="absolute left-0 top-1.5 text-gray-500">👤</span>
            <input
              type="text"
              name="nom"
              placeholder="enter your name"
              value={formData.nom}
              onChange={handleChange}
              className="w-full border-b border-gray-400 pl-8 pb-2 focus:outline-none focus:border-purple-500 transition"
              disabled={loading}
              required
            />
          </div>

          <div className="relative">
            <span className="absolute left-0 top-1.5 text-gray-500">👤</span>
            <input
              type="text"
              name="prenom"
              placeholder="enter your subname"
              value={formData.prenom}
              onChange={handleChange}
              className="w-full border-b border-gray-400 pl-8 pb-2 focus:outline-none focus:border-purple-500 transition"
              disabled={loading}
              required
            />
          </div>

          <div className="relative">
            <span className="absolute left-0 top-1.5 text-gray-500">✉️</span>
            <input
              type="email"
              name="email"
              placeholder="enter your email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border-b border-gray-400 pl-8 pb-2 focus:outline-none focus:border-purple-500 transition"
              disabled={loading}
              required
            />
          </div>

          <div className="relative">
            <span className="absolute left-0 top-1.5 text-gray-500">🔒</span>
            <input
              type="password"
              name="password"
              placeholder="enter your password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border-b border-gray-400 pl-8 pb-2 focus:outline-none focus:border-purple-500 transition"
              disabled={loading}
              required
            />
          </div>

          <div className="relative">
            <span className="absolute left-0 top-1.5 text-gray-500">🔒</span>
            <input
              type="password"
              name="passwordConfirmation"
              placeholder="confirm your password"
              value={formData.passwordConfirmation}
              onChange={handleChange}
              className="w-full border-b border-gray-400 pl-8 pb-2 focus:outline-none focus:border-purple-500 transition"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="bg-purple-500 text-white py-2 rounded-md font-medium hover:bg-purple-600 transition mt-4 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Inscription en cours..." : "Sign Up"}
          </button>
        </form>

        <button
          onClick={fillTestData}
          className="mt-4 text-sm text-purple-500 hover:text-purple-600"
        >
          Remplir avec des données de test
        </button>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Déjà un compte ?{" "}
            <button
              onClick={onSwitchToLogin}
              className="text-purple-500 hover:text-purple-600 font-medium"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    );
  };

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('portfolioX_access_token');
      const user = localStorage.getItem('portfolioX_user');
      
      if (token && user) {
        try {
          const parsedUser = JSON.parse(user);
          setIsAuthenticated(true);
          setUserData(parsedUser);
        } catch (error) {
          console.error("Erreur parsing user data:", error);
          clearAuthData();
        }
      } else {
        clearAuthData();
      }
    };

    checkAuth();
    
    // Écouter les changements de localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'portfolioX_access_token' || e.key === 'portfolioX_user') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Vérifier périodiquement la validité du token
    const checkTokenValidity = async () => {
      const token = localStorage.getItem('portfolioX_access_token');
      if (token) {
        try {
          await fetchApi('/api/auth/verifier-token/', 'POST', { token });
        } catch (error) {
          console.log("Token invalide ou expiré:", error);
          clearAuthData();
        }
      }
    };
    
    const intervalId = setInterval(checkTokenValidity, 5 * 60 * 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  // Nettoyer les données d'authentification
  const clearAuthData = () => {
    localStorage.removeItem('portfolioX_access_token');
    localStorage.removeItem('portfolioX_refresh_token');
    localStorage.removeItem('portfolioX_user');
    setIsAuthenticated(false);
    setUserData(null);
  };

  // Gérer la recherche
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/models?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
    }
  };

  // Gérer la déconnexion
  const handleLogout = async () => {
    setLoading(true);
    try {
      const refreshToken = localStorage.getItem('portfolioX_refresh_token');
      if (refreshToken) {
        await fetch('http://localhost:8000/api/auth/deconnexion/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('portfolioX_access_token')}`
          },
          body: JSON.stringify({ refresh: refreshToken })
        });
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion API:", error);
    } finally {
      clearAuthData();
      setLoading(false);
      navigate('/');
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Fonctions pour la modale
  const openLoginModal = () => {
    setAuthMode("login");
    setShowAuthModal(true);
    document.body.style.overflow = "hidden";
  };

  const openRegisterModal = () => {
    setAuthMode("register");
    setShowAuthModal(true);
    document.body.style.overflow = "hidden";
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    document.body.style.overflow = "auto";
  };

  const handleLoginSuccess = () => {
    const token = localStorage.getItem('portfolioX_access_token');
    const user = localStorage.getItem('portfolioX_user');
    if (token && user) {
      setIsAuthenticated(true);
      setUserData(JSON.parse(user));
    }
    window.dispatchEvent(new Event('authChange'));
  };

  const handleRegisterSuccess = () => {
    // Rien à faire ici car on switch automatiquement vers login
  };

  // Fonction pour obtenir les initiales
  const getInitials = (user) => {
    if (!user) return 'U';
    
    if (user.nom_complet) {
      const parts = user.nom_complet.split(' ');
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  const getDisplayName = (user) => {
    if (!user) return 'User';
    
    if (user.nom_complet) {
      return user.nom_complet;
    }
    
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'User';
  };

  const getFirstName = (user) => {
    const displayName = getDisplayName(user);
    return displayName.split(' ')[0];
  };

  return (
    <>
      <nav className="flex items-center justify-between py-4 px-6 lg:px-20 bg-white shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center">
              <img 
                src="/logo/logo.png" 
                alt="PortfoliX Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-xl text-gray-800 hover:text-purple-600 transition">
              PortfoliX
            </span>
          </Link>
        </div>

        {/* Navigation centrale */}
        <ul className="hidden md:flex items-center gap-8 text-gray-700">
          <li className="hover:text-purple-600 transition">
            <Link 
              to="/" 
              className="pb-1 border-b-2 border-transparent hover:border-purple-600"
            >
              Home
            </Link>
          </li>
          <li className="hover:text-purple-600 transition">
            <Link 
              to="/models" 
              className="pb-1 border-b-2 border-transparent hover:border-purple-600"
            >
              Models
            </Link>
          </li>
          <li className="hover:text-purple-600 transition">
                <Link 
                  to="/edit" 
                  className="pb-1 border-b-2 border-transparent hover:border-purple-600"
                >
                  Edit
                </Link>
              </li>
          {isAuthenticated && (
            <>
              <li className="hover:text-purple-600 transition">
                <Link 
                  to="/portfolio" 
                  className="pb-1 border-b-2 border-transparent hover:border-purple-600"
                >
                  Create
                </Link>
              </li>
              
            </>
          )}
        </ul>

        {/* Barre de recherche */}
        <div className="hidden lg:block flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search portfolios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
            <span className="absolute top-2.5 left-3 text-gray-400">🔍</span>
            <button 
              type="submit" 
              className="absolute top-2 right-3 text-xs text-purple-600 hover:text-purple-700"
            >
              Search
            </button>
          </form>
        </div>

        {/* Section utilisateur */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Menu déroulant utilisateur */}
              <div className="relative group">
                <button 
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-full px-3 py-1.5 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(userData)}
                  </div>
                  <span className="hidden md:inline text-sm font-medium text-gray-700">
                    {getFirstName(userData)}
                  </span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {/* Menu déroulant */}
                <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-800 text-sm">
                        {getDisplayName(userData)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {userData?.email || 'Email non disponible'}
                      </p>
                    </div>
                    
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span className="mr-3">👤</span>
                      Mon profil
                    </Link>
                    <Link 
                      to="/my-portfolios" 
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span className="mr-3">📂</span>
                      Mes portfolios
                    </Link>
                    <Link 
                      to="/settings" 
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span className="mr-3">⚙️</span>
                      Paramètres
                    </Link>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <span className="mr-3">⏳</span>
                          Déconnexion...
                        </>
                      ) : (
                        <>
                          <span className="mr-3">🚪</span>
                          Déconnexion
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Link 
                to="/portfolio/create" 
                className="lg:hidden px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition text-sm font-medium"
              >
                + Create
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={openLoginModal}
                className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition text-sm font-medium"
              >
                Login
              </button>
              <button 
                onClick={openRegisterModal}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition text-sm font-medium hidden md:block"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Modale d'authentification */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay flouté */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
            onClick={closeAuthModal}
          />
          
          {/* Contenu de la modale */}
          <div className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-in zoom-in duration-200">
            {authMode === "login" ? (
              <LoginModal 
                onSwitchToRegister={() => setAuthMode("register")}
                onClose={closeAuthModal}
                onLoginSuccess={handleLoginSuccess}
              />
            ) : (
              <RegisterModal 
                onSwitchToLogin={() => setAuthMode("login")}
                onClose={closeAuthModal}
                onRegisterSuccess={handleRegisterSuccess}
              />
            )}
            
            {/* Bouton de fermeture */}
            <button
              onClick={closeAuthModal}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-colors z-20"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Styles inline pour les animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-in {
          animation-duration: 200ms;
          animation-timing-function: ease-out;
        }
        
        .fade-in {
          animation-name: fadeIn;
        }
        
        .zoom-in {
          animation-name: zoomIn;
        }
      `}</style>
    </>
  );
};

export default Navbar;