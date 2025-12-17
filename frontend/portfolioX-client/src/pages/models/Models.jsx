import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../home/blocks/Footer";

// Filtres communs
const filters = ["All", "web developer", "web designer", "Graphiste"];

// Configuration API
const API_BASE_URL = 'http://localhost:8000';

// Fonction utilitaire pour les appels API
const fetchApi = async (endpoint, method = 'GET', data = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
  };

  // Ajouter le token JWT s'il existe
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
      throw new Error(`Erreur HTTP: ${response.status}`);
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

// Fonction pour calculer la durée depuis la publication
const getTimeSincePublication = (dateString) => {
  if (!dateString) return "Date inconnue";
  
  const publicationDate = new Date(dateString);
  const now = new Date();
  const diffInMs = now - publicationDate;
  
  const diffInSeconds = Math.floor(diffInMs / 1000);
  
  if (diffInSeconds < 60) {
    return `Il y a ${diffInSeconds} seconde${diffInSeconds > 1 ? 's' : ''}`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `Il y a ${diffInMonths} mois`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `Il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`;
};

// Composant pour les cartes de portfolio
const PortfolioCard = ({ portfolio, onClick }) => {
  const [portfolioDetail, setPortfolioDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Palettes de couleurs vives pour les cartes
  const colorPalettes = [
    { 
      bg: 'from-purple-50 via-white to-white', 
      accent: 'purple', 
      gradient: 'from-purple-500 to-pink-500',
      border: 'border-purple-200',
      hoverBorder: 'hover:border-purple-400',
      button: 'bg-gradient-to-r from-purple-500 to-purple-600',
      accentColor: 'text-purple-700'
    },
    { 
      bg: 'from-blue-50 via-white to-white', 
      accent: 'blue', 
      gradient: 'from-blue-500 to-cyan-500',
      border: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
      button: 'bg-gradient-to-r from-blue-500 to-blue-600',
      accentColor: 'text-blue-700'
    },
    { 
      bg: 'from-green-50 via-white to-white', 
      accent: 'green', 
      gradient: 'from-green-500 to-emerald-500',
      border: 'border-green-200',
      hoverBorder: 'hover:border-green-400',
      button: 'bg-gradient-to-r from-green-500 to-green-600',
      accentColor: 'text-green-700'
    },
    { 
      bg: 'from-orange-50 via-white to-white', 
      accent: 'orange', 
      gradient: 'from-orange-500 to-red-500',
      border: 'border-orange-200',
      hoverBorder: 'hover:border-orange-400',
      button: 'bg-gradient-to-r from-orange-500 to-orange-600',
      accentColor: 'text-orange-700'
    },
    { 
      bg: 'from-indigo-50 via-white to-white', 
      accent: 'indigo', 
      gradient: 'from-indigo-500 to-purple-500',
      border: 'border-indigo-200',
      hoverBorder: 'hover:border-indigo-400',
      button: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      accentColor: 'text-indigo-700'
    },
    { 
      bg: 'from-pink-50 via-white to-white', 
      accent: 'pink', 
      gradient: 'from-pink-500 to-rose-500',
      border: 'border-pink-200',
      hoverBorder: 'hover:border-pink-400',
      button: 'bg-gradient-to-r from-pink-500 to-pink-600',
      accentColor: 'text-pink-700'
    },
    { 
      bg: 'from-teal-50 via-white to-white', 
      accent: 'teal', 
      gradient: 'from-teal-500 to-blue-500',
      border: 'border-teal-200',
      hoverBorder: 'hover:border-teal-400',
      button: 'bg-gradient-to-r from-teal-500 to-teal-600',
      accentColor: 'text-teal-700'
    },
    { 
      bg: 'from-amber-50 via-white to-white', 
      accent: 'amber', 
      gradient: 'from-amber-500 to-orange-500',
      border: 'border-amber-200',
      hoverBorder: 'hover:border-amber-400',
      button: 'bg-gradient-to-r from-amber-500 to-amber-600',
      accentColor: 'text-amber-700'
    }
  ];
  
  // Sélectionner une palette aléatoire mais cohérente
  const getColorPalette = (id) => {
    if (!id) return colorPalettes[0];
    const index = parseInt(id.toString().slice(-1)) % colorPalettes.length;
    return colorPalettes[index];
  };
  
  const palette = getColorPalette(portfolio.id);

  // Obtenir les initiales
  const getInitials = (title) => {
    if (!title || title.trim() === '') return 'P';
    
    const words = title.split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(portfolio.titre);
  
  // Récupérer les détails du portfolio
  useEffect(() => {
    const loadPortfolioDetail = async () => {
      if (portfolio.id && !portfolio.photo_profil) {
        setLoadingDetail(true);
        try {
          const detail = await fetchApi(`/api/portfolio/portfolios/${portfolio.id}/`);
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

  // Obtenir l'URL de la photo
  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    
    if (photoPath.startsWith('http')) {
      return photoPath;
    }
    
    if (photoPath.startsWith('/')) {
      return `${API_BASE_URL}${photoPath}`;
    }
    
    return `${API_BASE_URL}/media/${photoPath}`;
  };

  const photoToDisplay = portfolioDetail?.photo_profil || portfolio.photo_profil;
  const photoUrl = getPhotoUrl(photoToDisplay);
  
  const timeSincePublication = getTimeSincePublication(
    portfolio.date_modification || portfolio.date_creation
  );

  return (
    <div
      onClick={() => onClick(portfolio.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group w-full bg-gradient-to-br ${palette.bg} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 ${palette.border} ${palette.hoverBorder} overflow-hidden transform hover:-translate-y-1 h-full flex flex-col`}
      style={{ minHeight: '380px' }}
    >
      {/* En-tête avec couleur du thème */}
      <div 
        className="h-3 rounded-t-2xl"
        style={{ 
          background: portfolio.theme_couleur ? 
            `linear-gradient(90deg, ${portfolio.theme_couleur}, ${portfolio.theme_couleur}80)` : 
            `linear-gradient(90deg, ${palette.gradient})`
        }}
      ></div>
      
      {/* Contenu principal */}
      <div className="p-6 flex-1 flex flex-col">
        {/* En-tête avec photo de profil */}
        <div className="flex items-start gap-5 mb-5">
          {/* Photo de profil - PLUS GRANDE */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-xl">
                {photoUrl && !loadingDetail ? (
                  <img 
                    src={photoUrl} 
                    alt={portfolio.titre || "Portfolio"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const avatarDiv = document.createElement('div');
                      avatarDiv.className = `w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-r ${palette.gradient}`;
                      avatarDiv.innerHTML = `<span class="text-2xl">${initials}</span>`;
                      e.target.parentNode.appendChild(avatarDiv);
                    }}
                  />
                ) : loadingDetail ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" style={{ borderColor: palette.accentColor }}></div>
                  </div>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-r ${palette.gradient}`}>
                    <span className="text-2xl">{initials}</span>
                  </div>
                )}
              </div>
              
              {/* Badge de statut */}
              <div className="absolute -bottom-2 -right-2">
                <span className={`px-3 py-1 text-xs rounded-full font-bold border-2 border-white shadow-lg
                  ${portfolio.statut === 'publie' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                    portfolio.statut === 'brouillon' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white' :
                    'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'}`}
                >
                  {portfolio.statut === 'publie' ? 'PUBLIÉ' : 'BROUILLON'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Titre et informations */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition line-clamp-1 mb-1">
                  {portfolio.titre || "Portfolio sans titre"}
                </h3>
                <p className={`text-base font-semibold ${palette.accentColor} mt-1 truncate`}>
                  {portfolio.utilisateur?.nom_complet || "Utilisateur"}
                </p>
              </div>
              
              {/* Indicateur de durée */}
              <div className="text-right ml-2 flex-shrink-0">
                <span 
                  className="inline-flex items-center gap-2 text-xs font-medium bg-white px-3 py-1.5 rounded-full shadow-sm border"
                  title={`Publié: ${portfolio.date_modification || portfolio.date_creation}`}
                >
                  <span className={`w-2 h-2 rounded-full bg-${palette.accent}-500`}></span>
                  <span className="text-gray-700">{timeSincePublication}</span>
                </span>
              </div>
            </div>
            
            {/* Profession */}
            {(portfolio.titre_professionnel || portfolioDetail?.titre_professionnel) && (
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 bg-white rounded-full text-sm font-medium border shadow-sm">
                  <span className={`w-2 h-2 rounded-full bg-${palette.accent}-500 mr-2`}></span>
                  {portfolioDetail?.titre_professionnel || portfolio.titre_professionnel}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Description */}
        <div className="flex-1 mb-5">
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3 min-h-[4rem]">
            {portfolioDetail?.description || portfolioDetail?.biographie || 
             portfolio.description || portfolio.biographie || 
             "Aucune description disponible. Ce portfolio n'a pas encore été complété avec une description."}
          </p>
        </div>
        
        {/* Métriques */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl text-xs font-medium border shadow-sm" title="Compétences">
            <span className={`text-lg text-${palette.accent}-600`}>🛠️</span>
            <span className="text-gray-800 font-bold">{portfolio.nombre_competences || portfolio.competences_ids?.length || 0}</span>
            <span className="text-gray-600">compétences</span>
          </span>
          <span className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl text-xs font-medium border shadow-sm" title="Projets">
            <span className={`text-lg text-${palette.accent}-600`}>🚀</span>
            <span className="text-gray-800 font-bold">{portfolio.nombre_projets || portfolio.projets_ids?.length || 0}</span>
            <span className="text-gray-600">projets</span>
          </span>
          {portfolio.vue_count !== undefined && (
            <span className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl text-xs font-medium border shadow-sm" title="Vues">
              <span className={`text-lg text-${palette.accent}-600`}>👁️</span>
              <span className="text-gray-800 font-bold">{portfolio.vue_count}</span>
              <span className="text-gray-600">vues</span>
            </span>
          )}
        </div>
        
        {/* Bouton d'action */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClick(portfolio.id);
            }}
            className={`w-full py-3 text-white font-medium text-sm flex items-center justify-center gap-2 ${palette.button} hover:shadow-lg rounded-xl transition-all duration-300 transform ${isHovered ? 'scale-[1.02]' : 'scale-100'}`}
          >
            <span>Voir le portfolio</span>
            <span className={`transform transition-transform duration-300 ${isHovered ? 'translate-x-2' : ''}`}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Données des modèles avec images réelles
const templates = [
  {
    id: 1,
    title: "Modèle Minimaliste",
    category: "web developer",
    description: "Design épuré pour développeurs, mise en page simple et efficace",
    color: "from-blue-500 to-cyan-500",
    image: "/templates/templates1.jpg"
  },
  {
    id: 2,
    title: "Modèle Créatif",
    category: "web designer",
    description: "Parfait pour designers, animations et effets visuels",
    color: "from-purple-500 to-pink-500",
    image: "/templates/templates2.jpg"
  },
  {
    id: 3,
    title: "Modèle Professionnel",
    category: "Graphiste",
    description: "Pour profils artistiques, galerie visuelle élégante",
    color: "from-green-500 to-emerald-500",
    image: "/templates/templates3.jpg"
  },
  {
    id: 4,
    title: "Modèle Portfolio",
    category: "web developer",
    description: "Showcase de projets avec focus sur le code",
    color: "from-orange-500 to-red-500",
    image: "/templates/templates4.jpg"
  },
  {
    id: 5,
    title: "Modèle Simple",
    category: "web designer",
    description: "Design clair et lisible, typographie soignée",
    color: "from-indigo-500 to-purple-500",
    image: "/templates/templates5.jpg"
  },
  {
    id: 6,
    title: "Modèle Artistique",
    category: "Graphiste",
    description: "Pour créatifs visuels, galerie d'images immersive",
    color: "from-teal-500 to-blue-500",
    image: "/templates/templates6.jpg"
  },
  {
    id: 7,
    title: "Modèle Tech",
    category: "web developer",
    description: "Style moderne tech, dark mode intégré",
    color: "from-yellow-500 to-orange-500",
    image: "/templates/templates7.jpg"
  },
  {
    id: 8,
    title: "Modèle Élégant",
    category: "web designer",
    description: "Design sophistiqué, animations fluides",
    color: "from-pink-500 to-rose-500",
    image: "/templates/templates8.jpg"
  },
   {
    id: 9,
    title: "Modèle Élégant",
    category: "web designer",
    description: "Design sophistiqué, animations fluides",
    color: "from-pink-500 to-rose-500",
    image: "/templates/templates9.jpg"
  },
   {
    id: 10,
    title: "Modèle Élégant",
    category: "web designer",
    description: "Design sophistiqué, animations fluides",
    color: "from-pink-500 to-rose-500",
    image: "/templates/templates10.jpg"
  }
];

// Composant principal ModelsAndPublic
const Models = () => {
  
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewMode, setViewMode] = useState("models"); // "models" ou "public"
  const navigate = useNavigate();

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('portfolioX_access_token');
      const user = localStorage.getItem('portfolioX_user');
      
      if (token && user) {
        setIsAuthenticated(true);
        
        // Si l'utilisateur est connecté, charger les portfolios par défaut
        if (viewMode === "public") {
          fetchPublishedPortfolios();
        }
      } else {
        setIsAuthenticated(false);
        // Pour les utilisateurs non connectés, rester sur le mode "models"
        setViewMode("models");
      }
    };

    checkAuth();
    
    // Écouter les changements de localStorage
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [viewMode]);

  // Récupérer les portfolios publiés
  const fetchPublishedPortfolios = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchApi('/api/portfolio/portfolios/');
      
      let portfolioList = [];
      
      if (data && data.results) {
        portfolioList = data.results;
      } else if (Array.isArray(data)) {
        portfolioList = data;
      }

      const publishedPortfolios = portfolioList.filter(portfolio => 
        portfolio.statut === 'publie' || portfolio.is_published === true
      );

      // Récupérer les détails complets
      const portfoliosWithDetails = await Promise.all(
        publishedPortfolios.map(async (portfolio) => {
          try {
            const portfolioDetail = await fetchApi(`/api/portfolio/portfolios/${portfolio.id_portfolio}/`);
            
            return {
              id: portfolio.id_portfolio,
              titre: portfolio.titre,
              description: portfolioDetail?.description || portfolioDetail?.biographie || portfolio.titre || "Description non disponible",
              titre_professionnel: portfolioDetail?.titre_professionnel || portfolio.utilisateur?.nom_complet || "Utilisateur",
              slug: portfolio.slug,
              statut: portfolio.statut,
              date_creation: portfolio.date_creation,
              date_modification: portfolio.date_modification,
              vue_count: portfolio.vue_count,
              utilisateur: portfolio.utilisateur,
              photo_profil: portfolioDetail?.photo_profil || null,
              nombre_contacts: portfolio.nombre_contacts || 0,
              nombre_competences: portfolio.nombre_competences || 0,
              nombre_projets: portfolio.nombre_projets || 0,
              theme_couleur: portfolioDetail?.theme_couleur || "#8b5cf6",
              layout_type: portfolioDetail?.layout_type || "standard",
              biographie: portfolioDetail?.biographie,
              time_since_publication: getTimeSincePublication(portfolio.date_modification || portfolio.date_creation),
              formatted_date: new Date(portfolio.date_modification || portfolio.date_creation).toLocaleDateString('fr-FR'),
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
              formatted_date: new Date(portfolio.date_modification || portfolio.date_creation).toLocaleDateString('fr-FR'),
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

      // Trier par date
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

  // Recherche
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      if (viewMode === "public" && isAuthenticated) {
        fetchPublishedPortfolios();
      }
      return;
    }

    try {
      setLoading(true);
      
      if (viewMode === "public" && isAuthenticated) {
        // Recherche pour les portfolios publics
        let searchResults = [];
        try {
          const data = await fetchApi(`/api/portfolio/portfolios/search/?q=${encodeURIComponent(searchTerm)}`);
          
          if (data && data.results) {
            searchResults = data.results;
          } else if (Array.isArray(data)) {
            searchResults = data;
          }
        } catch (searchErr) {
          // Fallback: Filtrer localement
          searchResults = portfolios.filter(portfolio => 
            portfolio.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            portfolio.utilisateur?.nom_complet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            portfolio.titre_professionnel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            portfolio.description?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setPortfolios(searchResults);
      }
      
    } catch (err) {
      setError("Erreur lors de la recherche");
      console.error("Erreur recherche:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les portfolios
  const getFilteredPortfolios = () => {
    if (viewMode !== "public" || activeFilter === "All") {
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

  // Filtrer les modèles
  const getFilteredTemplates = () => {
    if (activeFilter === "All") {
      return templates.filter(template => 
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return templates.filter(template => 
      template.category.toLowerCase() === activeFilter.toLowerCase() &&
      (template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       template.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const filteredPortfolios = getFilteredPortfolios();
  const filteredTemplates = getFilteredTemplates();

  // Rediriger vers le détail
  const viewPortfolioDetail = (portfolioId) => {
    navigate(`/portfolioDetail/${portfolioId}`);
  };

  // Sélectionner un modèle - MODIFIÉ POUR REDIRIGER VERS /template/:id
  const selectTemplate = (templateId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Rediriger vers la page de visualisation du template
    navigate(`/template/${templateId}`);
  };

  // Créer un portfolio
  const createBlankPortfolio = () => {
    if (!isAuthenticated) {
      // Rediriger vers la connexion si non connecté
      navigate('/login');
      return;
    }
    navigate('/portfolio/');
  };

  // Basculer entre les vues
  const toggleViewMode = (mode) => {
    if (!isAuthenticated && mode === "public") return;
    
    setViewMode(mode);
    setSearchTerm("");
    
    // Si on passe en mode public, charger les portfolios
    if (mode === "public") {
      fetchPublishedPortfolios();
    }
  };

  // VUE MODELS (templates)
  const renderModelsView = () => (
    
    <>
    
      {/* Title */}
      <h1 className="text-center text-3xl md:text-4xl font-bold text-purple-600 mb-10">
        The easiest way to create your portfolio
      </h1>

      {/* Search Bar */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Rechercher un modèle par nom, catégorie ou description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-2xl border border-gray-400 rounded-md py-3 px-4 focus:outline-none focus:border-purple-500 transition text-sm md:text-base"
        />
      </div>

      {/* Filters et bouton de création */}
      <div className="flex justify-center gap-4 flex-wrap mb-10">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2 rounded-md border text-sm font-medium transition duration-200
              ${activeFilter === filter
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-600 shadow-sm"
                : "border-purple-400 text-purple-600 bg-white hover:bg-purple-50"
              }`}
          >
            {filter}
          </button>
        ))}
        
        {/* Bouton pour créer un portfolio (sans modèle) */}
        {isAuthenticated ? (
          <button
            onClick={createBlankPortfolio}
            className="px-6 py-2 rounded-md bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium border border-green-500 hover:shadow-md transition duration-200 shadow-sm"
          >
            + Créer depuis zéro
          </button>
        ) : (
          <button
      
            className="px-6 py-2 rounded-md bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium border border-purple-500 hover:shadow-md transition duration-200 shadow-sm"
          >
             Se connecter
          </button>
        )}
      </div>

      {/* Message de recherche */}
      {searchTerm && (
        <div className="text-center mb-6">
          <p className="text-gray-600 inline-block px-4 py-2 bg-gray-100 rounded-full">
            {filteredTemplates.length} modèle{filteredTemplates.length > 1 ? 's' : ''} 
            {searchTerm && ` pour "${searchTerm}"`}
            {activeFilter !== "All" && ` en "${activeFilter}"`}
          </p>
        </div>
      )}

      {/* Templates Grid - Version avec images réelles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-20">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-gray-400 text-4xl mb-3">🔍</div>
            <p className="text-gray-600 text-lg mb-2">
              Aucun modèle trouvé
            </p>
            <p className="text-gray-500">
              Essayez avec d'autres termes de recherche ou changez de filtre
            </p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => selectTemplate(template.id)} // MODIFIÉ ICI
              className="w-full bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-purple-300 overflow-hidden group"
            >
              {/* Image du modèle */}
              <div className="h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                <img 
                  src={template.image} 
                  alt={template.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.className = `w-full h-full flex flex-col items-center justify-center bg-gradient-to-r ${template.color} text-white`;
                    fallbackDiv.innerHTML = `
                      <div class="text-4xl mb-2"></div>
                      <div class="text-lg font-medium">${template.title}</div>
                    `;
                    e.target.parentNode.appendChild(fallbackDiv);
                  }}
                />
              </div>
              
              {/* Contenu de la carte */}
              <div className="p-5">
                {/* Titre et catégorie */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-600 transition line-clamp-1">
                    {template.title}
                  </h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                    {template.category}
                  </span>
                </div>
                
                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                  {template.description}
                </p>
                
                {/* Bouton d'action */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex items-center text-gray-500 text-xs">
                    <span className="inline-flex items-center mr-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${template.color} mr-1`}></div>
                      Template #{template.id}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      selectTemplate(template.id);
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 shadow-sm ${
                      isAuthenticated 
                        ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-md"
                        : "bg-gray-100 text-gray-600 border border-gray-300"
                    }`}
                  >
                    {isAuthenticated ? "Sélectionner →" : " Connectez-vous"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Message pour les non connectés */}
      {!isAuthenticated && (
        <div className="mt-10 text-center">
          <div className="inline-block bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-8 max-w-lg shadow-sm">
            <div className="text-4xl mb-4 text-purple-600"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Démarrez avec un modèle professionnel</h3>
            <p className="text-gray-600 mb-6">
              Connectez-vous pour accéder à tous nos modèles de portfolio et créer votre présence en ligne professionnelle en quelques minutes.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-lg transition font-medium shadow-sm"
              >
                Se connecter
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition font-medium"
              >
                Créer un compte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aperçu rapide des modèles */}
      {filteredTemplates.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
            Nos modèles les plus populaires
          </h3>
          <div className="flex overflow-x-auto gap-4 pb-4 px-4">
            {templates.slice(0, 4).map((template) => (
              <div 
                key={template.id}
                className="flex-shrink-0 w-48 cursor-pointer"
                onClick={() => selectTemplate(template.id)} // MODIFIÉ ICI
              >
                <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200">
                  <img 
                    src={template.image} 
                    alt={template.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-3 bg-white">
                    <p className="text-sm font-medium text-gray-800 truncate">{template.title}</p>
                    <p className="text-xs text-gray-500 truncate">{template.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pied de page */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center px-4">
        <p className="text-gray-400 text-xs">
          PortfolioX Templates v1.0 • Tous les modèles sont personnalisables et responsifs
        </p>
      </div>
    </>
  );

  // VUE PUBLIC (portfolios publiés) - VERSION AMÉLIORÉE
  const renderPublicView = () => (
    <>
      {/* Header avec design amélioré */}
      <div className="text-center mb-12">
        <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-medium mb-4 shadow-lg">
          👥 Découvrez la communauté
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Portfolios <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Créatifs</span>
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Explorez les portfolios inspirants créés par notre communauté de professionnels talentueux
        </p>
      </div>

      {/* Barre de recherche et filtres améliorés */}
      <div className="max-w-4xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Rechercher un portfolio, une compétence ou un nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-2xl py-4 px-6 focus:outline-none focus:border-purple-500 transition text-base shadow-lg hover:shadow-xl"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition font-medium"
            >
              Rechercher
            </button>
          </div>
        </form>

        {/* Filtres avec design amélioré */}
        <div className="flex justify-center gap-3 flex-wrap mb-8">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                activeFilter === filter
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-400 hover:shadow-md"
              }`}
            >
              {filter === "All" ? "Tous" : filter}
            </button>
          ))}
          
          {/* Bouton pour créer un portfolio */}
          <button
            onClick={createBlankPortfolio}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium border-2 border-emerald-500 hover:shadow-lg transition-all duration-300 transform hover:scale-105 shadow-md"
          >
            ✨ Créer le mien
          </button>
        </div>
      </div>


      {/* États de chargement */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-flex flex-col items-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-200 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-t-purple-600 border-r-purple-600 border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Chargement des portfolios...</p>
            <p className="text-gray-500 mt-2">Patience, nous cherchons les meilleurs profils pour vous</p>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && !loading && (
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="inline-block bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-2xl p-8 shadow-lg">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-red-700 mb-3">Oups ! Une erreur est survenue</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={fetchPublishedPortfolios}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition font-medium shadow-md"
            >
              🔄 Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Grille de portfolios - DESIGN AMÉLIORÉ */}
      {!loading && !error && (
        <>
          {filteredPortfolios.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center py-16">
              <div className="inline-block bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-12 shadow-lg">
                <div className="text-6xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  {searchTerm 
                    ? `Aucun résultat pour "${searchTerm}"`
                    : "Aucun portfolio publié pour le moment"}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchTerm 
                    ? "Essayez avec d'autres termes de recherche ou explorez d'autres catégories"
                    : "Soyez le premier à créer un portfolio et inspirez la communauté !"}
                </p>
                <div className="flex gap-4 justify-center">
                  {searchTerm ? (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium"
                    >
                      Voir tous les portfolios
                    </button>
                  ) : (
                    <button
                      onClick={createBlankPortfolio}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-medium shadow-md"
                    >
                      🚀 Créer le premier portfolio
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/explore')}
                    className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 transition font-medium"
                  >
                    Explorer les catégories
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 lg:px-8">
              {filteredPortfolios.map((portfolio) => (
                <PortfolioCard 
                  key={portfolio.id}
                  portfolio={portfolio}
                  onClick={viewPortfolioDetail}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination/Navigation */}
      {!loading && !error && filteredPortfolios.length > 0 && (
        <div className="mt-16 flex justify-between items-center max-w-4xl mx-auto px-4">
          <div className="text-gray-600">
            <span className="font-medium">Astuce :</span> Cliquez sur une carte pour voir le portfolio complet
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 border-2 border-gray-300 rounded-xl text-gray-700 hover:border-purple-500 hover:text-purple-700 transition">
              ← Précédent
            </button>
            <span className="text-gray-700 font-medium">1 sur 3</span>
            <button className="px-4 py-2 border-2 border-purple-500 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition">
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* Pied de page amélioré */}
      {!loading && !error && portfolios.length > 0 && (
        <div className="mt-20 pt-12 border-t-2 border-gray-100">
          <div className="max-w-3xl mx-auto text-center px-4">
      
            <p className="text-gray-500 text-sm mb-8">
              PortfolioX Community v2.0 • Connecté à l'API • Tous les portfolios sont vérifiés
            </p>
            <div className="flex justify-center gap-6">
              <button
                onClick={createBlankPortfolio}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl transition font-medium shadow-lg transform hover:scale-105"
              >
                 Créer mon portfolio
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-purple-500 hover:text-purple-700 transition font-medium"
              >
                ↑ Retour en haut
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 px-4 md:px-8 py-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div><div className="fixed top-0 left-0 right-0 z-50">
               <Navbar />
                   </div> </div>
        <div className="flex items-center gap-6">
      
        </div>
      </header>

      {/* Section de basculement Models/Personnes - DESIGN COMME L'IMAGE */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex rounded-full border-2 border-gray-200 bg-gray-50 p-1 shadow-lg">
          {/* Bouton Models */}
          <button
            onClick={() => toggleViewMode("models")}
            className={`flex items-center justify-center gap-3 px-10 py-3 rounded-full text-base font-medium transition-all duration-300 ${
              viewMode === "models"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl">📁</span>
            <span>Modèles</span>
          </button>
          
          {/* Bouton Personnes (remplace Public) - désactivé si non connecté */}
          <button
            onClick={() => toggleViewMode("public")}
            disabled={!isAuthenticated}
            className={`flex items-center justify-center gap-3 px-10 py-3 rounded-full text-base font-medium transition-all duration-300 ${
              viewMode === "public"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : !isAuthenticated
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title={!isAuthenticated ? "Connectez-vous pour voir les portfolios de la communauté" : ""}
          >
            <span className="text-xl">👥</span>
            <span>Personnes</span>
            {!isAuthenticated && (
              <span className="text-xs ml-1 text-gray-400 px-2 py-0.5 bg-gray-200 rounded-full">login</span>
            )}
          </button>
        </div>
      </div>

      {/* Afficher la vue appropriée */}
      {viewMode === "models" ? renderModelsView() : renderPublicView()}

      {/* Footer global */}
   <Footer />
    </div>
  );
};

export default Models;