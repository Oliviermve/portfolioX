import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
  });
  const [stats, setStats] = useState({
    portfolios: 0,
    projects: 0,
    skills: 0,
    contacts: 0,
  });
  
  const navigate = useNavigate();
  const API_BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("portfolioX_access_token");
    
    if (!token) {
      setError("Vous devez être connecté pour voir votre profil");
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log("🔍 Récupération du profil...");
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profil/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Réponse profil - Status:", response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Données API COMPLÈTES:", data);
      
      // CORRECTION IMPORTANTE : Les données utilisateur sont dans data.user
      const userData = data.user || data;
      console.log("👤 Données utilisateur extraites:", userData);
      
      // Afficher toutes les clés pour debug
      console.log("🔑 Clés disponibles dans userData:");
      Object.keys(userData).forEach(key => {
        console.log(`  ${key}:`, userData[key]);
      });

      // Stocker les données brutes
      setUser(userData);
      
      // Extraire les informations avec différents formats possibles
      const userInfo = {
        id: userData.id_utilisateur || userData.id || userData.user_id,
        nom: userData.nom || userData.last_name || userData.nom_famille || '',
        prenom: userData.prenom || userData.first_name || userData.prenom_utilisateur || '',
        email: userData.email || userData.courriel || '',
        username: userData.username || userData.nom_utilisateur || '',
        nom_complet: userData.nom_complet || `${userData.prenom || ''} ${userData.nom || ''}`.trim() || userData.username || 'Utilisateur',
        date_inscription: userData.date_inscription || userData.date_joined || userData.created_at,
        derniere_connexion: userData.derniere_connexion || userData.last_login,
        is_active: userData.is_active !== false,
        is_staff: userData.is_staff || false,
        is_admin: userData.is_admin || userData.is_superuser || false,
        is_administrateur: userData.is_administrateur || false,
        // Données supplémentaires
        telephone: userData.telephone || userData.phone || '',
        adresse: userData.adresse || userData.address || '',
        ville: userData.ville || userData.city || '',
        pays: userData.pays || userData.country || '',
        bio: userData.bio || userData.biographie || '',
        site_web: userData.site_web || userData.website || '',
        github: userData.github || '',
        linkedin: userData.linkedin || '',
        twitter: userData.twitter || '',
      };

      console.log("👤 Informations utilisateur structurées:", userInfo);
      
      setFormData({
        nom: userInfo.nom,
        prenom: userInfo.prenom,
        email: userInfo.email,
      });

      // Récupérer les statistiques depuis les portfolios
      try {
        const portfoliosResponse = await fetch(`${API_BASE_URL}/api/portfolio/portfolios/my_portfolio/`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (portfoliosResponse.ok) {
          const portfoliosData = await portfoliosResponse.json();
          console.log("📊 Données portfolios pour stats:", portfoliosData);
          
          // Si c'est un tableau de portfolios
          let portfolioArray = [];
          if (Array.isArray(portfoliosData)) {
            portfolioArray = portfoliosData;
          } else if (portfoliosData && portfoliosData.id_portfolio) {
            portfolioArray = [portfoliosData];
          } else if (portfoliosData && portfoliosData.user) {
            // Si la réponse contient un seul portfolio dans user
            portfolioArray = [portfoliosData];
          }
          
          // Calculer les statistiques
          const calculatedStats = {
            portfolios: portfolioArray.length,
            projects: portfolioArray.reduce((acc, p) => acc + (p.projets?.length || 0), 0),
            skills: portfolioArray.reduce((acc, p) => acc + (p.competences?.length || 0), 0),
            contacts: portfolioArray.reduce((acc, p) => acc + (p.contacts?.length || 0), 0),
          };
          
          setStats(calculatedStats);
          console.log("📈 Statistiques calculées:", calculatedStats);
        }
      } catch (statsError) {
        console.log("ℹ️ Statistiques non disponibles:", statsError.message);
      }

      // Mettre à jour le localStorage
      localStorage.setItem("portfolioX_user", JSON.stringify(userInfo));
      
    } catch (err) {
      console.error("❌ Erreur:", err);
      setError(err.message);
      
      if (err.message.includes("Session expirée") || err.message.includes("401")) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem("portfolioX_access_token");
    
    if (!token) {
      setError("Vous devez être connecté");
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      console.log("✏️ Mise à jour du profil avec:", formData);
      
      // CORRECTION : Utiliser la bonne structure pour l'API
      const updateData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        // Inclure aussi le nom d'utilisateur si nécessaire
        username: user?.username || formData.email.split('@')[0],
      };
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profil/modifier/`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      console.log("📡 Réponse mise à jour:", data);

      if (!response.ok) {
        let errorMessage = "Erreur lors de la mise à jour";
        
        if (typeof data === 'object') {
          const errors = [];
          for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
              errors.push(`${key}: ${value.join(', ')}`);
            } else if (typeof value === 'string') {
              errors.push(`${key}: ${value}`);
            }
          }
          if (errors.length > 0) {
            errorMessage = errors.join(' | ');
          }
        } else if (data.detail) {
          errorMessage = data.detail;
        }
        
        throw new Error(errorMessage);
      }

      // CORRECTION : Mettre à jour avec la réponse de l'API
      const updatedUserData = data.user || data;
      setUser(updatedUserData);
      
      // Rafraîchir les données
      await fetchProfile();
      setIsEditing(false);
      
      alert("✅ Profil mis à jour avec succès !");
      
    } catch (err) {
      console.error("❌ Erreur mise à jour:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const currentPassword = prompt("Entrez votre mot de passe actuel:");
    if (!currentPassword) return;
    
    const newPassword = prompt("Entrez votre nouveau mot de passe (minimum 8 caractères):");
    if (!newPassword) return;
    
    if (newPassword.length < 8) {
      alert("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    
    const confirmPassword = prompt("Confirmez votre nouveau mot de passe:");
    if (!confirmPassword) return;
    
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    const token = localStorage.getItem("portfolioX_access_token");
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/changer-mot-de-passe/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword,
          new_password2: confirmPassword,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("✅ Mot de passe changé avec succès !");
      } else {
        throw new Error(data.detail || data.error || "Échec du changement de mot de passe");
      }
    } catch (err) {
      alert(`❌ Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!confirm("Voulez-vous exporter vos données personnelles ? Cette opération peut prendre quelques instants.")) return;
    
    const token = localStorage.getItem("portfolioX_access_token");
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profil/export/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolioX-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert("✅ Données exportées avec succès !");
      } else {
        throw new Error("Erreur lors de l'export des données");
      }
    } catch (err) {
      alert(`❌ Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non disponible";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getInitials = () => {
    if (!user) return "U";
    const prenom = formData.prenom || user.prenom || '';
    const nom = formData.nom || user.nom || '';
    
    if (prenom && nom) {
      return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
          <p className="text-sm text-gray-500 mt-2">Récupération de vos informations</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6">
          <img src="/logo/logo.png" alt="logo" className="w-20" />
        </div>
        <h1 className="text-3xl font-bold text-black mb-4">Accès refusé</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mb-6">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600 text-sm">
            Votre session a peut-être expiré ou vous n'êtes pas autorisé à accéder à cette page.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/login')}
            className="bg-purple-500 text-white py-2 px-6 rounded-lg font-medium hover:bg-purple-600 transition"
          >
            Se connecter
          </button>
          <button
            onClick={fetchProfile}
            className="border border-gray-300 text-gray-700 py-2 px-6 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // CORRECTION : Utiliser user?.email au lieu de formData.email dans l'affichage
  const displayEmail = user?.email || formData.email;
  const displayName = formData.prenom && formData.nom 
    ? `${formData.prenom} ${formData.nom}`
    : user?.nom_complet || user?.username || 'Utilisateur';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      
      <div></div>
      <div className="max-w-6xl mx-auto">
        
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
              <p className="text-gray-600 mt-2">
                Gérez vos informations personnelles et vos préférences
              </p>
            </div>
            <button
              onClick={() => navigate('/Models')}
              className="px-5 py-2.5 text-purple-600 hover:text-purple-700 font-medium border border-purple-200 rounded-lg hover:bg-purple-50 transition"
            >
              ← Retour aux portfolios
            </button>
          </div>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Bande de couleur en haut */}
          <div className="h-3 bg-gradient-to-r from-purple-600 to-purple-800"></div>
          
          <div className="p-8">
            {/* Section photo et infos de base */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-10">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-600 text-5xl font-bold border-4 border-white shadow-lg">
                  {getInitials()}
                </div>
                <button
                  onClick={handleEditToggle}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 transition"
                  title="Modifier le profil"
                >
                  ✏️
                </button>
              </div>
              
              {/* Informations */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4 max-w-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prénom
                        </label>
                        <input
                          type="text"
                          name="prenom"
                          value={formData.prenom}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                          placeholder="Votre prénom"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom
                        </label>
                        <input
                          type="text"
                          name="nom"
                          value={formData.nom}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                          placeholder="Votre nom"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="votre@email.com"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleUpdateProfile}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-lg transition font-medium"
                        disabled={loading}
                      >
                        {loading ? 'Enregistrement...' : '💾 Enregistrer'}
                      </button>
                      <button
                        onClick={handleEditToggle}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {displayName}
                    </h2>
                    <p className="text-gray-600 mb-4">{displayEmail}</p>
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ● Compte actif
                      </span>
                      {user?.is_admin && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          👑 Administrateur
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleEditToggle}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      ✏️ Modifier le profil
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Statistiques */}
            <div className="mb-10">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Votre activité</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{stats.portfolios}</div>
                  <div className="text-gray-700 font-medium">Portfolios</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{stats.projects}</div>
                  <div className="text-gray-700 font-medium">Projets</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{stats.skills}</div>
                  <div className="text-gray-700 font-medium">Compétences</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200 text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.contacts}</div>
                  <div className="text-gray-700 font-medium">Contacts</div>
                </div>
              </div>
            </div>
            
            {/* Informations détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du compte</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">ID Utilisateur</p>
                    <p className="font-medium text-gray-900">{user?.id || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">Nom d'utilisateur</p>
                    <p className="font-medium text-gray-900">{user?.username || displayName || 'Non défini'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">Email</p>
                    <p className="font-medium text-gray-900">{displayEmail}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">Date d'inscription</p>
                    <p className="font-medium text-gray-900">{formatDate(user?.date_inscription)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm mb-1">Dernière connexion</p>
                    <p className="font-medium text-gray-900">{formatDate(user?.derniere_connexion)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut du compte</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Compte actif</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user?.is_active ? 'Oui' : 'Non'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Membre staff</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${user?.is_staff ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user?.is_staff ? 'Oui' : 'Non'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Administrateur</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${user?.is_admin ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user?.is_admin ? 'Oui' : 'Non'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleChangePassword}
                  className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition"
                >
                  🔑 Changer le mot de passe
                </button>
                
                <button
                  onClick={handleExportData}
                  className="inline-flex items-center px-5 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
                >
                  📥 Exporter mes données
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center px-5 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
                >
                  home
                </button>
                
                <button
                  onClick={() => navigate('/models')}
                  className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 transition"
                >
                  Models
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;