import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Ajouter cette importation

const filters = ["All", "web developer", "web designer", "Graphiste"];

// Configuration API simple
const API_BASE_URL = 'http://localhost:8000'; // À modifier selon votre configuration

// Fonction utilitaire pour les appels API
const fetchApi = async (endpoint, method = 'GET', data = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
  };

  // Ajouter le token JWT s'il existe
  const token = localStorage.getItem('auth_token');
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
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    // Vérifier si la réponse est en JSON
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

// Fonction pour récupérer les contacts d'un utilisateur spécifique
const fetchUserContacts = async (userId) => {
  try {
    // Appel API pour récupérer les contacts de l'utilisateur
    const allContacts = await fetchApi('/api/portfolio/contacts/');
    
    if (Array.isArray(allContacts)) {
      return allContacts.filter(contact => 
        contact.utilisateur?.id_utilisateur === userId || contact.utilisateur_id === userId
      );
    }
    
    return [];
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts:', error);
    return [];
  }
};

// Fonction pour récupérer les détails complets d'un portfolio
const fetchPortfolioDetail = async (portfolioId) => {
  try {
    const portfolio = await fetchApi(`/api/portfolio/portfolios/${portfolioId}/`);
    return portfolio;
  } catch (error) {
    console.error('Erreur lors de la récupération du portfolio:', error);
    return null;
  }
};

// Fonction pour calculer la durée depuis la publication
const getTimeSincePublication = (dateString) => {
  if (!dateString) return "Date inconnue";
  
  const publicationDate = new Date(dateString);
  const now = new Date();
  const diffInMs = now - publicationDate;
  
  // Convertir en secondes
  const diffInSeconds = Math.floor(diffInMs / 1000);
  
  if (diffInSeconds < 60) {
    return `Il y a ${diffInSeconds} seconde${diffInSeconds > 1 ? 's' : ''}`;
  }
  
  // Convertir en minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }
  
  // Convertir en heures
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }
  
  // Convertir en jours
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }
  
  // Convertir en semaines
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;
  }
  
  // Convertir en mois
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `Il y a ${diffInMonths} mois`;
  }
  
  // Convertir en années
  const diffInYears = Math.floor(diffInDays / 365);
  return `Il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`;
};

