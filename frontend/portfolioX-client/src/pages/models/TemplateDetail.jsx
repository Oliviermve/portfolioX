// src/pages/template/TemplateDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../home/blocks/Footer";

// Configuration API
const API_BASE_URL = 'http://localhost:8000';

// Fonction utilitaire améliorée pour les appels API
const fetchApi = async (endpoint, method = 'GET', data = null, isFormData = false) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {};
    
    // Ne pas ajouter Content-Type pour FormData
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem('portfolioX_access_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (data) {
        config.body = isFormData ? data : JSON.stringify(data);
    }

    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Erreur HTTP ${response.status}`;
            
            // Essayer de parser l'erreur JSON
            try {
                const errorJson = JSON.parse(errorText);
                if (Array.isArray(errorJson) && errorJson.length > 0) {
                    errorMessage = errorJson[0];
                } else if (errorJson.detail) {
                    errorMessage = errorJson.detail;
                } else if (errorJson.message) {
                    errorMessage = errorJson.message;
                } else if (typeof errorJson === 'string') {
                    errorMessage = errorJson;
                }
            } catch (e) {
                // Si ce n'est pas du JSON, utiliser le texte original
                if (errorText) {
                    errorMessage = errorText.length > 100 ? errorText.substring(0, 100) + "..." : errorText;
                }
            }
            
            throw new Error(errorMessage);
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

// Fonction pour télécharger une image depuis le frontend vers le backend
const uploadTemplateImage = async (portfolioId, templateImagePath) => {
    try {
        console.log("Tentative de téléchargement de l'image:", templateImagePath);
        
        // Pour les images locales dans public/templates/
        // Nous allons créer un blob à partir de l'image locale
        const response = await fetch(templateImagePath);
        if (!response.ok) {
            console.warn("Impossible de charger l'image locale, utilisation d'une image par défaut");
            return null;
        }
        
        const blob = await response.blob();
        const fileName = `template-${Date.now()}.jpg`;
        
        // Créer un FormData
        const formData = new FormData();
        formData.append('photo_template', blob, fileName);
        
        // Envoyer l'image via une requête PATCH séparée
        const url = `${API_BASE_URL}/api/portfolio/portfolios/${portfolioId}/`;
        
        const headers = {};
        const token = localStorage.getItem('portfolioX_access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        // Note: Pas de Content-Type pour FormData, le navigateur le définit automatiquement
        
        const uploadResponse = await fetch(url, {
            method: 'PATCH',
            headers: headers,
            body: formData
        });
        
        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error("Erreur upload image:", errorText);
            return null;
        }
        
        const result = await uploadResponse.json();
        console.log("Image téléchargée avec succès:", result);
        return result;
        
    } catch (error) {
        console.error("Erreur lors du téléchargement de l'image:", error);
        return null;
    }
};

// Fonction pour obtenir l'URL complète d'une image
const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return `${API_BASE_URL}${imagePath}`;
    return `${API_BASE_URL}/media/${imagePath}`;
};

// Données des modèles avec images locales (stockées dans public/templates/)
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
        title: "Modèle Moderne",
        category: "web developer",
        description: "Design moderne avec effets 3D",
        color: "from-indigo-500 to-purple-500",
        image: "/templates/templates9.jpg"
    },
    {
        id: 10,
        title: "Modèle Professionnel 2",
        category: "Graphiste",
        description: "Design professionnel pour artistes",
        color: "from-teal-500 to-blue-500",
        image: "/templates/templates10.jpg"
    }
];

// Composant ContactItem pour afficher les contacts
const ContactItem = ({ contact }) => {
    if (!contact || typeof contact !== 'object') {
        return null;
    }

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
            default: 
                return <img src="/icons/phone.png" alt="" className="contact-icon" />;
        }
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
                <span className="text-2xl">{getIcon()}</span>
            </div>
            <div className="flex-1">
                <p className="font-semibold text-gray-900">
                    {contact.type_contact === 'telephone' ? 'Téléphone' :
                     contact.type_contact === 'linkedin' ? 'LinkedIn' :
                     contact.type_contact === 'github' ? 'GitHub' :
                     contact.type_contact === 'email' ? 'Email' :
                     contact.type_contact || 'Contact'}
                </p>
                <p className="text-gray-600 text-sm mt-1">{contact.valeur_contact || "Non spécifié"}</p>
            </div>
        </div>
    );
};

// Composant SkillItem pour afficher les compétences
const SkillItem = ({ skill }) => {
    return (
        <div className="group p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-gray-900">{skill.nom_competence}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                            {skill.niveau_competence}
                        </span>
                        {skill.annees_experience > 0 && (
                            <span className="text-xs text-gray-500">
                                {skill.annees_experience} an{skill.annees_experience > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Composant principal TemplateDetail
const TemplateDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingImage, setLoadingImage] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userData, setUserData] = useState(null);
    const [userPortfolioData, setUserPortfolioData] = useState({
        contacts: [],
        competences: [],
        projets: [],
        experiences: [],
        formations: []
    });
    const [hasExistingPortfolio, setHasExistingPortfolio] = useState(false);
    const [existingPortfolioId, setExistingPortfolioId] = useState(null);
    const [existingPortfolio, setExistingPortfolio] = useState(null);

    useEffect(() => {
        const checkAuthAndPortfolio = async () => {
            const token = localStorage.getItem('portfolioX_access_token');
            const storedUser = localStorage.getItem('portfolioX_user');
            
            if (token && storedUser) {
                setIsAuthenticated(true);
                try {
                    const user = JSON.parse(storedUser);
                    setUserData(user);
                    
                    // Vérifier si l'utilisateur a déjà un portfolio
                    await checkExistingPortfolio();
                    
                    // Charger les données utilisateur fraîches
                    try {
                        const userResponse = await fetchApi('/api/auth/profil/');
                        setUserData(userResponse);
                        localStorage.setItem('portfolioX_user', JSON.stringify(userResponse));
                    } catch (err) {
                        console.error("Erreur chargement profil:", err);
                    }
                } catch (e) {
                    console.error("Erreur parsing user data:", e);
                }
            } else {
                setIsAuthenticated(false);
            }
        };
        
        checkAuthAndPortfolio();
        
        // Trouver le template correspondant
        const foundTemplate = templates.find(t => t.id === parseInt(id));
        if (foundTemplate) {
            setTemplate(foundTemplate);
        } else {
            setError("Template non trouvé");
        }
    }, [id]);

    // Vérifier si l'utilisateur a déjà un portfolio
    const checkExistingPortfolio = async () => {
        try {
            const response = await fetchApi('/api/portfolio/portfolios/my_portfolio/');
            
            if (response && (response.id_portfolio || response.id)) {
                setHasExistingPortfolio(true);
                const portfolioId = response.id_portfolio || response.id;
                setExistingPortfolioId(portfolioId);
                setExistingPortfolio(response);
                
                // Charger les données du portfolio existant
                await loadPortfolioData(portfolioId);
            } else {
                setHasExistingPortfolio(false);
            }
        } catch (error) {
            console.error("Erreur vérification portfolio:", error);
            setHasExistingPortfolio(false);
        }
    };

    // Charger les données du portfolio existant
    const loadPortfolioData = async (portfolioId) => {
        try {
            // Contacts
            try {
                const contactsData = await fetchApi(`/api/portfolio/portfolios/${portfolioId}/public-contacts/`);
                if (Array.isArray(contactsData)) {
                    setUserPortfolioData(prev => ({ ...prev, contacts: contactsData.slice(0, 3) }));
                }
            } catch (e) {
                console.log("Aucun contact disponible:", e.message);
            }
            
            // Compétences
            try {
                const competencesData = await fetchApi(`/api/portfolio/portfolios/${portfolioId}/public-competences/`);
                if (Array.isArray(competencesData)) {
                    setUserPortfolioData(prev => ({ ...prev, competences: competencesData.slice(0, 4) }));
                }
            } catch (e) {
                console.log("Aucune compétence disponible:", e.message);
            }
            
            // Projets
            try {
                const projetsData = await fetchApi(`/api/portfolio/portfolios/${portfolioId}/public-projets/`);
                if (Array.isArray(projetsData)) {
                    setUserPortfolioData(prev => ({ ...prev, projets: projetsData.slice(0, 2) }));
                }
            } catch (e) {
                console.log("Aucun projet disponible:", e.message);
            }
            
        } catch (error) {
            console.log("Erreur chargement données portfolio:", error);
        }
    };

    // Fonction pour créer un nouveau portfolio
    const createNewPortfolioFromTemplate = async () => {
        try {
            const templateData = templates.find(t => t.id === parseInt(id));
            
            if (!templateData) {
                throw new Error("Template non trouvé");
            }

            const portfolioData = {
                titre: `${userData?.nom_complet || userData?.username || "Mon"} Portfolio ${templateData.title}`,
                description: userData?.bio || `Portfolio créé avec le modèle ${templateData.title}`,
                titre_professionnel: userData?.titre_professionnel || templateData.category,
                biographie: userData?.bio || "",
                statut: "brouillon",
                theme_couleur: getTemplateThemeColor(templateData.id),
                layout_type: getLayoutType(templateData.category),
                afficher_photo: true,
                afficher_competences: true,
                afficher_projets: true,
                afficher_contacts: true,
                afficher_formations: true,
                afficher_experiences: true
            };

            console.log("Création portfolio avec:", portfolioData);
            const response = await fetchApi('/api/portfolio/portfolios/', 'POST', portfolioData);
            
            if (response.id_portfolio || response.id) {
                const portfolioId = response.id_portfolio || response.id;
                
                // Télécharger l'image du template
                if (templateData.image) {
                    setLoadingImage(true);
                    try {
                        await uploadTemplateImage(portfolioId, templateData.image);
                        console.log("Image du template téléchargée avec succès");
                    } catch (imageError) {
                        console.warn("Erreur téléchargement image:", imageError);
                        // Ne pas bloquer si l'image échoue
                    } finally {
                        setLoadingImage(false);
                    }
                }
                
                // Si l'utilisateur a des données, les ajouter au portfolio
                if (userPortfolioData.contacts.length > 0 || 
                    userPortfolioData.competences.length > 0 || 
                    userPortfolioData.projets.length > 0) {
                    
                    // Créer et ajouter les contacts
                    for (const contact of userPortfolioData.contacts) {
                        try {
                            const newContact = {
                                type_contact: contact.type_contact,
                                valeur_contact: contact.valeur_contact,
                                est_principal: contact.est_principal || false,
                                ordre: contact.ordre || 0
                            };
                            const contactResponse = await fetchApi('/api/portfolio/contacts/', 'POST', newContact);
                            
                            // Ajouter le contact au portfolio
                            if (contactResponse.id_contact) {
                                await fetchApi(
                                    `/api/portfolio/portfolios/${portfolioId}/add-contact/`, 
                                    'POST', 
                                    { contact_id: contactResponse.id_contact }
                                );
                            }
                        } catch (e) {
                            console.error("Erreur création contact:", e);
                        }
                    }
                    
                    // Créer et ajouter les compétences
                    for (const competence of userPortfolioData.competences) {
                        try {
                            const newCompetence = {
                                nom_competence: competence.nom_competence,
                                niveau_competence: competence.niveau_competence,
                                categorie: competence.categorie,
                                annees_experience: competence.annees_experience || 0,
                                description: competence.description || "",
                                est_visible: true,
                                ordre: competence.ordre || 0
                            };
                            const competenceResponse = await fetchApi('/api/portfolio/competences/', 'POST', newCompetence);
                            
                            // Ajouter la compétence au portfolio
                            if (competenceResponse.id_competence) {
                                await fetchApi(
                                    `/api/portfolio/portfolios/${portfolioId}/add-competence/`, 
                                    'POST', 
                                    { competence_id: competenceResponse.id_competence }
                                );
                            }
                        } catch (e) {
                            console.error("Erreur création compétence:", e);
                        }
                    }
                    
                    // Créer et ajouter les projets
                    for (const projet of userPortfolioData.projets) {
                        try {
                            const newProjet = {
                                titre_projet: projet.titre_projet,
                                description_projet: projet.description_projet || "",
                                langage_projet: projet.langage_projet || "Divers",
                                est_public: true,
                                est_termine: projet.est_termine || true,
                                ordre: projet.ordre || 0
                            };
                            const projetResponse = await fetchApi('/api/portfolio/projets/', 'POST', newProjet);
                            
                            // Ajouter le projet au portfolio
                            if (projetResponse.id_projet) {
                                await fetchApi(
                                    `/api/portfolio/portfolios/${portfolioId}/add-projet/`, 
                                    'POST', 
                                    { projet_id: projetResponse.id_projet }
                                );
                            }
                        } catch (e) {
                            console.error("Erreur création projet:", e);
                        }
                    }
                }
                
                return portfolioId;
            } else {
                throw new Error("ID du portfolio non retourné par l'API");
            }
            
        } catch (error) {
            console.error("Erreur création portfolio:", error);
            throw error;
        }
    };

    // Fonction pour mettre à jour le portfolio existant
    const updatePortfolioWithTemplate = async () => {
        if (!existingPortfolioId) {
            throw new Error("ID du portfolio non trouvé");
        }

        try {
            const templateData = templates.find(t => t.id === parseInt(id));
            
            if (!templateData) {
                throw new Error("Template non trouvé");
            }

            // Première étape : mettre à jour les données du portfolio
            const updateData = {
                titre: existingPortfolio?.titre || `${userData?.nom_complet || userData?.username || "Mon"} Portfolio ${templateData.title}`,
                description: existingPortfolio?.description || userData?.bio || "",
                titre_professionnel: existingPortfolio?.titre_professionnel || templateData.category,
                theme_couleur: getTemplateThemeColor(templateData.id),
                layout_type: getLayoutType(templateData.category)
            };

            console.log("Mise à jour portfolio avec:", updateData);
            const response = await fetchApi(
                `/api/portfolio/portfolios/${existingPortfolioId}/`, 
                'PATCH', 
                updateData
            );
            
            // Deuxième étape : télécharger l'image du template
            if (templateData.image) {
                setLoadingImage(true);
                try {
                    await uploadTemplateImage(existingPortfolioId, templateData.image);
                    console.log("Image du template téléchargée avec succès");
                } catch (imageError) {
                    console.warn("Erreur téléchargement image:", imageError);
                    // Ne pas bloquer si l'image échoue
                } finally {
                    setLoadingImage(false);
                }
            }
            
            return response;
        } catch (error) {
            console.error("Erreur mise à jour portfolio:", error);
            throw error;
        }
    };

    // Fonction utilitaire pour obtenir le type de layout
    const getLayoutType = (category) => {
        switch(category.toLowerCase()) {
            case 'web developer':
                return 'moderne';
            case 'web designer':
                return 'creatif';
            case 'graphiste':
                return 'artistique';
            default:
                return 'classique';
        }
    };

    // Fonction pour obtenir la couleur de thème basée sur le template
    const getTemplateThemeColor = (templateId) => {
        const colorMap = {
            1: "#3b82f6", // blue
            2: "#8b5cf6", // purple
            3: "#10b981", // green
            4: "#f97316", // orange
            5: "#6366f1", // indigo
            6: "#0ea5e9", // teal
            7: "#eab308", // yellow
            8: "#ec4899", // pink
            9: "#6366f1", // indigo
            10: "#0ea5e9" // teal
        };
        return colorMap[templateId] || "#3b82f6";
    };

    const handleApplyTemplate = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            if (hasExistingPortfolio && existingPortfolioId) {
                // Mettre à jour le portfolio existant
                await updatePortfolioWithTemplate();
                setSuccess("Template appliqué avec succès à votre portfolio ! L'image a été enregistrée.");
                
                // Rediriger vers l'édition du portfolio
                setTimeout(() => {
                    navigate(`/portfolio/edit/${existingPortfolioId}`);
                }, 1500);
            } else {
                // Créer un nouveau portfolio
                const portfolioId = await createNewPortfolioFromTemplate();
                setSuccess("Portfolio créé avec succès ! L'image du template a été enregistrée. Redirection...");
                
                // Rediriger vers l'édition du nouveau portfolio
                setTimeout(() => {
                    navigate(`/portfolio/edit/${portfolioId}`);
                }, 1500);
            }
        } catch (err) {
            setError(`Erreur: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Obtenir les initiales
    const getInitials = (name) => {
        if (!name || name.trim() === '') return 'U';
        
        const words = name.split(' ');
        if (words.length === 1) {
            return words[0].charAt(0).toUpperCase();
        }
        
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    };

    // Obtenir le texte du bouton principal
    const getMainButtonText = () => {
        if (!isAuthenticated) {
            return "Se connecter pour utiliser";
        }
        
        if (hasExistingPortfolio) {
            return "Appliquer ce template à mon portfolio";
        }
        
        return "Créer un portfolio avec ce template";
    };

    // Obtenir le texte d'information
    const getInfoText = () => {
        if (!isAuthenticated) {
            return "Connectez-vous pour utiliser ce template et personnaliser votre portfolio professionnel.";
        }
        
        if (hasExistingPortfolio) {
            return "Ce template sera appliqué à votre portfolio existant. L'image du template sera enregistrée dans photo_template.";
        }
        
        return "Créez votre premier portfolio avec ce template professionnel. L'image du template sera enregistrée.";
    };

    // Gestionnaire d'erreur pour les images
    const handleImageError = (e, templateData) => {
        e.target.style.display = 'none';
        const fallbackDiv = e.target.parentNode.querySelector('.image-fallback');
        if (fallbackDiv) {
            fallbackDiv.style.display = 'flex';
        }
    };

    if (!template) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Template non trouvé</h2>
                    <button 
                        onClick={() => navigate('/models')}
                        className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                        Retour aux modèles
                    </button>
                </div>
            </div>
        );
    }

    // Obtenir les données utilisateur pour l'affichage
    const displayName = userData?.nom_complet || userData?.username || userData?.email?.split('@')[0] || "Utilisateur";
    const displayTitle = userData?.titre_professionnel || "Professionnel";
    const displayBio = userData?.bio || userData?.description || "";
    const userInitials = getInitials(displayName);
    const userPhotoUrl = userData?.photo_profil ? getImageUrl(userData.photo_profil) : null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <Navbar />
            
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li className="inline-flex items-center">
                                <button
                                    onClick={() => navigate('/models')}
                                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-purple-600 transition"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                                    </svg>
                                    Modèles
                                </button>
                            </li>
                            <li aria-current="page">
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                                        {template.title}
                                    </span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Image du template et détails */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                            <div className="p-4 bg-gray-100">
                                <div className="relative aspect-video rounded-lg overflow-hidden">
                                    <img 
                                        src={template.image} 
                                        alt={template.title}
                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                        onError={(e) => handleImageError(e, template)}
                                    />
                                    {/* Fallback si l'image n'existe pas */}
                                    <div className="image-fallback absolute inset-0 hidden flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8">
                                        <div className="text-5xl mb-4">📁</div>
                                        <div className="text-2xl font-bold text-center">{template.title}</div>
                                        <div className="text-sm mt-2 opacity-90">{template.category}</div>
                                        <div className="text-xs mt-1 opacity-75">Template #{template.id}</div>
                                    </div>
                                    {/* Badge de catégorie */}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-800 text-sm font-semibold rounded-full shadow-sm border border-gray-200">
                                            {template.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h1 className="text-3xl font-bold text-gray-900">{template.title}</h1>
                                        <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full shadow-md">
                                            ID: {template.id}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${template.color} animate-pulse`}></div>
                                        <span className="text-gray-600 font-medium">{template.category}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-500 text-sm">Template premium</span>
                                    </div>

                                    <p className="text-gray-700 text-lg leading-relaxed mb-6 p-4 bg-gray-50 rounded-lg">
                                        {template.description}
                                    </p>
                                    
                                    {/* Note sur l'image du template */}
                                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                                        <div className="flex items-start gap-3">
                                            <div className="text-purple-600 text-xl flex-shrink-0">🖼️</div>
                                            <div>
                                                <p className="text-sm text-purple-800 font-medium mb-1">
                                                    Image du template sera enregistrée
                                                </p>
                                                <p className="text-sm text-purple-700">
                                                    Cette image sera sauvegardée dans votre portfolio comme photo de template.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Caractéristiques */}
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span>✨</span> Caractéristiques du modèle
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-purple-600 shadow-sm">
                                                📱
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">Responsive</p>
                                                <p className="text-sm text-gray-600">Mobile & Desktop</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                                🎨
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">Personnalisable</p>
                                                <p className="text-sm text-gray-600">Couleurs & Sections</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-600 shadow-sm">
                                                ⚡
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">Performance</p>
                                                <p className="text-sm text-gray-600">Optimisé SEO</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-orange-600 shadow-sm">
                                                📊
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">Analytics</p>
                                                <p className="text-sm text-gray-600">Statistiques intégrées</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Aperçu avec données utilisateur */}
                                {isAuthenticated && (
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>👤</span> Aperçu avec vos données
                                        </h3>
                                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                                    {userPhotoUrl ? (
                                                        <img 
                                                            src={userPhotoUrl} 
                                                            alt={displayName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                const avatarDiv = document.createElement('div');
                                                                avatarDiv.className = 'w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-400 to-purple-600 text-white';
                                                                avatarDiv.innerHTML = `<span class="text-xl font-bold">${userInitials}</span>`;
                                                                e.target.parentNode.appendChild(avatarDiv);
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-400 to-purple-600 text-white">
                                                            <span className="text-xl font-bold">{userInitials}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-bold text-gray-900">
                                                        {displayName}
                                                    </h4>
                                                    <p className="text-purple-600 font-medium">
                                                        {displayTitle}
                                                    </p>
                                                    {displayBio && (
                                                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                                                            {displayBio}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Statistiques rapides */}
                                            <div className="grid grid-cols-3 gap-4 mb-6">
                                                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                                    <div className="text-lg font-bold text-purple-600">
                                                        {userPortfolioData.contacts.length}
                                                    </div>
                                                    <div className="text-xs text-gray-600">Contacts</div>
                                                </div>
                                                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                                    <div className="text-lg font-bold text-blue-600">
                                                        {userPortfolioData.competences.length}
                                                    </div>
                                                    <div className="text-xs text-gray-600">Compétences</div>
                                                </div>
                                                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                                                    <div className="text-lg font-bold text-green-600">
                                                        {userPortfolioData.projets.length}
                                                    </div>
                                                    <div className="text-xs text-gray-600">Projets</div>
                                                </div>
                                            </div>
                                            
                                            {/* Message si pas de données */}
                                            {userPortfolioData.contacts.length === 0 && 
                                             userPortfolioData.competences.length === 0 && 
                                             userPortfolioData.projets.length === 0 && (
                                                <div className="text-center py-4 bg-white/50 rounded-lg">
                                                    <div className="text-gray-400 text-2xl mb-2">📝</div>
                                                    <p className="text-gray-600 text-sm">
                                                        Vous n'avez pas encore de données. Elles seront créées dans votre portfolio.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar avec actions et données utilisateur */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span>🚀</span> Actions
                            </h3>

                            {/* Messages d'erreur/succès */}
                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="text-red-500 mr-3">⚠️</div>
                                        <p className="text-red-700">{error}</p>
                                    </div>
                                </div>
                            )}
                            {success && (
                                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="text-green-500 mr-3">✅</div>
                                        <p className="text-green-700">{success}</p>
                                    </div>
                                </div>
                            )}

                            {/* Statut du portfolio */}
                            {isAuthenticated && hasExistingPortfolio && (
                                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="text-blue-600 text-xl">📊</div>
                                        <div>
                                            <p className="text-sm text-blue-800 font-medium mb-1">
                                                Vous avez déjà un portfolio
                                            </p>
                                            <p className="text-sm text-blue-700">
                                                Ce template sera appliqué à votre portfolio existant
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Boutons d'action */}
                            <div className="space-y-4">
                                <button
                                    onClick={isAuthenticated ? handleApplyTemplate : () => navigate('/login')}
                                    disabled={loading || loadingImage}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading || loadingImage ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>
                                                {loadingImage ? "Enregistrement de l'image..." : "Traitement en cours..."}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-3">
                                            <span>
                                                {isAuthenticated ? "🚀" : "🔐"} {getMainButtonText()}
                                            </span>
                                        </div>
                                    )}
                                </button>
                                
                                <button
                                    onClick={() => navigate('/models')}
                                    className="w-full py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:border-gray-400 hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span>←</span>
                                        <span>Voir d'autres modèles</span>
                                    </div>
                                </button>

                                {/* Lien vers le portfolio existant */}
                                {isAuthenticated && hasExistingPortfolio && existingPortfolioId && (
                                    <button
                                        onClick={() => navigate(`/portfolio/edit/${existingPortfolioId}`)}
                                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <span>📝</span>
                                            <span>Éditer mon portfolio actuel</span>
                                        </div>
                                    </button>
                                )}
                            </div>

                            {/* Note importante */}
                            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <div className="flex items-start gap-3">
                                    <div className="text-blue-600 text-xl flex-shrink-0">💡</div>
                                    <div>
                                        <p className="text-sm text-blue-800 font-medium mb-1">Important :</p>
                                        <p className="text-sm text-blue-700">
                                            {getInfoText()}
                                        </p>
                                        {isAuthenticated && (
                                            <p className="text-sm text-blue-600 mt-2">
                                                L'image du template sera enregistrée dans le champ photo_template de votre portfolio.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Données utilisateur existantes */}
                        {isAuthenticated && (
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span>📊</span> Vos données disponibles
                                </h3>
                                
                                {/* Contacts */}
                                {userPortfolioData.contacts.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                            <span>📞</span> Contacts ({userPortfolioData.contacts.length})
                                        </h4>
                                        <div className="space-y-3">
                                            {userPortfolioData.contacts.map((contact, idx) => (
                                                <ContactItem key={idx} contact={contact} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Compétences */}
                                {userPortfolioData.competences.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                            <span>🛠️</span> Compétences ({userPortfolioData.competences.length})
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {userPortfolioData.competences.map((skill, idx) => (
                                                <SkillItem key={idx} skill={skill} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Projets */}
                                {userPortfolioData.projets.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                            <span>🚀</span> Projets ({userPortfolioData.projets.length})
                                        </h4>
                                        <div className="space-y-3">
                                            {userPortfolioData.projets.map((projet, idx) => (
                                                <div key={idx} className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                                                    <p className="font-medium text-gray-900">{projet.titre_projet}</p>
                                                    {projet.langage_projet && (
                                                        <p className="text-xs text-gray-500 mt-1">{projet.langage_projet}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {userPortfolioData.contacts.length === 0 && 
                                 userPortfolioData.competences.length === 0 && 
                                 userPortfolioData.projets.length === 0 && (
                                    <div className="text-center py-4">
                                        <div className="text-gray-400 text-3xl mb-2">📝</div>
                                        <p className="text-gray-600 text-sm">
                                            {hasExistingPortfolio 
                                                ? "Votre portfolio n'a pas encore de données. Ajoutez-en dans l'éditeur."
                                                : "Vous n'avez pas encore de données. Créez-en dans votre portfolio."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Modèles similaires */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>🔗</span> Modèles similaires
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates
                            .filter(t => t.id !== template.id && t.category === template.category)
                            .slice(0, 3)
                            .map(similarTemplate => (
                                <div 
                                    key={similarTemplate.id}
                                    onClick={() => navigate(`/template/${similarTemplate.id}`)}
                                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
                                >
                                    <div className="h-48 overflow-hidden relative">
                                        <img 
                                            src={similarTemplate.image}
                                            alt={similarTemplate.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                const fallbackDiv = document.createElement('div');
                                                fallbackDiv.className = `w-full h-full flex items-center justify-center bg-gradient-to-r ${similarTemplate.color} text-white`;
                                                fallbackDiv.innerHTML = `
                                                    <div class="text-center p-4">
                                                        <div class="text-3xl mb-2">📁</div>
                                                        <div class="font-bold">${similarTemplate.title}</div>
                                                    </div>
                                                `;
                                                e.target.parentNode.appendChild(fallbackDiv);
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-gray-800 mb-2 truncate">{similarTemplate.title}</h4>
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">{similarTemplate.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                                {similarTemplate.category}
                                            </span>
                                            <button className="text-purple-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                                <span>Voir détails</span>
                                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default TemplateDetail;