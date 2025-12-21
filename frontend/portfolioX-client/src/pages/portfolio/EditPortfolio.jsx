// src/pages/portfolio/EditPortfolio.jsx - VERSION COMPLÈTE
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

const API_BASE_URL = 'http://localhost:8000';

// Fonction utilitaire pour les appels API avec token
const fetchApi = async (endpoint, method = 'GET', data = null, isFormData = false) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {};

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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }
      
      const errors = [];
      if (errorData && typeof errorData === 'object') {
        for (const [key, value] of Object.entries(errorData)) {
          if (Array.isArray(value)) {
            errors.push(`${key}: ${value.join(', ')}`);
          } else {
            errors.push(`${key}: ${value}`);
          }
        }
      }
      
      throw new Error(errors.length > 0 ? errors.join(' | ') : `Erreur ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('Erreur API:', error.message);
    throw error;
  }
};

// Composant EditPortfolio - VERSION COMPLÈTE
const EditPortfolio = () => {
  const navigate = useNavigate();
  
  console.log("🔍 EditPortfolio - Chargement automatique du portfolio utilisateur");

  // Vérifier si l'utilisateur est connecté
  const isAuthenticated = () => {
    const token = localStorage.getItem('portfolioX_access_token');
    return !!token;
  };

  // État initial du formulaire
  const initialFormData = {
    titre: "",
    description: "",
    titre_professionnel: "",
    biographie: "",
    photo_profil: null,
    photo_profil_url: "",
    theme_couleur: "#2563eb",
    layout_type: "classique",
    meta_description: "",
    meta_keywords: "",
    afficher_photo: true,
    afficher_competences: true,
    afficher_projets: true,
    afficher_contacts: true,
    afficher_formations: true,
    afficher_experiences: true,
    formations: [],
    experiences: [],
    langues: [],
    certifications: [],
    interets: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  
  // États pour les données existantes
  const [allSkills, setAllSkills] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [allContacts, setAllContacts] = useState([]);

  // États pour les sélections
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);

  // Navigation par étapes
  const [step, setStep] = useState(1);

  // Stocker l'ID du portfolio et les données complètes
  const [portfolioId, setPortfolioId] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // États pour la création de nouveaux éléments
  const [newSkill, setNewSkill] = useState({
    nom_competence: "",
    niveau_competence: "intermediaire",
    categorie: "autres",
    annees_experience: 1,
    description: "",
    est_visible: true,
    ordre: 0
  });

  const [newContact, setNewContact] = useState({
    type_contact: "email",
    valeur_contact: "",
    est_principal: false,
    ordre: 0
  });

  const [newProject, setNewProject] = useState({
    titre_projet: "",
    description_projet: "",
    langage_projet: "",
    lien_projet: "",
    lien_github: "",
    image_projet: null,
    technologies: [],
    date_realisation: new Date().toISOString().split('T')[0],
    est_public: true,
    est_termine: true,
    ordre: 0
  });

  const [showNewSkillForm, setShowNewSkillForm] = useState(false);
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [previewProjectImage, setPreviewProjectImage] = useState(null);

  // Vérifier l'authentification et charger le portfolio
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    loadUserData();
    loadPortfolioData();
  }, [navigate]);

  // Charger les données de l'utilisateur
  const loadUserData = async () => {
    try {
      const userData = await fetchApi('/api/auth/profil/');
      setUserInfo(userData);
    } catch (err) {
      console.error('Erreur chargement profil:', err);
    }
  };

  // Chargement des données du portfolio utilisateur
  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("🔄 Chargement du portfolio utilisateur via /my_portfolio/");

      // 1. Charger le portfolio de l'utilisateur
      const data = await fetchApi('/api/portfolio/portfolios/my_portfolio/');
      
      // Gérer la structure de réponse
      let portfolioData;
      if (Array.isArray(data)) {
        if (data.length === 0) {
          throw new Error("Vous n'avez pas encore créé de portfolio. Créez-en un d'abord.");
        }
        portfolioData = data[0]; // Prendre le premier portfolio
      } else if (data && data.id_portfolio) {
        // Si c'est un objet unique
        portfolioData = data;
      } else if (data && data.results && Array.isArray(data.results)) {
        if (data.results.length === 0) {
          throw new Error("Vous n'avez pas encore créé de portfolio. Créez-en un d'abord.");
        }
        portfolioData = data.results[0];
      } else {
        portfolioData = data;
      }

      console.log("✅ Portfolio chargé:", portfolioData);
      setPortfolioData(portfolioData);

      // Stocker l'ID du portfolio
      if (portfolioData.id_portfolio) {
        setPortfolioId(portfolioData.id_portfolio);
      } else if (portfolioData.id) {
        setPortfolioId(portfolioData.id);
      } else {
        throw new Error("Portfolio invalide: ID non trouvé");
      }

      // 2. Préparer les données pour le formulaire
      const formData = {
        titre: portfolioData.titre || "",
        description: portfolioData.description || "",
        titre_professionnel: portfolioData.titre_professionnel || "",
        biographie: portfolioData.biographie || "",
        photo_profil: null,
        photo_profil_url: portfolioData.photo_profil || "",
        theme_couleur: portfolioData.theme_couleur || "#2563eb",
        layout_type: portfolioData.layout_type || "classique",
        meta_description: portfolioData.meta_description || "",
        meta_keywords: portfolioData.meta_keywords || "",
        afficher_photo: portfolioData.afficher_photo ?? true,
        afficher_competences: portfolioData.afficher_competences ?? true,
        afficher_projets: portfolioData.afficher_projets ?? true,
        afficher_contacts: portfolioData.afficher_contacts ?? true,
        afficher_formations: portfolioData.afficher_formations ?? true,
        afficher_experiences: portfolioData.afficher_experiences ?? true,
        formations: portfolioData.formations || [],
        experiences: portfolioData.experiences || [],
        langues: portfolioData.langues || [],
        certifications: portfolioData.certifications || [],
        interets: portfolioData.interets || [],
      };

      // Mettre à jour le formulaire
      setFormData(formData);
      
      // Préparer la prévisualisation de l'image
      if (portfolioData.photo_profil) {
        const imageUrl = portfolioData.photo_profil.startsWith('http') 
          ? portfolioData.photo_profil 
          : `${API_BASE_URL}${portfolioData.photo_profil.startsWith('/') ? portfolioData.photo_profil : `/media/${portfolioData.photo_profil}`}`;
        setPreviewImage(imageUrl);
      }

      // 3. Charger TOUTES les données de l'utilisateur
      try {
        const skillsResponse = await fetchApi('/api/portfolio/competences/');
        if (Array.isArray(skillsResponse)) {
          setAllSkills(skillsResponse);
        } else if (skillsResponse && skillsResponse.results) {
          setAllSkills(skillsResponse.results);
        } else if (skillsResponse && skillsResponse.detail) {
          console.log("Aucune compétence trouvée:", skillsResponse.detail);
        }
      } catch (err) {
        console.log("Compétences optionnelles:", err.message);
      }

      try {
        const projectsResponse = await fetchApi('/api/portfolio/projets/');
        if (Array.isArray(projectsResponse)) {
          setAllProjects(projectsResponse);
        } else if (projectsResponse && projectsResponse.results) {
          setAllProjects(projectsResponse.results);
        } else if (projectsResponse && projectsResponse.detail) {
          console.log("Aucun projet trouvé:", projectsResponse.detail);
        }
      } catch (err) {
        console.log("Projets optionnels:", err.message);
      }

      try {
        const contactsResponse = await fetchApi('/api/portfolio/contacts/');
        if (Array.isArray(contactsResponse)) {
          setAllContacts(contactsResponse);
        } else if (contactsResponse && contactsResponse.results) {
          setAllContacts(contactsResponse.results);
        } else if (contactsResponse && contactsResponse.detail) {
          console.log("Aucun contact trouvé:", contactsResponse.detail);
        }
      } catch (err) {
        console.log("Contacts optionnels:", err.message);
      }

      // 4. Charger les relations existantes
      if (portfolioData.competences && Array.isArray(portfolioData.competences)) {
        const skillIds = portfolioData.competences.map(skill => skill.id_competence || skill.id);
        setSelectedSkills(skillIds);
      }
      
      if (portfolioData.projets && Array.isArray(portfolioData.projets)) {
        const projectIds = portfolioData.projets.map(project => project.id_projet || project.id);
        setSelectedProjects(projectIds);
      }
      
      if (portfolioData.contacts && Array.isArray(portfolioData.contacts)) {
        const contactIds = portfolioData.contacts.map(contact => contact.id_contact || contact.id);
        setSelectedContacts(contactIds);
      }

      setSuccess("Portfolio chargé avec succès !");
      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      console.error("Erreur chargement:", err);
      setError(err.message || "Erreur lors du chargement du portfolio");
      
      if (err.message.includes('401') || err.message.includes('403')) {
        localStorage.removeItem('portfolioX_access_token');
        localStorage.removeItem('portfolioX_refresh_token');
        localStorage.removeItem('portfolioX_user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Gestion des changements du formulaire principal
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Gestion des nouveaux éléments
  const handleNewSkillChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSkill(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              (type === 'number' ? parseFloat(value) || 0 : value)
    }));
  };

  const handleNewContactChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewContact(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNewProjectChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'technologies') {
      setNewProject(prev => ({
        ...prev,
        technologies: value ? value.split(',').map(t => t.trim()) : []
      }));
    } else {
      setNewProject(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Gestion de l'upload d'image pour projet
  const handleProjectImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewProjectImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      setNewProject(prev => ({
        ...prev,
        image_projet: file
      }));
    }
  };

  // Gestion de l'upload d'image de profil
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      setFormData(prev => ({
        ...prev,
        photo_profil: file,
        photo_profil_url: ""
      }));
    }
  };

  // Gestion des sélections
  const handleSkillToggle = (skillId) => {
    setSelectedSkills(prev => {
      const newIds = prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId];
      return newIds;
    });
  };

  const handleProjectToggle = (projectId) => {
    setSelectedProjects(prev => {
      const newIds = prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId];
      return newIds;
    });
  };

  const handleContactToggle = (contactId) => {
    setSelectedContacts(prev => {
      const newIds = prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId];
      return newIds;
    });
  };

  // Créer une nouvelle compétence
  const handleCreateSkill = async () => {
    if (!newSkill.nom_competence.trim()) {
      setError("Le nom de la compétence est requis");
      return;
    }

    try {
      const skillData = {
        nom_competence: newSkill.nom_competence.trim(),
        niveau_competence: newSkill.niveau_competence || "intermediaire",
        categorie: newSkill.categorie || "autres",
        annees_experience: newSkill.annees_experience || null,
        description: newSkill.description.trim() || "",
        est_visible: newSkill.est_visible,
        ordre: newSkill.ordre || 0
      };

      const response = await fetchApi('/api/portfolio/competences/', 'POST', skillData);
      
      setAllSkills(prev => [...prev, response]);
      
      const skillId = response.id_competence || response.id;
      setSelectedSkills(prev => [...prev, skillId]);
      
      setNewSkill({
        nom_competence: "",
        niveau_competence: "intermediaire",
        categorie: "autres",
        annees_experience: 1,
        description: "",
        est_visible: true,
        ordre: 0
      });
      setShowNewSkillForm(false);
      setSuccess("Compétence créée avec succès !");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Créer un nouveau contact
  const handleCreateContact = async () => {
    if (!newContact.type_contact || !newContact.valeur_contact.trim()) {
      setError("Le type et la valeur du contact sont requis");
      return;
    }

    try {
      const contactData = {
        type_contact: newContact.type_contact,
        valeur_contact: newContact.valeur_contact.trim(),
        est_principal: newContact.est_principal,
        ordre: newContact.ordre || 0
      };

      const response = await fetchApi('/api/portfolio/contacts/', 'POST', contactData);
      
      setAllContacts(prev => [...prev, response]);
      
      const contactId = response.id_contact || response.id;
      setSelectedContacts(prev => [...prev, contactId]);
      
      setNewContact({
        type_contact: "email",
        valeur_contact: "",
        est_principal: false,
        ordre: 0
      });
      setShowNewContactForm(false);
      setSuccess("Contact créé avec succès !");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Créer un nouveau projet
  const handleCreateProject = async () => {
    if (!newProject.titre_projet.trim()) {
      setError("Le titre du projet est requis");
      return;
    }

    try {
      // Créer FormData pour supporter l'envoi de fichier
      const formData = new FormData();
      formData.append('titre_projet', newProject.titre_projet.trim());
      formData.append('description_projet', newProject.description_projet.trim() || "");
      formData.append('langage_projet', newProject.langage_projet || "");
      formData.append('lien_projet', newProject.lien_projet || "");
      formData.append('lien_github', newProject.lien_github || "");
      formData.append('est_public', newProject.est_public);
      formData.append('est_termine', newProject.est_termine);
      formData.append('ordre', newProject.ordre || 0);
      
      if (newProject.technologies && newProject.technologies.length > 0) {
        formData.append('technologies', JSON.stringify(newProject.technologies));
      }
      
      if (newProject.date_realisation) {
        formData.append('date_realisation', newProject.date_realisation);
      }
      
      // Ajouter l'image si elle existe
      if (newProject.image_projet) {
        formData.append('image_projet', newProject.image_projet);
      }

      // Utiliser fetch directement pour FormData
      const token = localStorage.getItem('portfolioX_access_token');
      const response = await fetch(`${API_BASE_URL}/api/portfolio/projets/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const result = await response.json();
      
      setAllProjects(prev => [...prev, result]);
      
      const projectId = result.id_projet || result.id;
      setSelectedProjects(prev => [...prev, projectId]);
      
      // Réinitialiser le formulaire
      setNewProject({
        titre_projet: "",
        description_projet: "",
        langage_projet: "",
        lien_projet: "",
        lien_github: "",
        image_projet: null,
        technologies: [],
        date_realisation: new Date().toISOString().split('T')[0],
        est_public: true,
        est_termine: true,
        ordre: 0
      });
      
      setPreviewProjectImage(null);
      setShowNewProjectForm(false);
      setSuccess("Projet créé avec succès !");
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (err) {
      setError(err.message);
    }
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!portfolioId) {
      setError("Impossible de sauvegarder: Portfolio non trouvé");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (!formData.titre.trim()) {
        throw new Error("Le titre est requis");
      }

      if (!formData.titre_professionnel.trim()) {
        throw new Error("Le titre professionnel est requis");
      }

      // Préparer les données selon le format de l'API
      const portfolioData = {
        titre: formData.titre.trim(),
        titre_professionnel: formData.titre_professionnel.trim(),
        description: formData.description.trim() || "",
        biographie: formData.biographie.trim() || "",
        theme_couleur: formData.theme_couleur,
        layout_type: formData.layout_type,
        meta_description: formData.meta_description.trim() || "",
        meta_keywords: formData.meta_keywords.trim() || "",
        afficher_photo: formData.afficher_photo,
        afficher_competences: formData.afficher_competences,
        afficher_projets: formData.afficher_projets,
        afficher_contacts: formData.afficher_contacts,
        afficher_formations: formData.afficher_formations,
        afficher_experiences: formData.afficher_experiences,
        formations: formData.formations,
        experiences: formData.experiences,
        langues: formData.langues,
        certifications: formData.certifications,
        interets: formData.interets,
        contacts_ids: selectedContacts,
        competences_ids: selectedSkills,
        projets_ids: selectedProjects
      };

      console.log("💾 Sauvegarde du portfolio ID:", portfolioId);
      console.log("📤 Données envoyées:", portfolioData);

      // Gérer l'upload d'image si nécessaire
      if (formData.photo_profil) {
        const formDataObj = new FormData();
        Object.keys(portfolioData).forEach(key => {
          if (Array.isArray(portfolioData[key])) {
            formDataObj.append(key, JSON.stringify(portfolioData[key]));
          } else {
            formDataObj.append(key, portfolioData[key]);
          }
        });
        formDataObj.append('photo_profil', formData.photo_profil);

        await fetchApi(`/api/portfolio/portfolios/${portfolioId}/`, 'PATCH', formDataObj, true);
      } else {
        // Pas de nouvelle image, utiliser PATCH normal
        await fetchApi(`/api/portfolio/portfolios/${portfolioId}/`, 'PATCH', portfolioData);
      }

      setSuccess("Modifications sauvegardées avec succès !");
      
      // Recharger les données
      loadPortfolioData();
      
    } catch (err) {
      setError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // Publier/dépublier
  const handleTogglePublish = async () => {
    if (!portfolioId) {
      setError("Impossible de publier: Portfolio non trouvé");
      return;
    }

    setPublishing(true);
    setError("");
    
    try {
      const newStatus = portfolioData?.statut === 'publie' ? 'brouillon' : 'publie';
      
      console.log("📢 Changement de statut:", newStatus);
      
      await fetchApi(`/api/portfolio/portfolios/${portfolioId}/publish/`, 'POST', {
        statut: newStatus
      });
      
      // Recharger les données
      loadPortfolioData();
      
      setSuccess(`Portfolio ${newStatus === 'publie' ? 'publié' : 'repassé en brouillon'} !`);
      
    } catch (err) {
      setError(err.message || "Erreur lors de la publication");
    } finally {
      setPublishing(false);
    }
  };

  // Navigation simple entre sections
  const goToSection = (sectionNumber) => {
    setStep(sectionNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Créer un nouveau portfolio si aucun n'existe
  const handleCreateNewPortfolio = async () => {
    try {
      setLoading(true);
      
      const newPortfolio = await fetchApi('/api/portfolio/portfolios/', 'POST', {
        titre: "Mon Portfolio",
        titre_professionnel: "Développeur",
        description: "Mon nouveau portfolio"
      });
      
      console.log("✅ Portfolio créé:", newPortfolio);
      
      // Recharger les données
      loadPortfolioData();
      
    } catch (err) {
      setError("Erreur lors de la création du portfolio: " + err.message);
      setLoading(false);
    }
  };

  if (!isAuthenticated()) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </div>
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 border-4 border-gray-200 rounded-full"></div>
              <div className="w-24 h-24 border-4 border-t-purple-600 border-r-purple-600 border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Chargement du portfolio...</h3>
            <p className="text-gray-600">Récupération de vos données</p>
          </div>
        </div>
      </div>
    );
  }

  // Si aucun portfolio n'existe
  if (error && error.includes("pas encore créé")) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </div>
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6">
              <div className="w-32 h-32 mx-auto bg-purple-100 rounded-full flex items-center justify-center text-5xl mb-4">
                📝
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Aucun portfolio</h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleCreateNewPortfolio}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium shadow"
              >
                + Créer mon premier portfolio
              </button>
              <button
                onClick={() => navigate('/models')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium"
              >
                ← Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si erreur autre
  if (error && !portfolioId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </div>
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6">
              <div className="w-32 h-32 mx-auto bg-red-100 rounded-full flex items-center justify-center text-5xl mb-4">
                ⚠️
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Erreur de chargement</h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/models')}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium shadow"
              >
                ← Retour aux portfolios
              </button>
              <button
                onClick={loadPortfolioData}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium"
              >
                🔄 Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fonctions pour le rendu des étapes
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-800">Informations de base</h3>
        <p className="text-sm text-gray-500">Modifiez les informations principales de votre portfolio</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre du portfolio *
          </label>
          <input
            type="text"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Ex: Portfolio Développeur Web"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre professionnel *
          </label>
          <input
            type="text"
            name="titre_professionnel"
            value={formData.titre_professionnel}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Ex: Développeur Full Stack"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description courte
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="2"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Décrivez brièvement votre portfolio..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/200 caractères
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Biographie complète
          </label>
          <textarea
            name="biographie"
            value={formData.biographie}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Racontez votre parcours professionnel..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.biographie.length}/1500 caractères
          </p>
        </div>
      </div>

      {/* Photo de profil */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Photo de profil
        </label>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow">
              {previewImage ? (
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : formData.photo_profil_url ? (
                <img 
                  src={`${API_BASE_URL}${formData.photo_profil_url}`} 
                  alt="Current" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div class="w-full h-full bg-purple-500 flex items-center justify-center">
                        <span class="text-white text-3xl">👤</span>
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-purple-500 flex items-center justify-center">
                  <span className="text-white text-3xl">👤</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <input
              type="file"
              id="photo_profil"
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <label
              htmlFor="photo_profil"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium shadow cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Changer la photo
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Recommandé: 400×400 pixels, format JPG, PNG ou WebP
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-800">Personnalisation</h3>
        <p className="text-sm text-gray-500">Personnalisez l'apparence de votre portfolio</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thème de couleur
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="color"
              name="theme_couleur"
              value={formData.theme_couleur}
              onChange={handleChange}
              className="w-16 h-16 cursor-pointer rounded-lg border border-gray-300"
            />
            <div>
              <div className="text-sm font-medium text-gray-700">Couleur sélectionnée</div>
              <div className="text-sm font-mono bg-gray-100 px-3 py-1 rounded mt-1">
                {formData.theme_couleur}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de layout
          </label>
          <select
            name="layout_type"
            value={formData.layout_type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="classique">🎨 Classique</option>
            <option value="minimaliste">⚫ Minimaliste</option>
            <option value="creatif">✨ Créatif</option>
            <option value="professionnel">💼 Professionnel</option>
            <option value="moderne">🚀 Moderne</option>
            <option value="standard">📋 Standard</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-md font-medium text-gray-700 mb-3">
          Éléments à afficher
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { name: 'afficher_photo', label: 'Photo', icon: '👤' },
            { name: 'afficher_competences', label: 'Compétences', icon: '💪' },
            { name: 'afficher_projets', label: 'Projets', icon: '🚀' },
            { name: 'afficher_contacts', label: 'Contacts', icon: '📞' },
            { name: 'afficher_formations', label: 'Formations', icon: '🎓' },
            { name: 'afficher_experiences', label: 'Expériences', icon: '💼' },
          ].map((item) => (
            <label key={item.name} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                name={item.name}
                checked={formData[item.name]}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="ml-3 text-sm font-medium text-gray-700 flex items-center">
                <span className="text-lg mr-2">{item.icon}</span>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-gray-800">Contenu du portfolio</h3>
        <p className="text-sm text-gray-500">Sélectionnez et gérez votre contenu</p>
      </div>

      {/* Section création rapide */}
      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
        <h4 className="font-bold text-gray-800 mb-3">Ajouter du contenu</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setShowNewSkillForm(true)}
            className="p-3 bg-white border border-purple-200 rounded-lg"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg mr-3">
                💡
              </div>
              <div>
                <div className="font-bold text-gray-800">Nouvelle compétence</div>
                <div className="text-xs text-gray-500">Ajouter une compétence</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowNewContactForm(true)}
            className="p-3 bg-white border border-blue-200 rounded-lg"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg mr-3">
                📞
              </div>
              <div>
                <div className="font-bold text-gray-800">Nouveau contact</div>
                <div className="text-xs text-gray-500">Ajouter un contact</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowNewProjectForm(true)}
            className="p-3 bg-white border border-green-200 rounded-lg"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg mr-3">
                🛠️
              </div>
              <div>
                <div className="font-bold text-gray-800">Nouveau projet</div>
                <div className="text-xs text-gray-500">Ajouter un projet</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Compétences */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-800">Compétences ({selectedSkills.length} sélectionnées)</h4>
          <button
            onClick={() => setShowNewSkillForm(true)}
            className="text-sm text-purple-600 font-medium"
          >
            + Ajouter
          </button>
        </div>
        
        {allSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allSkills.map(skill => {
              const skillId = skill.id_competence || skill.id;
              const isSelected = selectedSkills.includes(skillId);
              
              return (
                <div
                  key={skillId}
                  onClick={() => handleSkillToggle(skillId)}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800">{skill.nom_competence || skill.nom}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Niveau: {skill.niveau_competence === 'debutant' ? 'Débutant' :
                                skill.niveau_competence === 'intermediaire' ? 'Intermédiaire' :
                                skill.niveau_competence === 'avance' ? 'Avancé' : 'Expert'}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && '✓'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
            <div className="text-gray-400 text-4xl mb-3">💡</div>
            <p className="text-gray-600">Aucune compétence disponible</p>
            <button
              onClick={() => setShowNewSkillForm(true)}
              className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg"
            >
              Créer une compétence
            </button>
          </div>
        )}
      </div>

      {/* Projets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-800">Projets ({selectedProjects.length} sélectionnés)</h4>
          <button
            onClick={() => setShowNewProjectForm(true)}
            className="text-sm text-green-600 font-medium"
          >
            + Ajouter
          </button>
        </div>
        
        {allProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allProjects.map(project => {
              const projectId = project.id_projet || project.id;
              const isSelected = selectedProjects.includes(projectId);
              
              return (
                <div
                  key={projectId}
                  onClick={() => handleProjectToggle(projectId)}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    isSelected
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{project.titre_projet || project.titre}</div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {project.description_projet || project.description}
                      </p>
                      {project.langage_projet && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {project.langage_projet}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`ml-4 w-5 h-5 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && '✓'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
            <div className="text-gray-400 text-4xl mb-3">🛠️</div>
            <p className="text-gray-600">Aucun projet disponible</p>
            <button
              onClick={() => setShowNewProjectForm(true)}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              Créer un projet
            </button>
          </div>
        )}
      </div>

      {/* Contacts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-800">Contacts ({selectedContacts.length} sélectionnés)</h4>
          <button
            onClick={() => setShowNewContactForm(true)}
            className="text-sm text-blue-600 font-medium"
          >
            + Ajouter
          </button>
        </div>
        
        {allContacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allContacts.map(contact => {
              const contactId = contact.id_contact || contact.id;
              const isSelected = selectedContacts.includes(contactId);
              
              return (
                <div
                  key={contactId}
                  onClick={() => handleContactToggle(contactId)}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800">
                        {contact.type_contact === 'telephone' ? 'Téléphone' :
                         contact.type_contact === 'linkedin' ? 'LinkedIn' :
                         contact.type_contact === 'github' ? 'GitHub' :
                         contact.type_contact === 'twitter' ? 'Twitter' :
                         contact.type_contact === 'email' ? 'Email' :
                         contact.type_contact}
                      </div>
                      <div className="text-sm text-gray-600 mt-1 truncate">
                        {contact.valeur_contact || contact.valeur}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && '✓'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
            <div className="text-gray-400 text-4xl mb-3">📞</div>
            <p className="text-gray-600">Aucun contact disponible</p>
            <button
              onClick={() => setShowNewContactForm(true)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Créer un contact
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-800">Publication et SEO</h3>
        <p className="text-sm text-gray-500">Optimisez votre visibilité</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Meta Description (SEO)
        </label>
        <textarea
          name="meta_description"
          value={formData.meta_description}
          onChange={handleChange}
          rows="2"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Décrivez votre portfolio pour les moteurs de recherche..."
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.meta_description.length}/160 caractères (idéal pour Google)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mots-clés (SEO)
        </label>
        <input
          type="text"
          name="meta_keywords"
          value={formData.meta_keywords}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="développeur, portfolio, web, javascript, react..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Séparez les mots-clés par des virgules
        </p>
      </div>

      {/* Statut et statistiques */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <h4 className="font-bold text-gray-800 mb-3">Statut et statistiques</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Statut actuel:</span>
            <span className={`font-bold ${
              portfolioData?.statut === 'publie' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {portfolioData?.statut === 'publie' ? 'PUBLIÉ' : 'BROUILLON'}
            </span>
          </div>
          
          {portfolioData?.date_creation && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Créé le:</span>
              <span className="font-medium">{formatDate(portfolioData.date_creation)}</span>
            </div>
          )}
          
          {portfolioData?.date_modification && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Dernière modification:</span>
              <span className="font-medium">{formatDate(portfolioData.date_modification)}</span>
            </div>
          )}
          
          {portfolioData?.vue_count !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Nombre de vues:</span>
              <span className="font-bold text-purple-600">{portfolioData.vue_count}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Modales pour créer de nouveaux éléments
  const renderNewSkillModal = () => (
    showNewSkillForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">Nouvelle compétence</h3>
              <button
                onClick={() => setShowNewSkillForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la compétence *
                </label>
                <input
                  type="text"
                  name="nom_competence"
                  value={newSkill.nom_competence}
                  onChange={handleNewSkillChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: React, Python, UX Design..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau
                </label>
                <select
                  name="niveau_competence"
                  value={newSkill.niveau_competence}
                  onChange={handleNewSkillChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="debutant">Débutant</option>
                  <option value="intermediaire">Intermédiaire</option>
                  <option value="avance">Avancé</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  name="categorie"
                  value={newSkill.categorie}
                  onChange={handleNewSkillChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="mobile">Mobile</option>
                  <option value="base_donnees">Base de données</option>
                  <option value="devops">DevOps</option>
                  <option value="design">Design</option>
                  <option value="autres">Autres</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newSkill.description}
                  onChange={handleNewSkillChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Décrivez votre expérience avec cette compétence..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewSkillForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateSkill}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderNewContactModal = () => (
    showNewContactForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">Nouveau contact</h3>
              <button
                onClick={() => setShowNewContactForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de contact *
                </label>
                <select
                  name="type_contact"
                  value={newContact.type_contact}
                  onChange={handleNewContactChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="email">Email</option>
                  <option value="telephone">Téléphone</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="github">GitHub</option>
                  <option value="twitter">Twitter</option>
                  <option value="site_web">Site Web</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valeur du contact *
                </label>
                <input
                  type="text"
                  name="valeur_contact"
                  value={newContact.valeur_contact}
                  onChange={handleNewContactChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder={
                    newContact.type_contact === 'email' ? 'exemple@email.com' :
                    newContact.type_contact === 'telephone' ? '+33 1 23 45 67 89' :
                    newContact.type_contact === 'linkedin' ? 'https://linkedin.com/in/votrenom' :
                    newContact.type_contact === 'github' ? 'https://github.com/votrenom' :
                    newContact.type_contact === 'twitter' ? 'https://twitter.com/votrenom' :
                    'https://votresite.com'
                  }
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="est_principal"
                  checked={newContact.est_principal}
                  onChange={handleNewContactChange}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Marquer comme contact principal
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewContactForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateContact}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderNewProjectModal = () => (
    showNewProjectForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">Nouveau projet</h3>
              <button
                onClick={() => setShowNewProjectForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre du projet *
                  </label>
                  <input
                    type="text"
                    name="titre_projet"
                    value={newProject.titre_projet}
                    onChange={handleNewProjectChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: Application E-commerce"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Langage/Technologie principale
                  </label>
                  <input
                    type="text"
                    name="langage_projet"
                    value={newProject.langage_projet}
                    onChange={handleNewProjectChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: React, Python, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lien du projet
                  </label>
                  <input
                    type="url"
                    name="lien_projet"
                    value={newProject.lien_projet}
                    onChange={handleNewProjectChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://votre-projet.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lien GitHub
                  </label>
                  <input
                    type="url"
                    name="lien_github"
                    value={newProject.lien_github}
                    onChange={handleNewProjectChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://github.com/votre-projet"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description_projet"
                    value={newProject.description_projet}
                    onChange={handleNewProjectChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Décrivez votre projet..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technologies utilisées
                  </label>
                  <input
                    type="text"
                    name="technologies"
                    value={newProject.technologies.join(', ')}
                    onChange={handleNewProjectChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="React, Node.js, MongoDB, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">Séparez par des virgules</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image du projet
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProjectImageChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  {previewProjectImage && (
                    <div className="mt-2">
                      <img src={previewProjectImage} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewProjectForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // Rendu normal si tout est OK
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-40">
          <Navbar />
        </div>

        <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          {/* En-tête principal */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => navigate('/models')}
                  className="flex items-center space-x-2 text-gray-600 mb-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                  </svg>
                  <span className="text-sm font-medium">Retour aux portfolios</span>
                </button>
                
                <div className="flex items-center space-x-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                      Modifier mon portfolio
                    </h1>
                    <p className="text-gray-500 mt-2">
                      {userInfo?.nom_complet && `Bonjour ${userInfo.nom_complet} ! `}

                    </p>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">
                    Statut: <span className={`font-bold ${portfolioData?.statut === 'publie' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {portfolioData?.statut === 'publie' ? 'PUBLIÉ' : 'BROUILLON'}
                    </span>
                  </p>
                  {portfolioData?.vue_count !== undefined && (
                    <p className="text-xs text-gray-500">
                      {portfolioData.vue_count} vue{portfolioData.vue_count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation rapide */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {[
                { id: 1, label: '📝 Infos de base', icon: '📝' },
                { id: 2, label: '🎨 Personnalisation', icon: '🎨' },
                { id: 3, label: '📦 Contenu', icon: '📦' },
                { id: 4, label: '⚙️ Paramètres', icon: '⚙️' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToSection(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
                    step === item.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages d'erreur et succès */}
          <div className="mb-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Carte principale du formulaire */}
          <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
            {/* En-tête de la carte */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-800">
                    {step === 1 && 'Informations de base'}
                    {step === 2 && 'Personnalisation du design'}
                    {step === 3 && 'Sélection du contenu'}
                    {step === 4 && 'Publication et SEO'}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {step === 1 && 'Modifiez les informations principales de votre portfolio'}
                    {step === 2 && 'Personnalisez l\'apparence et les éléments visibles'}
                    {step === 3 && 'Gérez vos compétences, projets et contacts'}
                    {step === 4 && 'Configurez le SEO et le statut de publication'}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                    Étape {step}/4
                  </span>
                </div>
              </div>
            </div>

            {/* Contenu du formulaire */}
            <div className="px-6 py-6">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </div>

            {/* Barre d'actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                <div className="flex space-x-2">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => goToSection(step - 1)}
                      className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                      </svg>
                      Précédent
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={() => goToSection(step + 1)}
                      className="flex items-center px-5 py-2.5 bg-purple-600 text-white rounded-lg font-bold text-sm"
                    >
                      <span className="flex items-center">
                        Suivant
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </span>
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleTogglePublish}
                        disabled={publishing}
                        className={`px-5 py-2.5 rounded-lg font-bold ${
                          portfolioData?.statut === 'publie'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-green-500 text-white'
                        }`}
                      >
                        {publishing ? '...' : portfolioData?.statut === 'publie' ? '📤 Dépublier' : '🚀 Publier'}
                      </button>
                      
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-bold shadow disabled:opacity-50"
                      >
                        {saving ? 'Sauvegarde en cours...' : '💾 Sauvegarder'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu en temps réel */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-800 text-lg flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  Aperçu de votre portfolio
                </h3>
                <p className="text-gray-500 text-sm">Visualisez votre portfolio tel qu'il apparaîtra</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                Live Preview
              </span>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="flex items-start space-x-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-4 border-white shadow">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : formData.photo_profil_url ? (
                      <img 
                        src={`${API_BASE_URL}${formData.photo_profil_url}`} 
                        alt="Current" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-purple-500 flex items-center justify-center">
                        <span className="text-white text-3xl">👤</span>
                      </div>
                    )}
                  </div>
                  {formData.afficher_photo && (
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Informations */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 text-xl mb-1">
                        {formData.titre || "Mon Portfolio"}
                      </h4>
                      <p className="text-lg font-medium text-purple-600">
                        {formData.titre_professionnel || "Titre professionnel"}
                      </p>
                    </div>
                    <div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        portfolioData?.statut === 'publie' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {portfolioData?.statut === 'publie' ? 'PUBLIÉ' : 'BROUILLON'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {(formData.description || formData.biographie) && (
                    <p className="text-gray-600 mt-3 line-clamp-2">
                      {formData.description || formData.biographie}
                    </p>
                  )}
                  
                  {/* Métriques */}
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    {formData.afficher_competences && selectedSkills.length > 0 && (
                      <div className="flex items-center space-x-2 text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <span className="text-gray-500">💪</span>
                        <span className="font-medium">{selectedSkills.length} compétence{selectedSkills.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    
                    {formData.afficher_projets && selectedProjects.length > 0 && (
                      <div className="flex items-center space-x-2 text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <span className="text-gray-500">🚀</span>
                        <span className="font-medium">{selectedProjects.length} projet{selectedProjects.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    
                    {formData.afficher_contacts && selectedContacts.length > 0 && (
                      <div className="flex items-center space-x-2 text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <span className="text-gray-500">📞</span>
                        <span className="font-medium">{selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Couleur du thème */}
                  <div className="flex items-center space-x-3 mt-4">
                    <span className="text-sm text-gray-600">Couleur principale:</span>
                    <div 
                      className="w-6 h-6 rounded-md border border-gray-300"
                      style={{ backgroundColor: formData.theme_couleur }}
                    ></div>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{formData.theme_couleur}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>PortfolioX • Modifiez librement votre portfolio professionnel</p>
            <p className="text-xs mt-1">

              Utilisateur: <span className="font-medium">{userInfo?.nom_complet || userInfo?.email}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Modales */}
      {renderNewSkillModal()}
      {renderNewContactModal()}
      {renderNewProjectModal()}
    </>
  );
};

export default EditPortfolio;