// Fonction pour formater la date
const formatDate = (dateString) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Composant pour afficher les contacts avec icônes
const ContactIcons = ({ contacts, loading = false }) => {
  if (loading) {
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (!contacts || contacts.length === 0) return null;

  const getIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'email':
        return '✉️';
      case 'linkedin':
        return '💼';
      case 'github':
        return '💻';
      case 'twitter':
        return '🐦';
      case 'instagram':
        return '📸';
      case 'behance':
        return '🎨';
      case 'dribbble':
        return '🏀';
      case 'whatsapp':
        return '📱';
      case 'phone':
        return '📞';
      case 'website':
        return '🌐';
      default:
        return '📌';
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {contacts.slice(0, 3).map((contact, index) => (
        <a
          key={index}
          href={contact.valeur.includes('@') ? `mailto:${contact.valeur}` : 
                 contact.valeur.startsWith('http') ? contact.valeur : `https://${contact.valeur}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-purple-600 transition-colors"
          title={`${contact.type}: ${contact.valeur}`}
        >
          <span className="text-base">{getIcon(contact.type)}</span>
        </a>
      ))}
      {contacts.length > 3 && (
        <span className="text-gray-400 text-xs" title={`${contacts.length - 3} contacts supplémentaires`}>
          +{contacts.length - 3}
        </span>
      )}
    </div>
  );
};

// Composant PortfolioCard séparé - MODIFICATION DU FOND ICI
const PortfolioCard = ({ portfolio, onClick }) => {
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [portfolioDetail, setPortfolioDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Fonction pour générer un gradient de couleur basé sur le titre
  const getAvatarColor = (title) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-blue-500',
      'from-yellow-500 to-orange-500',
      'from-pink-500 to-rose-500'
    ];
    
    if (!title) return colors[0];
    
    // Générer un index basé sur le hash du titre
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Obtenir les initiales du titre
  const getInitials = (title) => {
    if (!title || title.trim() === '') return 'P';
    
    const words = title.split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };

  const avatarColor = getAvatarColor(portfolio.titre);
  const initials = getInitials(portfolio.titre);
  
  // Récupérer les contacts au chargement
  useEffect(() => {
    const loadContacts = async () => {
      if (portfolio.utilisateur?.id_utilisateur) {
        setLoadingContacts(true);
        try {
          const userContacts = await fetchUserContacts(portfolio.utilisateur.id_utilisateur);
          setContacts(userContacts.slice(0, 3));
        } catch (error) {
          console.error('Erreur chargement contacts:', error);
        } finally {
          setLoadingContacts(false);
        }
      }
    };
    
    loadContacts();
  }, [portfolio]);

  // Récupérer les détails du portfolio pour avoir la photo de profil
  useEffect(() => {
    const loadPortfolioDetail = async () => {
      if (portfolio.id && !portfolio.photo_profil) {
        setLoadingDetail(true);
        try {
          const detail = await fetchPortfolioDetail(portfolio.id);
          if (detail) {
            setPortfolioDetail(detail);
          }
        } catch (error) {
          console.error('Erreur chargement détail portfolio:', error);
        } finally {
          setLoadingDetail(false);
        }
      }
    };
    
    loadPortfolioDetail();
  }, [portfolio]);

  // Fonction pour obtenir l'URL complète de la photo de profil
  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    
    // Si c'est déjà une URL complète
    if (photoPath.startsWith('http')) {
      return photoPath;
    }
    
    // Si c'est un chemin relatif
    if (photoPath.startsWith('/')) {
      return `${API_BASE_URL}${photoPath}`;
    }
    
    // Sinon, construire l'URL
    return `${API_BASE_URL}/media/${photoPath}`;
  };

  // Déterminer quelle photo afficher
  const photoToDisplay = portfolioDetail?.photo_profil || portfolio.photo_profil;
  const photoUrl = getPhotoUrl(photoToDisplay);
  
  // Calculer la durée depuis la publication
  const timeSincePublication = getTimeSincePublication(
    portfolio.date_modification || portfolio.date_creation
  );
  
  // Formater la date pour l'affichage détaillé
  const formattedDate = formatDate(portfolio.date_modification || portfolio.date_creation);

  return (
    <div
      onClick={() => onClick(portfolio.id)}
      className="group w-full bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-purple-300 overflow-hidden"
    >
      {/* En-tête avec couleur du thème */}
      <div 
        className="h-2"
        style={{ 
          backgroundColor: portfolio.theme_couleur || '#8b5cf6',
          background: portfolio.theme_couleur ? 
            `linear-gradient(90deg, ${portfolio.theme_couleur}80, ${portfolio.theme_couleur})` : 
            'linear-gradient(90deg, #8b5cf680, #8b5cf6)'
        }}
      ></div>
      
      {/* Contenu principal */}
      <div className="p-5">
        {/* En-tête avec photo de profil PORTFOLIO et titre */}
        <div className="flex items-start gap-4 mb-4">
          {/* Photo de profil PORTFOLIO dans un cercle */}
          <div className="flex-shrink-0">
            <div className="relative">
              {/* Cercle de la photo de profil */}
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
                {photoUrl && !loadingDetail ? (
                  <img 
                    src={photoUrl} 
                    alt={portfolio.titre || "Portfolio"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // En cas d'erreur de chargement de l'image
                      e.target.style.display = 'none';
                      // Remplacer par l'avatar coloré
                      const avatarDiv = document.createElement('div');
                      avatarDiv.className = `w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-r ${avatarColor}`;
                      avatarDiv.innerHTML = `<span class="text-xl">${initials}</span>`;
                      e.target.parentNode.appendChild(avatarDiv);
                    }}
                  />
                ) : loadingDetail ? (
                  // Indicateur de chargement pour la photo
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  // Avatar par défaut avec gradient
                  <div className={`w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-r ${avatarColor}`}>
                    <span className="text-xl">{initials}</span>
                  </div>
                )}
              </div>
              
              {/* Badge de statut */}
              <div className="absolute -bottom-1 -right-1">
                <span className={`px-2 py-1 text-xs rounded-full font-medium border-2 border-white shadow-sm
                  ${portfolio.statut === 'publie' ? 'bg-green-500 text-white' :
                    portfolio.statut === 'brouillon' ? 'bg-yellow-500 text-white' :
                    'bg-blue-500 text-white'}`}
                >
                  {portfolio.statut === 'publie' ? '✓' : '✎'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Titre et informations du PORTFOLIO */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-600 transition line-clamp-1">
                  {portfolio.titre || "Portfolio sans titre"}
                </h3>
                <p className="text-sm text-purple-600 font-medium mt-1 truncate">
                  {portfolio.utilisateur?.nom_complet || "Utilisateur"}
                </p>
              </div>
              
              {/* Indicateur de durée depuis la publication */}
              <div className="text-right ml-2">
                <span 
                  className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full"
                  title={`Publié le ${formattedDate}`}
                >
                  <span className="text-gray-500">🕐</span>
                  <span>{timeSincePublication}</span>
                </span>
              </div>
            </div>
            
            {/* Afficher la profession si disponible */}
            {(portfolio.titre_professionnel || portfolioDetail?.titre_professionnel) && (
              <p className="text-xs text-gray-600 mt-1">
                {portfolioDetail?.titre_professionnel || portfolio.titre_professionnel}
              </p>
            )}
            
            {/* Contacts du PORTFOLIO - Contacts réels de l'utilisateur */}
            <div className="mt-2">
              <ContactIcons contacts={contacts} loading={loadingContacts} />
            </div>
          </div>
        </div>
        
        {/* Description du PORTFOLIO */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
          {portfolioDetail?.description || portfolioDetail?.biographie || 
           portfolio.description || portfolio.biographie || 
           "Aucune description disponible pour ce portfolio."}
        </p>
        
        {/* Métriques du PORTFOLIO */}
        <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-200 pt-3">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded" title="Compétences">
              <span className="text-gray-700">🛠️</span>
              <span className="text-gray-700">{portfolio.nombre_competences || portfolio.competences_ids?.length || 0}</span>
            </span>
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded" title="Projets">
              <span className="text-gray-700">🚀</span>
              <span className="text-gray-700">{portfolio.nombre_projets || portfolio.projets_ids?.length || 0}</span>
            </span>
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded" title="Contacts">
              <span className="text-gray-700">📞</span>
              <span className="text-gray-700">{portfolio.nombre_contacts || contacts.length}</span>
            </span>
            {portfolio.vue_count !== undefined && (
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded" title="Vues">
                <span className="text-gray-700">👁️</span>
                <span className="text-gray-700">{portfolio.vue_count}</span>
              </span>
            )}
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClick(portfolio.id);
            }}
            className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded transition-colors border border-purple-200"
          >
            Voir
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Public = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate(); // Ajouter useNavigate

  // Récupérer les portfolios publiés au chargement
  useEffect(() => {
    fetchPublishedPortfolios();
  }, []);

  const fetchPublishedPortfolios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Appel à l'endpoint des portfolios
      const data = await fetchApi('/api/portfolio/portfolios/');
      
      let portfolioList = [];
      
      // S'adapter à la structure de votre API
      if (data && data.results) {
        portfolioList = data.results;
      } else if (Array.isArray(data)) {
        portfolioList = data;
      }

      // Filtrer pour n'afficher que les portfolios publiés
      const publishedPortfolios = portfolioList.filter(portfolio => 
        portfolio.statut === 'publie' || portfolio.is_published === true
      );

      // Récupérer les détails complets de chaque portfolio pour avoir les photos de profil
      const portfoliosWithDetails = await Promise.all(
        publishedPortfolios.map(async (portfolio) => {
          try {
            // Récupérer les détails complets du portfolio
            const portfolioDetail = await fetchApi(`/api/portfolio/portfolios/${portfolio.id_portfolio}/`);
            
            return {
              id: portfolio.id_portfolio, // Renommer id_portfolio en id
              titre: portfolio.titre,
              description: portfolioDetail?.description || portfolioDetail?.biographie || portfolio.titre || "Description non disponible",
              titre_professionnel: portfolioDetail?.titre_professionnel || portfolio.utilisateur?.nom_complet || "Utilisateur",
              slug: portfolio.slug,
              statut: portfolio.statut,
              date_creation: portfolio.date_creation,
              date_modification: portfolio.date_modification,
              vue_count: portfolio.vue_count,
              utilisateur: portfolio.utilisateur,
              
              // Photo de profil depuis les détails
              photo_profil: portfolioDetail?.photo_profil || null,
              
              // Mapper les compteurs
              nombre_contacts: portfolio.nombre_contacts || 0,
              nombre_competences: portfolio.nombre_competences || 0,
              nombre_projets: portfolio.nombre_projets || 0,
              
              // Champs optionnels depuis les détails
              theme_couleur: portfolioDetail?.theme_couleur || "#8b5cf6",
              layout_type: portfolioDetail?.layout_type || "standard",
              biographie: portfolioDetail?.biographie,
              
              // Calculer la durée depuis la publication
              time_since_publication: getTimeSincePublication(portfolio.date_modification || portfolio.date_creation),
              formatted_date: formatDate(portfolio.date_modification || portfolio.date_creation),
              
              // Tableaux vides (seront remplis lors du détail ou par fetchUserContacts)
              formations: [],
              experiences: [],
              langues: [],
              certifications: [],
              interets: [],
              contacts_ids: [],
              competences_ids: [],
              projets_ids: []
            };
          } catch (detailError) {
            console.error(`Erreur détail portfolio ${portfolio.id_portfolio}:`, detailError);
            // Retourner une version basique si erreur
            return {
              id: portfolio.id_portfolio,
              titre: portfolio.titre,
              description: portfolio.titre || "Description non disponible",
              titre_professionnel: portfolio.utilisateur?.nom_complet || "Utilisateur",
              slug: portfolio.slug,
              statut: portfolio.statut,
              date_creation: portfolio.date_creation,
              date_modification: portfolio.date_modification,
              vue_count: portfolio.vue_count,
              utilisateur: portfolio.utilisateur,
              photo_profil: null,
              nombre_contacts: portfolio.nombre_contacts || 0,
              nombre_competences: portfolio.nombre_competences || 0,
              nombre_projets: portfolio.nombre_projets || 0,
              theme_couleur: "#8b5cf6",
              layout_type: "standard",
              time_since_publication: getTimeSincePublication(portfolio.date_modification || portfolio.date_creation),
              formatted_date: formatDate(portfolio.date_modification || portfolio.date_creation),
              formations: [],
              experiences: [],
              langues: [],
              certifications: [],
              interets: [],
              contacts_ids: [],
              competences_ids: [],
              projets_ids: []
            };
          }
        })
      );

      // Trier par date de modification (du plus récent au plus ancien)
      portfoliosWithDetails.sort((a, b) => {
        const dateA = new Date(a.date_modification || a.date_creation);
        const dateB = new Date(b.date_modification || b.date_creation);
        return dateB - dateA;
      });

      setPortfolios(portfoliosWithDetails);
      
    } catch (err) {
      setError("Impossible de charger les portfolios. Vérifiez votre connexion.");
      console.error("Erreur:", err);
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  };

  // Recherche de portfolios
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      fetchPublishedPortfolios();
      return;
    }

    try {
      setLoading(true);
      
      // Essayer l'endpoint de recherche si disponible
      let searchResults = [];
      try {
        const data = await fetchApi(`/api/portfolio/portfolios/search/?q=${encodeURIComponent(searchTerm)}`);
        
        if (data && data.results) {
          searchResults = data.results;
        } else if (Array.isArray(data)) {
          searchResults = data;
        }
      } catch (searchErr) {
        console.log("Recherche API non disponible, filtrage local");
        // Fallback: Filtrer localement
        searchResults = portfolios.filter(portfolio => 
          portfolio.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          portfolio.utilisateur?.nom_complet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          portfolio.titre_professionnel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          portfolio.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setPortfolios(searchResults);
      
    } catch (err) {
      setError("Erreur lors de la recherche");
      console.error("Erreur recherche:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les portfolios localement par catégorie
  const getFilteredPortfolios = () => {
    if (activeFilter === "All") {
      return portfolios;
    }
    
    return portfolios.filter(portfolio => {
      const profession = portfolio.titre_professionnel?.toLowerCase() || '';
      const description = portfolio.description?.toLowerCase() || '';
      const titre = portfolio.titre?.toLowerCase() || '';
      const nomComplet = portfolio.utilisateur?.nom_complet?.toLowerCase() || '';
      
      const filter = activeFilter.toLowerCase();
      
      return profession.includes(filter) || 
             description.includes(filter) || 
             titre.includes(filter) ||
             nomComplet.includes(filter);
    });
  };

  const filteredPortfolios = getFilteredPortfolios();

  // Rediriger vers le détail d'un portfolio
const viewPortfolioDetail = (portfolioId) => {
  navigate(`/portfolioDetail/${portfolioId}`);
};
  // Créer un portfolio vide
  const createBlankPortfolio = () => {
    navigate('/portfolio/'); // Rediriger vers la page de création
  };

  return (
    <div className="min-h-screen bg-white px-6 py-10">
      {/* Header */}
      <header className="flex justify-between items-center px-4 mb-10">
        <img src="/logo/logo.png" alt="logo" className="w-12" />
        
        {/* Photo utilisateur simplifiée */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-90 transition">
          <span className="text-lg">👤</span>
        </div>
      </header>
         
      {/* Titre */}
      <h1 className="text-center text-3xl md:text-4xl font-bold text-purple-600 mb-10">
        The easiest way to create your portfolio
      </h1>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex justify-center mb-6">
        <div className="w-full max-w-2xl relative">
          <input
            type="text"
            placeholder="Rechercher un portfolio (par nom, compétence, description)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-400 rounded-md py-2 px-4 focus:outline-none focus:border-purple-500 transition text-sm md:text-base pr-12"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 transition"
            aria-label="Rechercher"
          >
            🔍
          </button>
        </div>
      </form>

      {/* Filtres */}
      <div className="flex justify-center gap-4 flex-wrap mb-10">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2 rounded-md border text-sm font-medium transition duration-200
              ${activeFilter === filter
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-600"
                : "border-purple-400 text-purple-600 bg-white hover:bg-purple-50"
              }`}
          >
            {filter}
          </button>
        ))}
        
        {/* Bouton pour créer un portfolio */}
        <button
          onClick={createBlankPortfolio}
          className="px-6 py-2 rounded-md bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium border border-green-500 hover:shadow-md transition duration-200"
        >
          + Créer
        </button>
      </div>

      {/* États de chargement et erreur */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600"></div>
          <p className="mt-3 text-gray-600">Chargement des portfolios...</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-12 bg-red-50 rounded-xl max-w-lg mx-auto">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={fetchPublishedPortfolios}
            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Grille de portfolios */}
      {!loading && !error && (
        <>
          {filteredPortfolios.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl mx-4">
              <div className="text-gray-400 text-4xl mb-3">📭</div>
              <p className="text-gray-600 text-lg mb-4">
                {searchTerm 
                  ? `Aucun résultat pour "${searchTerm}"`
                  : "Aucun portfolio publié pour le moment"}
              </p>
              <button
                onClick={createBlankPortfolio}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                Créer le premier portfolio
              </button>
            </div>
          ) : (
            <>
              {/* Compteur de résultats */}
              <div className="text-center mb-6 px-4">
                <p className="text-gray-600 inline-block px-4 py-2 bg-gray-100 rounded-full">
                  {filteredPortfolios.length} portfolio{filteredPortfolios.length > 1 ? 's' : ''} 
                  {searchTerm && ` pour "${searchTerm}"`}
                  {activeFilter !== "All" && ` en "${activeFilter}"`}
                </p>
              </div>
              
              {/* Grille - Disposition du deuxième code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-20">
                {filteredPortfolios.map((portfolio) => (
                  <PortfolioCard 
                    key={portfolio.id}
                    portfolio={portfolio}
                    onClick={viewPortfolioDetail}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Pied de page */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center px-4">
        <p className="text-gray-500 text-sm">
          {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''} disponible{portfolios.length !== 1 ? 's' : ''} au total
          {searchTerm && ` • Recherche: "${searchTerm}"`}
        </p>
        <div className="flex justify-center items-center gap-4 mt-2">
          <p className="text-gray-400 text-xs">
            Connecté à l'API PortfolioX • {filteredPortfolios.length} portfolio{filteredPortfolios.length !== 1 ? 's' : ''} actuellement visible{filteredPortfolios.length !== 1 ? 's' : ''}
          </p>
          <span className="text-gray-400 text-xs flex items-center gap-1">
            <span>🕐</span>
            <span>Temps depuis publication</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Public;