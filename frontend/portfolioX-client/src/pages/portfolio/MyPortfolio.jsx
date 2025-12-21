import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = 'http://localhost:8000';

// Fonction utilitaire pour les appels API avec token
const fetchApi = async (endpoint, method = 'GET', data = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
  };

  // Récupérer le token depuis localStorage
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erreur HTTP: ${response.status}`);
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

const MyPortfolio = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState({
    total_portfolios: 0,
    published_portfolios: 0,
    total_views: 0,
    total_projects: 0
  });
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est connecté
  const isAuthenticated = () => {
    const token = localStorage.getItem('portfolioX_access_token');
    return !!token;
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    loadUserData();
    loadPortfolios();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await fetchApi('/api/auth/profil/');
      setUserInfo(userData);
    } catch (err) {
      console.error('Erreur chargement profil:', err);
    }
  };

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les portfolios de l'utilisateur
      const data = await fetchApi('/api/portfolio/portfolios/my_portfolio/');
      
      // Si l'API retourne un seul portfolio (pas un tableau)
      let portfolioArray = [];
      
      if (Array.isArray(data)) {
        portfolioArray = data;
      } else if (data && data.id_portfolio) {
        // Si c'est un objet unique (un seul portfolio)
        portfolioArray = [data];
      } else if (data && data.results) {
        // Si c'est une réponse paginée
        portfolioArray = data.results;
      }

      // Transformer les données pour l'affichage
      const portfoliosWithDetails = portfolioArray.map(portfolio => {
        // Compter les éléments
        const contactCount = portfolio.contacts?.length || 0;
        const competenceCount = portfolio.competences?.length || 0;
        const projetCount = portfolio.projets?.length || 0;
        
        return {
          id: portfolio.id_portfolio,
          titre: portfolio.titre || "Sans titre",
          description: portfolio.description || portfolio.biographie || "",
          titre_professionnel: portfolio.titre_professionnel || "",
          statut: portfolio.statut || "brouillon",
          date_creation: portfolio.date_creation,
          date_modification: portfolio.date_modification || portfolio.date_creation,
          vue_count: portfolio.vue_count || 0,
          photo_profil: portfolio.photo_profil,
          theme_couleur: portfolio.theme_couleur || "#8b5cf6",
          is_published: portfolio.statut === 'publie',
          
          // Compter les éléments
          nombre_contacts: contactCount,
          nombre_competences: competenceCount,
          nombre_projets: projetCount,
          
          // Statut du portfolio
          statut_badge: portfolio.statut === 'publie' ? {
            label: 'Publié',
            color: 'bg-green-100 text-green-800 border-green-300'
          } : portfolio.statut === 'archive' ? {
            label: 'Archivé',
            color: 'bg-gray-100 text-gray-800 border-gray-300'
          } : {
            label: 'Brouillon',
            color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
          },
          
          // Données brutes
          rawData: portfolio
        };
      });

      // Calculer les statistiques
      const totalPortfolios = portfoliosWithDetails.length;
      const publishedPortfolios = portfoliosWithDetails.filter(p => p.is_published).length;
      const totalViews = portfoliosWithDetails.reduce((acc, p) => acc + (p.vue_count || 0), 0);
      const totalProjects = portfoliosWithDetails.reduce((acc, p) => acc + (p.nombre_projets || 0), 0);

      setStats({
        total_portfolios: totalPortfolios,
        published_portfolios: publishedPortfolios,
        total_views: totalViews,
        total_projects: totalProjects
      });

      // Trier par date de modification (plus récent en premier)
      portfoliosWithDetails.sort((a, b) => {
        const dateA = new Date(a.date_modification || a.date_creation);
        const dateB = new Date(b.date_modification || b.date_creation);
        return dateB.getTime() - dateA.getTime();
      });
      
      setPortfolios(portfoliosWithDetails);
      
    } catch (err) {
      if (err.message.includes('404')) {
        setError("Vous n'avez pas encore de portfolio. Créez-en un pour commencer !");
        setPortfolios([]);
      } else {
        setError("Impossible de charger vos portfolios. Veuillez vérifier votre connexion.");
        console.error('Erreur:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublishPortfolio = async (portfolioId) => {
    try {
      await fetchApi(`/api/portfolio/portfolios/${portfolioId}/publish/`, 'POST', {
        statut: 'publie'
      });
      
      // Recharger la liste
      loadPortfolios();
    } catch (err) {
      alert('Erreur lors de la publication du portfolio');
      console.error('Erreur publication:', err);
    }
  };

  const handleUnpublishPortfolio = async (portfolioId) => {
    try {
      await fetchApi(`/api/portfolio/portfolios/${portfolioId}/`, 'PATCH', {
        statut: 'brouillon'
      });
      
      // Recharger la liste
      loadPortfolios();
    } catch (err) {
      alert('Erreur lors du retrait du portfolio');
      console.error('Erreur retrait:', err);
    }
  };

  const handleDeletePortfolio = async (portfolioId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce portfolio ? Cette action est irréversible.')) {
      return;
    }

    try {
      await fetchApi(`/api/portfolio/portfolios/${portfolioId}/`, 'DELETE');
      
      // Retirer du state local
      setPortfolios(portfolios.filter(p => p.id !== portfolioId));
      // Recalculer les stats
      setStats(prev => ({
        ...prev,
        total_portfolios: prev.total_portfolios - 1
      }));
    } catch (err) {
      alert('Erreur lors de la suppression du portfolio');
      console.error('Erreur suppression:', err);
    }
  };

  const handleDuplicatePortfolio = async (portfolioId) => {
    try {
      await fetchApi(`/api/portfolio/portfolios/${portfolioId}/duplicate/`, 'POST');
      
      // Recharger la liste
      loadPortfolios();
    } catch (err) {
      alert('Erreur lors de la duplication du portfolio');
      console.error('Erreur duplication:', err);
    }
  };

  const handleCreateNewPortfolio = () => {
    navigate('/portfolio');
  };

  const handleEditPortfolio = (portfolioId) => {
    navigate(`/portfolio/edit/${portfolioId}`);
  };

  const handleViewPortfolio = (portfolioId) => {
    navigate(`/portfolio/${portfolioId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('portfolioX_access_token');
    localStorage.removeItem('portfolioX_refresh_token');
    localStorage.removeItem('portfolioX_user');
    navigate('/login');
  };

  // Fonction pour obtenir l'URL complète d'une image
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return `${API_BASE_URL}${imagePath}`;
    return `${API_BASE_URL}/media/${imagePath}`;
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img src="/logo/logo.png" alt="logo" className="w-10 h-10" />
              <h1 className="text-2xl font-bold text-gray-900">Mes Portfolios</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-purple-600 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white">
                  {userInfo?.nom_complet?.charAt(0) || userInfo?.username?.charAt(0) || 'U'}
                </div>
                <span className="font-medium">
                  {userInfo?.nom_complet || userInfo?.username || 'Utilisateur'}
                </span>
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-600 hover:text-red-700 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Section d'en-tête */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bienvenue dans votre espace
              </h2>
              <p className="text-gray-600">
                Gérez tous vos portfolios depuis un seul endroit
              </p>
            </div>
            
            <button
              onClick={handleCreateNewPortfolio}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:shadow-lg transition-shadow flex items-center gap-2"
            >
              <span>+</span>
              <span>Nouveau Portfolio</span>
            </button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">{stats.total_portfolios}</div>
              <div className="text-gray-600">Portfolios</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.published_portfolios}
              </div>
              <div className="text-gray-600">Publiés</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.total_views}
              </div>
              <div className="text-gray-600">Vues totales</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.total_projects}
              </div>
              <div className="text-gray-600">Projets total</div>
            </div>
          </div>
        </div>

        {/* Liste des portfolios */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          {/* En-tête du tableau */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
              <div className="col-span-5">Portfolio</div>
              <div className="col-span-2">Statut</div>
              <div className="col-span-2">Dernière modification</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600"></div>
              <p className="mt-3 text-gray-600">Chargement de vos portfolios...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-red-500 text-4xl mb-3">⚠️</div>
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <button
                onClick={loadPortfolios}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Réessayer
              </button>
            </div>
          ) : portfolios.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-5xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Aucun portfolio</h3>
              <p className="text-gray-600 mb-6">Commencez par créer votre premier portfolio</p>
              <button
                onClick={handleCreateNewPortfolio}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:shadow-lg transition-shadow"
              >
                Créer mon premier portfolio
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {portfolios.map((portfolio) => (
                <div key={portfolio.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Nom et description */}
                    <div className="col-span-5">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {portfolio.photo_profil ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                              <img
                                src={getImageUrl(portfolio.photo_profil)}
                                alt={portfolio.titre}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `
                                    <div 
                                      class="w-full h-full flex items-center justify-center text-white font-bold"
                                      style="background-color: ${portfolio.theme_couleur}"
                                    >
                                      <span class="text-lg">${portfolio.titre?.charAt(0) || 'P'}</span>
                                    </div>
                                  `;
                                }}
                              />
                            </div>
                          ) : (
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: portfolio.theme_couleur }}
                            >
                              {portfolio.titre?.charAt(0) || 'P'}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">
                            {portfolio.titre}
                          </h4>
                          {portfolio.titre_professionnel && (
                            <p className="text-sm text-gray-600 mb-1">
                              {portfolio.titre_professionnel}
                            </p>
                          )}
                          {portfolio.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {portfolio.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {portfolio.nombre_competences > 0 && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <span>🛠️</span>
                                <span>{portfolio.nombre_competences}</span>
                              </span>
                            )}
                            {portfolio.nombre_projets > 0 && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <span>🚀</span>
                                <span>{portfolio.nombre_projets}</span>
                              </span>
                            )}
                            {portfolio.nombre_contacts > 0 && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <span>📞</span>
                                <span>{portfolio.nombre_contacts}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statut */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${portfolio.statut_badge.color}`}>
                        {portfolio.statut_badge.label}
                      </span>
                      {portfolio.vue_count > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {portfolio.vue_count} vue{portfolio.vue_count > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {/* Date de modification */}
                    <div className="col-span-2">
                      <div className="text-sm text-gray-900">
                        {formatDate(portfolio.date_modification)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {portfolio.date_modification ? formatDateTime(portfolio.date_modification).split(' ')[1] : ''}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleViewPortfolio(portfolio.id)}
                          className="px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Voir"
                        >
                          👁️ Voir
                        </button>
                        
                        <button
                          onClick={() => handleEditPortfolio(portfolio.id)}
                          className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          ✏️ Éditer
                        </button>
                        
                        {portfolio.is_published ? (
                          <button
                            onClick={() => handleUnpublishPortfolio(portfolio.id)}
                            className="px-3 py-1.5 text-sm text-yellow-600 hover:text-yellow-700 font-medium bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                            title="Dépublier"
                          >
                            📤 Masquer
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublishPortfolio(portfolio.id)}
                            className="px-3 py-1.5 text-sm text-green-600 hover:text-green-700 font-medium bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                            title="Publier"
                          >
                            📢 Publier
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDuplicatePortfolio(portfolio.id)}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 font-medium bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Dupliquer"
                        >
                          📋 Copier
                        </button>
                        
                        <button
                          onClick={() => handleDeletePortfolio(portfolio.id)}
                          className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guide rapide */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="text-2xl mb-3">📝</div>
            <h4 className="font-bold text-gray-900 mb-2">Création</h4>
            <p className="text-sm text-gray-600">
              Créez un nouveau portfolio personnalisé avec vos projets, compétences et expériences.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="text-2xl mb-3">🚀</div>
            <h4 className="font-bold text-gray-900 mb-2">Publication</h4>
            <p className="text-sm text-gray-600">
              Publiez votre portfolio pour le rendre visible publiquement et partagez-le avec votre réseau.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="text-2xl mb-3">📊</div>
            <h4 className="font-bold text-gray-900 mb-2">Statistiques</h4>
            <p className="text-sm text-gray-600">
              Suivez les performances de vos portfolios avec des statistiques détaillées sur les vues.
            </p>
          </div>
        </div>

        {/* Détails des portfolios */}
        {portfolios.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Détails de vos portfolios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolios.map((portfolio) => (
                <div key={portfolio.id} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                  {/* Bande de couleur */}
                  {portfolio.theme_couleur && (
                    <div 
                      className="h-2"
                      style={{ backgroundColor: portfolio.theme_couleur }}
                    ></div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {portfolio.photo_profil ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden">
                          <img
                            src={getImageUrl(portfolio.photo_profil)}
                            alt={portfolio.titre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: portfolio.theme_couleur }}
                        >
                          {portfolio.titre?.charAt(0) || 'P'}
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900">{portfolio.titre}</h4>
                        <p className="text-sm text-purple-600">{portfolio.titre_professionnel}</p>
                        <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${portfolio.statut_badge.color}`}>
                          {portfolio.statut_badge.label}
                        </span>
                      </div>
                    </div>
                    
                    {portfolio.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {portfolio.description}
                      </p>
                    )}
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-purple-600">{portfolio.nombre_competences}</div>
                          <div className="text-xs text-gray-500">Compétences</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">{portfolio.nombre_projets}</div>
                          <div className="text-xs text-gray-500">Projets</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">{portfolio.nombre_contacts}</div>
                          <div className="text-xs text-gray-500">Contacts</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                      <span>Couleur: <span className="font-medium">{portfolio.theme_couleur}</span></span>
                      <span>Créé: {formatDate(portfolio.date_creation)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="inline-flex items-center"Z>
              <img src="/logo/logo.png" alt="logo" className="w-8 h-8 inline mr-2" />
              <span className="text-gray-600">PortfolioX © {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MyPortfolio;