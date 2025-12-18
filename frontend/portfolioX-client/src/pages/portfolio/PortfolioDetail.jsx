import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Configuration API
const API_BASE_URL = 'http://localhost:8000';

// Fonction utilitaire pour les appels API
const fetchApi = async (endpoint, method = 'GET', data = null) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
    };

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

/* ===========================
   UI Helper components
   =========================== */

// ContactItem - DESIGN MODERNE
const ContactItem = ({ contact }) => {
    if (!contact || typeof contact !== 'object') {
        return (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
                    <span className="text-2xl text-gray-500">❓</span>
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-gray-900">Contact non valide</p>
                    <p className="text-gray-500 text-sm mt-1">Information manquante</p>
                </div>
            </div>
        );
    }

    const getLink = () => {
        if (!contact.valeur_contact) return '#';
        
        if (contact.type_contact?.toLowerCase() === 'email') {
            return `mailto:${contact.valeur_contact}`;
        } else if (contact.type_contact?.toLowerCase() === 'phone') {
            return `tel:${contact.valeur_contact}`;
        } else if (contact.valeur_contact.startsWith('http')) {
            return contact.valeur_contact;
        } else if (contact.valeur_contact.includes('@')) {
            return `mailto:${contact.valeur_contact}`;
        } else {
            return `https://${contact.valeur_contact}`;
        }
    };

    const getIcon = () => {
        switch (contact.type_contact?.toLowerCase()) {
            case 'email': 
                return <img src="/icons/email.png" alt="" className="contact-icon" />;
            case 'linkedin': 
                return <img src="/icons/Linkedin.png" alt="" className="contact-icon" />;
            case 'github': 
                return <img src="/icons/github.png" alt="" className="contact-icon" />;
            case 'website': 
                return <img src="/icons/website.png" alt="" className="contact-icon" />;
            case 'phone': 
                return <img src="/icons/phone.png" alt="" className="contact-icon" />;
            case 'twitter': 
                return <img src="/icons/twitter.png" alt="" className="contact-icon" />;
            default: 
                return <img src="/icons/phone.png" alt="" className="contact-icon" />;
        }
    };

    const getColorClass = () => {
        switch (contact.type_contact?.toLowerCase()) {
            case 'email': return 'bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-700';
            case 'linkedin': return 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-700';
            case 'github': return 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-900 text-white';
            case 'website': return 'bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-green-700';
            case 'phone': return 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 text-purple-700';
            default: return 'bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700';
        }
    };

    const isClickable = contact.type_contact?.toLowerCase() === 'email' || 
                        contact.type_contact?.toLowerCase() === 'phone' ||
                        (contact.valeur_contact || '').includes('http') ||
                        (contact.valeur_contact || '').includes('@');

    const link = getLink();
    const colorClass = getColorClass();

    const content = (
        <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${colorClass}`}>
            <div className="flex items-center justify-center w-14 h-14 bg-white/50 rounded-xl backdrop-blur-sm">
                <span className="text-2xl">{getIcon()}</span>
            </div>
            <div className="flex-1">
                <p className="font-bold text-sm mb-1">
                    {contact.type_contact === 'telephone' ? 'Téléphone' :
                     contact.type_contact === 'linkedin' ? 'LinkedIn' :
                     contact.type_contact === 'github' ? 'GitHub' :
                     contact.type_contact === 'email' ? 'Email' :
                     contact.type_contact || 'Contact'}
                </p>
                <p className="text-base font-medium break-all">{contact.valeur_contact || "Non spécifié"}</p>
            </div>
            {isClickable && (
                <div className="w-10 h-10 flex items-center justify-center bg-white/50 rounded-full backdrop-blur-sm">
                    <span className="text-lg">↗</span>
                </div>
            )}
        </div>
    );

    return isClickable ? (
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
        >
            {content}
        </a>
    ) : (
        <div className="cursor-default">
            {content}
        </div>
    );
};

// SkillItem - DESIGN AVEC GRADIENTS
const SkillItem = ({ skill }) => {
    const getNiveauNumber = () => {
        if (skill.niveau_competence === 'debutant') return 1;
        if (skill.niveau_competence === 'intermediaire') return 2;
        if (skill.niveau_competence === 'avance') return 3;
        if (skill.niveau_competence === 'expert') return 4;
        if (skill.niveau_competence === 'maitrise') return 5;
        return 0;
    };

    const niveauNumber = getNiveauNumber();
    const niveauPourcentage = niveauNumber * 20;

    const getGradientColor = () => {
        if (niveauPourcentage <= 40) return 'from-red-500 to-orange-500';
        if (niveauPourcentage <= 70) return 'from-yellow-500 to-amber-500';
        return 'from-green-500 to-emerald-500';
    };

    const gradientColor = getGradientColor();

    return (
        <div className="group p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
            <div className="flex items-start gap-4 mb-4">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xl font-bold text-gray-900">
                            {skill.nom_competence || "Compétence sans nom"}
                        </h4>
                        {skill.annees_experience && (
                            <span className="px-3 py-1 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                                {skill.annees_experience} an{skill.annees_experience > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    
                    {skill.categorie && (
                        <div className="mb-4">
                            <span className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                                {skill.categorie}
                            </span>
                        </div>
                    )}
                    
                    {skill.niveau_competence && (
                        <div className="mb-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-3">
                                <span className="font-medium">Niveau : {skill.niveau_competence}</span>
                                <span className="font-bold">{niveauPourcentage}%</span>
                            </div>
                            <div className="relative">
                                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full bg-gradient-to-r ${gradientColor} transition-all duration-1000`}
                                        style={{ width: `${niveauPourcentage}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>Débutant</span>
                                    <span>Intermédiaire</span>
                                    <span>Avancé</span>
                                    <span>Expert</span>
                                    <span>Maîtrise</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {skill.description && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border-l-4 border-indigo-400">
                            <p className="text-gray-700">
                                {skill.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ProjectItem - DESIGN CARDS ÉLÉGANTES
const ProjectItem = ({ project }) => {
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/')) return `${API_BASE_URL}${imagePath}`;
        return `${API_BASE_URL}/media/${imagePath}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    const imageUrl = getImageUrl(project.image_projet);

    return (
        <div className="group relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            {/* Project Image/Thumbnail */}
            <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={project.titre_projet}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center text-5xl text-gray-400">
                                    🖼️
                                </div>
                            `;
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl text-gray-400">
                        🖼️
                    </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                        project.est_termine 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                            : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                    }`}>
                        {project.est_termine ? '✓ Terminé' : 'En cours'}
                    </span>
                </div>
                
                {/* Tech Stack Badge */}
                {project.langage_projet && (
                    <div className="absolute top-4 right-4">
                        <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full shadow-sm">
                            {project.langage_projet}
                        </span>
                    </div>
                )}
            </div>

            {/* Project Content */}
            <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                            {project.titre_projet || 'Projet sans titre'}
                        </h4>
                        <p className="text-gray-600 line-clamp-2 mb-4">
                            {project.description_projet || 'Aucune description disponible.'}
                        </p>
                    </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between mb-6">
                    {project.date_realisation && (
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <span className="text-lg">📅</span>
                            <span>{formatDate(project.date_realisation)}</span>
                        </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs font-medium rounded-full">
                            Projet
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {(project.lien_projet || project.lien_github) ? (
                        <>
                            {project.lien_projet && (
                                <a
                                    href={project.lien_projet}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 text-center"
                                >
                                    🌐 Voir le projet
                                </a>
                            )}
                            {project.lien_github && (
                                <a
                                    href={project.lien_github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 text-center"
                                >
                                    👨‍💻 Code source
                                </a>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-600 font-semibold rounded-xl text-center">
                            🔗 Aucun lien disponible
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ===========================
   MAIN COMPONENT (PortfolioDetail)
   =========================== */

const PortfolioDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Données extraites
    const [contacts, setContacts] = useState([]);
    const [competences, setCompetences] = useState([]);
    const [projets, setProjets] = useState([]);
    const [formations, setFormations] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [langues, setLangues] = useState([]);
    const [certifications, setCertifications] = useState([]);
    const [interets, setInterets] = useState([]);

    // États pour les images
    const [bannerUrl, setBannerUrl] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [templateImageUrl, setTemplateImageUrl] = useState(null);

    // Statistiques pour le header
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalSkills: 0,
        totalExperience: 0,
        totalContacts: 0
    });

    // Référence pour éviter les doubles appels
    const isFetching = useRef(false);
    const fetchedPortfolioId = useRef(null);

    useEffect(() => {
        const fetchPortfolioData = async () => {
            // Éviter les doubles appels pour le même portfolio
            if (isFetching.current || (fetchedPortfolioId.current === id && portfolio)) {
                console.log('⏭️  Déjà en cours de chargement ou déjà chargé');
                return;
            }

            try {
                isFetching.current = true;
                fetchedPortfolioId.current = id;
                setLoading(true);
                setError(null);

                console.log(`📡 Début chargement portfolio ${id}...`);

                // Récupérer les données du portfolio
                const portfolioData = await fetchApi(`/api/portfolio/portfolios/${id}/`);

                if (portfolioData) {
                    console.log('✅ Portfolio récupéré:', portfolioData);
                    
                    // Fonction pour obtenir l'URL complète
                    const getImageUrl = (imagePath) => {
                        if (!imagePath) return null;
                        if (imagePath.startsWith('http')) return imagePath;
                        if (imagePath.startsWith('/')) return `${API_BASE_URL}${imagePath}`;
                        return `${API_BASE_URL}/media/${imagePath}`;
                    };

                    // Vérifier et mettre à jour photo_template
                    if (portfolioData.photo_template) {
                        const url = getImageUrl(portfolioData.photo_template);
                        console.log('🖼️ Setting templateImageUrl to:', url);
                        setTemplateImageUrl(url);
                    } else {
                        console.log('⚠️  Aucune photo_template trouvée');
                        setTemplateImageUrl(null);
                    }

                    if (portfolioData.banniere_image || portfolioData.header_image || portfolioData.photo_couverture) {
                        const bannerImage = portfolioData.banniere_image || 
                                          portfolioData.header_image || 
                                          portfolioData.photo_couverture;
                        setBannerUrl(getImageUrl(bannerImage));
                    } else {
                        setBannerUrl(null);
                    }

                    if (portfolioData.photo_profil) {
                        setAvatarUrl(getImageUrl(portfolioData.photo_profil));
                    } else {
                        setAvatarUrl(null);
                    }

                    // Mettre à jour les données principales
                    setFormations(portfolioData.formations || []);
                    setExperiences(portfolioData.experiences || []);
                    setLangues(portfolioData.langues || []);
                    setCertifications(portfolioData.certifications || []);
                    setInterets(portfolioData.interets || []);
                    setPortfolio(portfolioData);

                    // Charger les contacts, compétences et projets
                    let contactsList = [];
                    let competencesList = [];
                    let projetsList = [];

                    // Contacts
                    try {
                        const contactsData = await fetchApi(`/api/portfolio/portfolios/${id}/public-contacts/`);
                        if (Array.isArray(contactsData)) {
                            contactsList = contactsData;
                        } else if (contactsData && contactsData.results) {
                            contactsList = contactsData.results;
                        }
                    } catch (e) {
                        console.log('Erreur récupération contacts:', e.message);
                        contactsList = [];
                    }

                    // Compétences
                    try {
                        const competencesData = await fetchApi(`/api/portfolio/portfolios/${id}/public-competences/`);
                        if (Array.isArray(competencesData)) {
                            competencesList = competencesData;
                        } else if (competencesData && competencesData.results) {
                            competencesList = competencesData.results;
                        }
                    } catch (e) {
                        console.log('Erreur récupération compétences:', e.message);
                        competencesList = [];
                    }

                    // Projets
                    try {
                        const projetsData = await fetchApi(`/api/portfolio/portfolios/${id}/public-projets/`);
                        if (Array.isArray(projetsData)) {
                            projetsList = projetsData;
                        } else if (projetsData && projetsData.results) {
                            projetsList = projetsData.results;
                        }
                    } catch (e) {
                        console.log('Erreur récupération projets:', e.message);
                        projetsList = [];
                    }

                    // Mettre à jour les états
                    setContacts(contactsList);
                    setCompetences(competencesList);
                    setProjets(projetsList);
                    
                    // Calculer l'expérience totale
                    const totalExperience = (portfolioData.experiences || []).reduce((sum, exp) => {
                        if (exp.date_debut) {
                            const start = new Date(exp.date_debut);
                            const end = exp.date_fin === "présent" || !exp.date_fin ? new Date() : new Date(exp.date_fin);
                            const years = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
                            return sum + Math.max(0, years);
                        }
                        return sum;
                    }, 0);

                    // Calculer les statistiques
                    setStats({
                        totalProjects: projetsList.length,
                        totalSkills: competencesList.length,
                        totalExperience: Math.round(totalExperience * 10) / 10,
                        totalContacts: contactsList.length
                    });
                    
                    console.log('🎉 Données portfolio chargées avec succès');
                    console.log('🖼️ templateImageUrl final:', templateImageUrl);
                }

            } catch (err) {
                console.error('❌ Erreur:', err);
                setError(`Impossible de charger le portfolio: ${err.message}`);
                // Réinitialiser les refs en cas d'erreur
                isFetching.current = false;
                fetchedPortfolioId.current = null;
            } finally {
                setLoading(false);
                // Ne pas réinitialiser isFetching immédiatement pour éviter les doubles appels
                setTimeout(() => {
                    isFetching.current = false;
                }, 100);
            }
        };

        if (id) {
            fetchPortfolioData();
        }

        // Cleanup function
        return () => {
            // Réinitialiser si l'ID change
            if (fetchedPortfolioId.current !== id) {
                isFetching.current = false;
                fetchedPortfolioId.current = null;
            }
        };
    }, [id]);

    const calculateTotalExperience = () => {
        let totalYears = 0;
        experiences.forEach(exp => {
            if (exp.date_debut) {
                const start = new Date(exp.date_debut);
                const end = exp.date_fin === "présent" || !exp.date_fin ? new Date() : new Date(exp.date_fin);
                const years = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
                totalYears += Math.max(0, years);
            }
        });
        return Math.round(totalYears * 10) / 10;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="relative mb-6">
                        <div className="w-24 h-24 border-4 border-gray-200 rounded-full"></div>
                        <div className="w-24 h-24 border-4 border-t-purple-600 border-r-purple-600 border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0"></div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Chargement du portfolio...</h3>
                    <p className="text-gray-600">Préparation de la présentation créative</p>
                </div>
            </div>
        );
    }

    if (error || !portfolio) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="mb-6">
                        <div className="w-32 h-32 mx-auto bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center text-5xl mb-4">
                            ⚠️
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">Portfolio non disponible</h2>
                    <p className="text-gray-600 mb-8">{error || "Ce portfolio n'existe pas ou n'est pas accessible."}</p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => navigate('/models')}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-medium shadow-md"
                        >
                            ← Retour aux portfolios
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-purple-500 hover:text-purple-700 transition font-medium"
                        >
                            🔄 Réessayer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative bg-gradient-to-b from-gray-50 via-white to-gray-50">
            {/* Background avec photo_template - RENDU CLAIR SANS TRANSPARENCE */}
            {templateImageUrl && (
                  <div className="fixed inset-0 z-0">
  <img 
    src={templateImageUrl}
    alt="Background"
    className="w-full h-full object-cover"
    style={{
      // Aucun zoom, image à sa taille normale
      transform: 'none'
    }}
  />
</div>
               
            )}

            {/* Overlay blanc semi-transparent pour améliorer la lisibilité du texte */}
            <div className="fixed inset-0 z-1 bg-white/70 backdrop-blur-[2px]"></div>

            <div className="relative z-10">
                {/* Hero Section avec dégradé */}
                <div className="relative overflow-hidden">
                    {/* Banner */}
                    <div className="h-72 w-full relative">
                        {bannerUrl ? (
                            <img
                                src={bannerUrl}
                                alt="Bannière"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600"></div>
                        )}
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent"></div>
                    </div>

                    {/* Profile Card Overlay */}
                    <div className="container mx-auto px-4 lg:px-8 relative -mt-32">
                        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/70">
                            {/* Profile Header */}
                            <div className="p-8 lg:p-12">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt={portfolio.titre}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { 
                                                        e.target.style.display = 'none'; 
                                                        const parent = e.target.parentElement;
                                                        parent.innerHTML = `
                                                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white text-4xl">
                                                                ${portfolio.titre?.charAt(0) || 'P'}
                                                            </div>
                                                        `;
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white text-4xl">
                                                    {portfolio.titre?.charAt(0) || 'P'}
                                                </div>
                                            )}
                                        </div>
                                        {/* Online Status */}
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
                                    </div>

                                    {/* Profile Info */}
                                    <div className="flex-1">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                                                        {portfolio.titre || "Portfolio sans titre"}
                                                    </h1>
                                                    {portfolio.statut === 'publie' && (
                                                        <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-full">
                                                            🔥 PUBLIÉ
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xl text-gray-600 mb-4">
                                                    {portfolio.titre_professionnel || 'Professionnel créatif'}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mb-6">
                                                    {portfolio.theme_couleur && (
                                                        <span className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 text-sm font-medium rounded-full">
                                                            {portfolio.theme_couleur}
                                                        </span>
                                                    )}
                                                    <span className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 text-sm font-medium rounded-full">
                                                        Portfolio créatif
                                                    </span>
                                                    {/* Afficher si photo_template existe */}
                                                    {templateImageUrl && (
                                                        <span className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-sm font-medium rounded-full">
                                                            🖼️ Template appliqué
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => navigate('/models')}
                                                    className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:shadow-lg transition font-medium shadow-md"
                                                >
                                                    ← Retour
                                                </button>
                                                <button
                                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-medium shadow-md"
                                                >
                                                    📥 Contacter
                                                </button>
                                            </div>
                                        </div>

                                        {/* Stats Bar */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200">
                                                <div className="text-2xl font-bold text-blue-700 mb-1">{projets.length}</div>
                                                <div className="text-sm text-blue-600">Projets</div>
                                            </div>
                                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-2xl border border-green-200">
                                                <div className="text-2xl font-bold text-green-700 mb-1">{competences.length}</div>
                                                <div className="text-sm text-green-600">Compétences</div>
                                            </div>
                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200">
                                                <div className="text-2xl font-bold text-purple-700 mb-1">{calculateTotalExperience()}</div>
                                                <div className="text-sm text-purple-600">Années d'exp.</div>
                                            </div>
                                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-200">
                                                <div className="text-2xl font-bold text-orange-700 mb-1">{contacts.length}</div>
                                                <div className="text-sm text-orange-600">Contacts</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="container mx-auto px-4 lg:px-8 mt-12">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Sidebar */}
                        <aside className="w-full lg:w-1/3">
                            <div className="space-y-6">
                                {/* About Section */}
                                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                            <span className="text-2xl text-white">👤</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">À propos</h3>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                        {portfolio.biographie || portfolio.description || "Aucune description fournie."}
                                    </p>
                                    {portfolio.date_creation && (
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <span className="text-lg">📅</span>
                                                <span>Membre depuis {new Date(portfolio.date_creation).toLocaleDateString('fr-FR', { 
                                                    day: 'numeric', 
                                                    month: 'long', 
                                                    year: 'numeric' 
                                                })}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Contacts Section */}
                                {contacts.length > 0 && (
                                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-200">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                                <span className="text-2xl text-white">📞</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">Contact</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {contacts.map((c, idx) => (
                                                <ContactItem key={idx} contact={c} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Skills Overview */}
                                {competences.length > 0 && (
                                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-200">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                                <span className="text-2xl text-white">💼</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">Compétences</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {competences.slice(0, 8).map((s, i) => (
                                                <div key={i} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-purple-300 transition">
                                                    <div className="text-sm font-semibold text-gray-900 mb-1">{s.nom_competence}</div>
                                                    {s.niveau_competence && (
                                                        <div className="text-xs text-gray-500">{s.niveau_competence}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {competences.length > 8 && (
                                            <div className="mt-6 text-center">
                                                <button className="px-4 py-2 text-purple-600 font-medium">
                                                    + {competences.length - 8} compétences
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </aside>

                        {/* Main Content Area */}
                        <section className="w-full lg:w-2/3">
                            {/* Projects Section */}
                            <div className="mb-12">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                                            <span className="text-3xl text-white"></span>
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-gray-900">Projets récents</h2>
                                            <p className="text-gray-600">{projets.length} projets créatifs</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {projets.length === 0 ? (
                                        <div className="col-span-2 bg-gray-50 p-12 rounded-3xl text-center border border-gray-200">
                                            <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center text-4xl mb-6">
                                                📁
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-800 mb-3">Aucun projet</h3>
                                            <p className="text-gray-600 mb-6">Ce portfolio ne contient pas encore de projets publics.</p>
                                        </div>
                                    ) : (
                                        projets.map((project, index) => (
                                            <div key={index}>
                                                <ProjectItem project={project} />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Experiences & Education */}
                            <div className="space-y-12">
                                {/* Experiences */}
                                {experiences.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                                                <span className="text-3xl text-white">💼</span>
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-bold text-gray-900">Expérience professionnelle</h2>
                                                <p className="text-gray-600">{experiences.length} expériences</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {experiences.map((exp, idx) => {
                                                const startDate = exp.date_debut ? new Date(exp.date_debut) : null;
                                                const endDate = exp.date_fin && exp.date_fin !== "présent" ? new Date(exp.date_fin) : null;
                                                const duration = startDate ? 
                                                    endDate ? 
                                                        Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44 * 12) * 10) / 10 :
                                                        Math.round((new Date() - startDate) / (1000 * 60 * 60 * 24 * 30.44 * 12) * 10) / 10 
                                                    : null;

                                                return (
                                                    <div key={idx} className="group bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:scale-[1.01]">
                                                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                                                            <div className="flex-shrink-0">
                                                                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center">
                                                                    <span className="text-2xl">🏢</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                                                                    <div>
                                                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{exp.poste}</h3>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="font-semibold text-blue-600">{exp.entreprise}</span>
                                                                            {exp.lieu && <span className="text-gray-500">• {exp.lieu}</span>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        {duration && (
                                                                            <span className="px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                                                                                {duration} an{duration > 1 ? 's' : ''}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {exp.description && (
                                                                    <p className="text-gray-700 leading-relaxed">{exp.description}</p>
                                                                )}
                                                                <div className="mt-6 text-sm text-gray-500">
                                                                    {startDate && (
                                                                        <div className="flex items-center gap-2">
                                                                            <span>📅</span>
                                                                            <span>
                                                                                {startDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} 
                                                                                {endDate ? 
                                                                                    ` - ${endDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}` :
                                                                                    ' - Présent'
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Education */}
                                {formations.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                                                <span className="text-3xl text-white">🎓</span>
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-bold text-gray-900">Formation</h2>
                                                <p className="text-gray-600">{formations.length} formations</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {formations.map((f, idx) => (
                                                <div key={idx} className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:border-green-300 transition-all duration-300 hover:scale-[1.01]">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="w-14 h-14 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                                                            <span className="text-2xl">📚</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-gray-900">{f.diplome}</h3>
                                                            <p className="text-gray-600">{f.etablissement}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {f.domaine && (
                                                            <div className="flex items-center gap-2 text-gray-700">
                                                                <span>🏷️</span>
                                                                <span>{f.domaine}</span>
                                                            </div>
                                                        )}
                                                        {f.annee_obtention && (
                                                            <div className="flex items-center gap-2 text-gray-700">
                                                                <span>📅</span>
                                                                <span>Obtention : {f.annee_obtention}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <footer className="mt-16 pt-12 border-t border-gray-200">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-center md:text-left">
                                <p className="text-gray-700 font-medium">Portfolio créé avec ❤️</p>
                                <p className="text-gray-500 text-sm">PortfolioX • {new Date().getFullYear()}</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <button 
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className="px-6 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:shadow-lg transition"
                                >
                                    ↑ Retour en haut
                                </button>
                                <button 
                                    onClick={() => navigate('/models')}
                                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-purple-500 hover:text-purple-700 transition"
                                >
                                    ← Voir d'autres portfolios
                                </button>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default PortfolioDetail;