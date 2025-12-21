// src/pages/portfolio/Portfolio.jsx - VERSION RÉDUITE DE 20%
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

// Configuration API
const API_BASE_URL = 'http://localhost:8000';

// Fonction utilitaire améliorée avec debugging
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

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
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

// Composant Portfolio avec UX/UI amélioré
const Create_portfolio = () => {
  
  const navigate = useNavigate();
  
  // État initial du formulaire
  const initialFormData = {
    titre: "",
    description: "",
    titre_professionnel: "",
    biographie: "",
    photo_profil: null,
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
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [step, setStep] = useState(1);
  const [userPortfolios, setUserPortfolios] = useState([]);
  const [createdPortfolioId, setCreatedPortfolioId] = useState(null);
  const [portfolioCreated, setPortfolioCreated] = useState(false);

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

  // Animation states
  const [animateStep, setAnimateStep] = useState("");

  // Récupérer les données de l'utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('portfolioX_access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Récupérer les compétences
        const skillsResponse = await fetchApi('/api/portfolio/competences/');
        if (skillsResponse && Array.isArray(skillsResponse)) {
          setSkills(skillsResponse);
        }

        // Récupérer les projets
        const projectsResponse = await fetchApi('/api/portfolio/projets/');
        if (projectsResponse && Array.isArray(projectsResponse)) {
          setProjects(projectsResponse);
        }

        // Récupérer les contacts
        const contactsResponse = await fetchApi('/api/portfolio/contacts/');
        if (contactsResponse && Array.isArray(contactsResponse)) {
          setContacts(contactsResponse);
        }

        // Récupérer les portfolios de l'utilisateur
        try {
          const portfoliosResponse = await fetchApi('/api/auth/portfolios/');
          if (portfoliosResponse && Array.isArray(portfoliosResponse)) {
            setUserPortfolios(portfoliosResponse);
          }
        } catch (portfolioError) {
          console.log("Portfolios non disponibles:", portfolioError.message);
        }

      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        if (err.message.includes('401') || err.message.includes('403')) {
          localStorage.removeItem('portfolioX_access_token');
          localStorage.removeItem('portfolioX_refresh_token');
          localStorage.removeItem('portfolioX_user');
          navigate('/login');
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  // Gestion des changements des inputs
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
      
      setSkills(prev => [...prev, response]);
      
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
      
      setContacts(prev => [...prev, response]);
      
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
      
      setProjects(prev => [...prev, result]);
      
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

  // Gestion de l'upload d'image
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
        photo_profil: file
      }));
    }
  };

  // Gestion des compétences sélectionnées
  const handleSkillToggle = (skillId) => {
    setSelectedSkills(prev => {
      const newSkills = prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId];
      
      return newSkills;
    });
  };

  // Gestion des projets sélectionnés
  const handleProjectToggle = (projectId) => {
    setSelectedProjects(prev => {
      const newProjects = prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId];
      
      return newProjects;
    });
  };

  // Gestion des contacts sélectionnés
  const handleContactToggle = (contactId) => {
    setSelectedContacts(prev => {
      const newContacts = prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId];
      
      return newContacts;
    });
  };

  // Soumission du formulaire principal
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!formData.titre.trim()) {
        throw new Error("Le titre est requis");
      }

      if (!formData.titre_professionnel.trim()) {
        throw new Error("Le titre professionnel est requis");
      }

      // Toujours créer en statut "brouillon"
      const portfolioData = {
        titre: formData.titre.trim(),
        description: formData.description.trim() || "",
        titre_professionnel: formData.titre_professionnel.trim(),
        biographie: formData.biographie.trim() || "",
        statut: "brouillon",
        theme_couleur: formData.theme_couleur || "#2563eb",
        layout_type: formData.layout_type || "classique",
        meta_description: formData.meta_description.trim() || "",
        meta_keywords: formData.meta_keywords.trim() || "",
        afficher_photo: formData.afficher_photo,
        afficher_competences: formData.afficher_competences,
        afficher_projets: formData.afficher_projets,
        afficher_contacts: formData.afficher_contacts,
        afficher_formations: formData.afficher_formations,
        afficher_experiences: formData.afficher_experiences,
        formations: formData.formations || [],
        experiences: formData.experiences || [],
        langues: formData.langues || [],
        certifications: formData.certifications || [],
        interets: formData.interets || [],
        contacts_ids: selectedContacts,
        competences_ids: selectedSkills,
        projets_ids: selectedProjects
      };

      const response = await fetchApi('/api/portfolio/portfolios/', 'POST', portfolioData);
      
      // Stocker l'ID du portfolio créé
      const portfolioId = response.id_portfolio || response.id;
      setCreatedPortfolioId(portfolioId);
      setPortfolioCreated(true);
      
      setSuccess("Portfolio créé avec succès en tant que brouillon !");
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Publier le portfolio
  const handlePublishPortfolio = async () => {
    if (!createdPortfolioId) {
      setError("Aucun portfolio à publier. Veuillez d'abord créer le portfolio.");
      return;
    }

    setPublishing(true);
    setError("");
    
    try {
      await fetchApi(`/api/portfolio/portfolios/${createdPortfolioId}/publish/`, 'POST', {
        statut: 'publie'
      });
      
      setSuccess("Portfolio publié avec succès !");
      
      // Rediriger vers la page des modèles après un délai
      setTimeout(() => {
        navigate('/models');
      }, 1500);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  // Sauvegarder comme brouillon
  const handleSaveDraft = async () => {
    setLoading(true);
    setError("");
    
    try {
      const draftData = {
        titre: formData.titre.trim() || "Portfolio sans titre",
        titre_professionnel: formData.titre_professionnel.trim() || "Professionnel",
        statut: "brouillon",
        contacts_ids: selectedContacts,
        competences_ids: selectedSkills,
        projets_ids: selectedProjects
      };

      await fetchApi('/api/portfolio/portfolios/', 'POST', draftData);
      setSuccess("Brouillon sauvegardé !");
      
      setTimeout(() => {
        navigate('/models');
      }, 1500);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Navigation entre étapes avec animation
  const goToNextStep = () => {
    if (step === 1) {
      if (!formData.titre.trim()) {
        setError("Le titre est requis");
        return;
      }
      if (!formData.titre_professionnel.trim()) {
        setError("Le titre professionnel est requis");
        return;
      }
    }
    
    if (step === 3 && (selectedSkills.length === 0 && selectedProjects.length === 0 && selectedContacts.length === 0)) {
      setError("Veuillez créer et sélectionner au moins une compétence, un projet ou un contact avant de continuer");
      return;
    }
    
    setError("");
    setAnimateStep("next");
    setTimeout(() => {
      setStep(prev => Math.min(prev + 1, 4));
      setAnimateStep("");
    }, 300);
  };

  const goToPrevStep = () => {
    setError("");
    setAnimateStep("prev");
    setTimeout(() => {
      setStep(prev => Math.max(prev - 1, 1));
      setAnimateStep("");
    }, 300);
  };

  const goToStep = (stepNumber) => {
    if (stepNumber < step) {
      setError("");
      setAnimateStep("prev");
      setTimeout(() => {
        setStep(stepNumber);
        setAnimateStep("");
      }, 300);
    }
  };

  // RENDER STEP 1
  const renderStep1 = () => (
    <div className={`space-y-4 transition-all duration-300 ${animateStep ? 'opacity-0 transform translate-x-8' : 'opacity-100'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Informations de base</h3>
          <p className="text-xs text-gray-500">Commencez par les informations essentielles</p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {userPortfolios.length} portfolio{userPortfolios.length !== 1 ? 's' : ''} existant{userPortfolios.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 mb-1.5 items-center gap-0.5">
            Titre du portfolio
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/15 focus:border-purple-500 transition-all duration-200 text-sm"
              placeholder="Ex: Portfolio Développeur Frontend"
              required
            />
            <div className="absolute right-2.5 top-2.5 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </div>
          </div>
        </div>
 
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 mb-1.5 items-center gap-0.5">
            Titre professionnel
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <input
              type="text" 
              name="titre_professionnel"
              value={formData.titre_professionnel}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/15 focus:border-purple-500 transition-all duration-200 text-sm"
              placeholder="Ex: Développeur Full Stack"
              required
            />
            <div className="absolute right-2.5 top-2.5 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Description courte
            <span className="text-xs text-gray-500 ml-1.5">(visible dans les listes)</span>
          </label>
          <div className="relative">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/15 focus:border-purple-500 transition-all duration-200 resize-none text-sm"
              placeholder="Décrivez brièvement votre spécialité et votre valeur ajoutée..."
            />
            <div className="absolute bottom-2.5 right-2.5 text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded">
              {formData.description.length}/200
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Biographie complète
            <span className="text-xs text-gray-500 ml-1.5">(votre histoire professionnelle)</span>
          </label>
          <div className="relative">
            <textarea
              name="biographie"
              value={formData.biographie}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/15 focus:border-purple-500 transition-all duration-200 resize-none text-sm"
              placeholder="Racontez votre parcours, vos passions, vos réalisations et vos ambitions..."
            />
            <div className="absolute bottom-2.5 right-2.5 text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded">
              {formData.biographie.length}/1500
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // RENDER STEP 2
  const renderStep2 = () => (
    <div className={`space-y-4 transition-all duration-300 ${animateStep ? 'opacity-0 transform translate-x-8' : 'opacity-100'}`}>
      <div>
        <h3 className="text-lg font-bold text-gray-800">Personnalisation</h3>
        <p className="text-xs text-gray-500">Donnez du style à votre portfolio</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Thème de couleur
          </label>
          <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
            <input
              type="color"
              name="theme_couleur"
              value={formData.theme_couleur}
              onChange={handleChange}
              className="w-10 h-10 cursor-pointer rounded-md border border-gray-300 shadow-sm hover:scale-105 transition-transform"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-medium text-gray-700 text-sm">Couleur principale</span>
                <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{formData.theme_couleur}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-gradient-to-r from-gray-100 to-gray-200">
                <div className="h-full rounded-full" style={{ backgroundColor: formData.theme_couleur, width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Type de layout
          </label>
          <div className="relative">
            <select
              name="layout_type"
              value={formData.layout_type}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/15 focus:border-purple-500 transition-all duration-200 appearance-none bg-white text-sm"
            >
              <option value="classique">🎨 Classique</option>
              <option value="minimaliste">⚫ Minimaliste</option>
              <option value="creatif">✨ Créatif</option>
              <option value="professionnel">💼 Professionnel</option>
              <option value="moderne">🚀 Moderne</option>
              <option value="standard">📋 Standard</option>
            </select>
            <div className="absolute right-2.5 top-2.5 text-gray-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Photo de profil
          </label>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6 p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
            <div className="relative group">
              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white shadow-lg transition-all duration-300 group-hover:scale-105">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
                    <span className="text-white text-4xl opacity-80">👤</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transform translate-y-1.5 group-hover:translate-y-0 transition-all duration-300">
                    <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-md">
                      Cliquer pour changer
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
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
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="photo_profil"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 cursor-pointer font-medium text-sm shadow-md hover:shadow-lg active:scale-95"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Choisir une photo
                  </label>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-600">
                    Recommandations :
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1 list-none">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></div>
                      Taille : 400×400 pixels minimum
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></div>
                      Format : JPG, PNG, ou WebP
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></div>
                      Fond neutre ou harmonieux
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></div>
                      Visage bien visible et professionnel
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700">
            Éléments à afficher
          </label>
          <p className="text-xs text-gray-500">Sélectionnez les sections à inclure dans votre portfolio</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { name: 'afficher_photo', label: 'Photo', icon: '👤' },
            { name: 'afficher_competences', label: 'Compétences', icon: '💪' },
            { name: 'afficher_projets', label: 'Projets', icon: '🚀' },
            { name: 'afficher_contacts', label: 'Contacts', icon: '📞' },
            { name: 'afficher_formations', label: 'Formations', icon: '🎓' },
            { name: 'afficher_experiences', label: 'Expériences', icon: '💼' },
          ].map((item) => {
            const isChecked = formData[item.name];
            
            return (
              <label key={item.name} className="relative group">
                <input
                  type="checkbox"
                  name={item.name}
                  checked={isChecked}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className={`flex flex-col items-center p-2.5 border rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.03] hover:shadow-md
                  ${isChecked ? 'border-purple-500 bg-gradient-to-b from-white to-gray-50' : 'border-gray-200 bg-white'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg mb-2 transition-colors
                    ${isChecked ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-semibold text-gray-800 text-center mb-1.5">{item.label}</span>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200
                    ${isChecked ? 'border-purple-500 bg-purple-500 shadow-inner' : 'border-gray-300'}`}>
                    {isChecked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                </div>
                <div className={`absolute -top-1 -right-1 w-4 h-4 bg-white border border-gray-200 rounded-full flex items-center justify-center transition-colors
                  ${isChecked ? 'bg-green-500 border-green-500' : ''}`}>
                  {isChecked ? (
                    <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  // RENDER STEP 3
  const renderStep3 = () => (
    <div className={`space-y-6 transition-all duration-300 ${animateStep ? 'opacity-0 transform translate-x-8' : 'opacity-100'}`}>
      <div>
        <h3 className="text-lg font-bold text-gray-800">Contenu du portfolio</h3>
        <p className="text-xs text-gray-500">Sélectionnez et organisez votre contenu</p>
      </div>
      
      {/* Création rapide d'éléments */}
      <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 p-4 rounded-xl border border-purple-200/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-gray-800">Créez rapidement des éléments</h4>
            <p className="text-xs text-gray-600">
              Ajoutez du contenu avant de pouvoir le sélectionner pour votre portfolio.
            </p>
          </div>
          <div className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            ⚠️ IMPORTANT
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              label: "Nouvelle compétence",
              desc: "Ajouter une compétence",
              icon: "💡",
              color: "purple",
              onClick: () => setShowNewSkillForm(true)
            },
            {
              label: "Nouveau contact",
              desc: "Ajouter un contact",
              icon: "📞",
              color: "blue",
              onClick: () => setShowNewContactForm(true)
            },
            {
              label: "Nouveau projet",
              desc: "Ajouter un projet",
              icon: "🛠️",
              color: "green",
              onClick: () => setShowNewProjectForm(true)
            }
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="group relative overflow-hidden"
            >
              <div className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                <div className={`w-10 h-10 rounded-full bg-${item.color}-100 flex items-center justify-center text-lg mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                  {item.icon}
                </div>
                <span className="font-bold text-gray-800 text-xs">{item.label}</span>
                <span className="text-xs text-gray-500 mt-0.5">{item.desc}</span>
                <div className="mt-2 w-6 h-0.5 rounded-full bg-gray-200 group-hover:bg-purple-500 transition-colors"></div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Compétences existantes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-gray-800">Compétences</h4>
            <p className="text-xs text-gray-500">Sélectionnez les compétences à afficher</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {selectedSkills.length} sélectionnée{selectedSkills.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={() => setShowNewSkillForm(true)}
              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
            >
              + Ajouter
            </button>
          </div>
        </div>
        
        {skills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {skills.map(skill => {
              const skillId = skill.id_competence || skill.id;
              const isSelected = selectedSkills.includes(skillId);
              
              return (
                <div
                  key={skillId}
                  className={`group relative overflow-hidden rounded-lg border cursor-pointer transition-all duration-300 transform hover:scale-[1.02]
                    ${isSelected
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-white shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  onClick={() => handleSkillToggle(skillId)}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors
                          ${isSelected
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-100 text-gray-500 group-hover:bg-purple-50'
                          }`}>
                          <span className="text-lg">💡</span>
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-800 text-sm">{skill.nom_competence || skill.nom}</h5>
                          {skill.categorie && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                              {skill.categorie === 'autres' ? 'Autres' : 
                               skill.categorie === 'base_donnees' ? 'Base de données' :
                               skill.categorie.charAt(0).toUpperCase() + skill.categorie.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all
                        ${isSelected
                          ? 'border-purple-500 bg-purple-500 text-white scale-110'
                          : 'border-gray-300 group-hover:border-purple-300'
                        }`}>
                        {isSelected && '✓'}
                      </div>
                    </div>
                    
                    {skill.description && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{skill.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500
                              ${isSelected
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500'
                              }`}
                            style={{ 
                              width: skill.niveau_competence === 'debutant' ? '25%' :
                                     skill.niveau_competence === 'intermediaire' ? '50%' :
                                     skill.niveau_competence === 'avance' ? '75%' : '100%'
                            }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {skill.niveau_competence === 'debutant' ? 'Débutant' :
                           skill.niveau_competence === 'intermediaire' ? 'Intermédiaire' :
                           skill.niveau_competence === 'avance' ? 'Avancé' : 'Expert'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-dashed border-gray-200">
            <div className="text-gray-400 text-4xl mb-3">💡</div>
            <p className="text-gray-600 mb-2 font-medium text-sm">Aucune compétence disponible</p>
            <p className="text-gray-500 text-xs mb-4">Commencez par créer votre première compétence</p>
            <button
              type="button"
              onClick={() => setShowNewSkillForm(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-md hover:from-purple-700 hover:to-purple-800 transition-all text-sm"
            >
              Créer une compétence
            </button>
          </div>
        )}
      </div>

      {/* Projets existants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-gray-800">Projets</h4>
            <p className="text-xs text-gray-500">Sélectionnez les projets à présenter</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {selectedProjects.length} sélectionné{selectedProjects.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={() => setShowNewProjectForm(true)}
              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
            >
              + Ajouter
            </button>
          </div>
        </div>
        
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => {
              const projectId = project.id_projet || project.id;
              const isSelected = selectedProjects.includes(projectId);
              
              return (
                <div
                  key={projectId}
                  className={`group relative overflow-hidden rounded-lg border cursor-pointer transition-all duration-300
                    ${isSelected
                      ? 'border-purple-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  onClick={() => handleProjectToggle(projectId)}
                >
                  <div className={`h-1 transition-colors
                    ${isSelected
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                      : 'bg-gradient-to-r from-gray-300 to-gray-400'
                    }`}></div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="font-bold text-gray-800 text-sm">
                        {project.titre_projet || project.titre}
                      </h5>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full
                          ${project.est_termine
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {project.est_termine ? 'Terminé' : 'En cours'}
                        </span>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all
                          ${isSelected
                            ? 'border-purple-500 bg-purple-500 text-white scale-110'
                            : 'border-gray-300 group-hover:border-purple-300'
                          }`}>
                          {isSelected && '✓'}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                      {project.description_projet || project.description}
                    </p>
                    
                    {project.langage_projet && (
                      <div className="mb-3">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                          <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                          </svg>
                          {project.langage_projet}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        {project.date_realisation && new Date(project.date_realisation).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-dashed border-gray-200">
            <div className="text-gray-400 text-4xl mb-3">🛠️</div>
            <p className="text-gray-600 mb-2 font-medium text-sm">Aucun projet disponible</p>
            <p className="text-gray-500 text-xs mb-4">Montrez vos réalisations en créant votre premier projet</p>
            <button
              type="button"
              onClick={() => setShowNewProjectForm(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md hover:from-green-700 hover:to-green-800 transition-all text-sm"
            >
              Créer un projet
            </button>
          </div>
        )}
      </div>

      {/* Contacts existants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-gray-800">Contacts</h4>
            <p className="text-xs text-gray-500">Sélectionnez les moyens de contact</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {selectedContacts.length} sélectionné{selectedContacts.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={() => setShowNewContactForm(true)}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              + Ajouter
            </button>
          </div>
        </div>
        
        {contacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contacts.map(contact => {
              const contactId = contact.id_contact || contact.id;
              const isSelected = selectedContacts.includes(contactId);
              
              const getIcon = (type) => {
                switch (type?.toLowerCase()) {
                  case 'email': return '✉️';
                  case 'telephone': return '📱';
                  case 'linkedin': return '💼';
                  case 'github': return '💻';
                  case 'twitter': return '🐦';
                  default: return '📌';
                }
              };
              
              return (
                <div
                  key={contactId}
                  className={`group relative overflow-hidden rounded-lg border cursor-pointer transition-all duration-300
                    ${isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  onClick={() => handleContactToggle(contactId)}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors
                          ${isSelected
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-100 text-gray-500 group-hover:bg-purple-50'
                          }`}>
                          {getIcon(contact.type_contact || contact.type)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">
                            {contact.type_contact === 'telephone' ? 'Téléphone' :
                             contact.type_contact === 'linkedin' ? 'LinkedIn' :
                             contact.type_contact === 'github' ? 'GitHub' :
                             contact.type_contact === 'twitter' ? 'Twitter' :
                             contact.type_contact === 'email' ? 'Email' :
                             contact.type_contact || contact.type || 'Contact'}
                          </p>
                          <p className="text-xs text-gray-600 truncate max-w-[150px]">
                            {contact.valeur_contact || contact.valeur}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all
                        ${isSelected
                          ? 'border-purple-500 bg-purple-500 text-white scale-110'
                          : 'border-gray-300 group-hover:border-purple-300'
                        }`}>
                        {isSelected && '✓'}
                      </div>
                    </div>
                    
                    {contact.est_principal && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 rounded-md border border-yellow-200">
                          <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Contact principal
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-dashed border-gray-200">
            <div className="text-gray-400 text-4xl mb-3">📞</div>
            <p className="text-gray-600 mb-2 font-medium text-sm">Aucun contact disponible</p>
            <p className="text-gray-500 text-xs mb-4">Ajoutez vos moyens de contact pour être joignable</p>
            <button
              type="button"
              onClick={() => setShowNewContactForm(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-all text-sm"
            >
              Créer un contact
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // RENDER STEP 4
  const renderStep4 = () => (
    <div className={`space-y-6 transition-all duration-300 ${animateStep ? 'opacity-0 transform translate-x-8' : 'opacity-100'} bg-violet-50/50 p-4 rounded-xl border border-violet-200`}>
      <div>
        <h3 className="text-lg font-bold text-gray-800">Publication et SEO</h3>
        <p className="text-xs text-gray-500">Optimisez votre visibilité et publiez</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Meta Description (SEO)
          </label>
          <div className="relative">
            <textarea
              name="meta_description"
              value={formData.meta_description}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/15 focus:border-purple-500 transition-all duration-200 resize-none text-sm"
              placeholder="Décrivez votre portfolio pour les moteurs de recherche..."
            />
            <div className="absolute bottom-2.5 right-2.5">
              <div className={`text-xs px-1.5 py-0.5 rounded ${formData.meta_description.length <= 160 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {formData.meta_description.length}/160
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Idéal pour le référencement Google (160 caractères maximum recommandé)
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">
            Mots-clés (SEO)
          </label>
          <div className="relative">
            <input
              type="text"
              name="meta_keywords"
              value={formData.meta_keywords}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/15 focus:border-purple-500 transition-all duration-200 text-sm"
              placeholder="développeur, portfolio, web, javascript, react, design"
            />
            <div className="absolute right-2.5 top-2.5 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Séparez les mots-clés par des virgules pour une meilleure indexation
          </p>
        </div>

        {/* Section Publication */}
        {portfolioCreated && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-lg mr-3">
                🎉
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 text-sm mb-1.5">Portfolio créé avec succès !</h4>
                <p className="text-gray-600 text-xs">
                  Votre portfolio a été créé en tant que <span className="font-bold text-yellow-600">brouillon</span>.
                  Vous pouvez maintenant le publier pour le rendre visible.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={handlePublishPortfolio}
                disabled={publishing}
                className="group relative overflow-hidden flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-bold shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 text-sm"
              >
                <div className="relative z-10 flex items-center justify-center">
                  {publishing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Publication...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Publier maintenant
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/models')}
                className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium hover:border-gray-400 active:scale-95 text-sm"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                  Retour aux portfolios
                </div>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-green-200/50">
              <span className="font-medium">Note :</span> Une fois publié, votre portfolio sera visible publiquement sur la plateforme.
              Vous pourrez toujours le modifier ou le repasser en brouillon ultérieurement.
            </p>
          </div>
        )}

        {/* Aperçu des données */}
        <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200">
          <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Récapitulatif de votre portfolio
          </h4>
          <div className="space-y-2">
            {[
              { label: 'Titre', value: formData.titre || "Non défini", icon: '📝' },
              { label: 'Profession', value: formData.titre_professionnel || "Non défini", icon: '💼' },
              { label: 'Compétences', value: selectedSkills.length, icon: '💪' },
              { label: 'Projets', value: selectedProjects.length, icon: '🚀' },
              { label: 'Contacts', value: selectedContacts.length, icon: '📞' },
              { label: 'Éléments visibles', value: [
                  formData.afficher_photo && "Photo",
                  formData.afficher_competences && "Compétences",
                  formData.afficher_projets && "Projets",
                  formData.afficher_contacts && "Contacts",
                  formData.afficher_formations && "Formations",
                  formData.afficher_experiences && "Expériences",
                ].filter(Boolean).length, icon: '👁️' },
              { label: 'Layout', value: formData.layout_type, icon: '🎨' },
              { label: 'Couleur', value: formData.theme_couleur, icon: '🎨' },
              { label: 'Statut', value: portfolioCreated ? "Brouillon (prêt à publier)" : "En création", icon: '📊', color: portfolioCreated ? "text-yellow-600" : "text-gray-600" }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center">
                    <span className="text-xs">{item.icon}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-700">{item.label}</span>
                </div>
                <span className={`text-xs font-bold ${item.color || 'text-gray-800'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-violet-200 to-yellow-100">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      <div className="max-w-6xl mx-auto pt-20 pb-8 px-3 sm:px-4 lg:px-6">
        {/* Sidebar pour navigation rapide (mobile/desktop) */}
        <div className="fixed left-2 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-2">
            <div className="space-y-1.5">
              {[1, 2, 3, 4].map((stepNumber) => (
                <button
                  key={stepNumber}
                  onClick={() => goToStep(stepNumber)}
                  className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                    ${step === stepNumber
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md scale-105'
                      : step > stepNumber
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  {step > stepNumber ? '✓' : stepNumber}
                  {step === stepNumber && (
                    <div className="absolute -right-0.5 -top-0.5 w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* En-tête principal */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/models')}
                className="group flex items-center space-x-1.5 text-gray-600 hover:text-purple-600 transition mb-2 text-sm"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                <span className="text-xs font-medium">Retour aux modèles</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                    Créer un nouveau portfolio
                  </h1>
                  <p className="text-gray-500 text-xs mt-1">
                    Personnalisez chaque détail de votre portfolio professionnel
                  </p>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center space-x-2">
              <div className="text-right">
                <p className="text-xs font-medium text-gray-700">Progression</p>
                <p className="text-xs text-gray-500">Étape {step} sur 4</p>
              </div>
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                  <span className="text-sm">👤</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border border-white flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateur d'étapes amélioré */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            {[
              { number: 1, label: 'Infos', icon: '📝', description: 'Base' },
              { number: 2, label: 'Design', icon: '🎨', description: 'Style' },
              { number: 3, label: 'Contenu', icon: '📦', description: 'Sélection' },
              { number: 4, label: 'Publication', icon: '🚀', description: 'Final' }
            ].map(({ number, label, icon, description }) => (
              <button
                key={number}
                onClick={() => goToStep(number)}
                className={`flex flex-col items-center relative flex-1 max-w-32 ${number <= step ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {number > 1 && (
                  <div className={`absolute left-0 top-4 w-1/2 h-0.5 transition-all duration-500 ${
                    step >= number ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-300'
                  }`}></div>
                )}
                {number < 4 && (
                  <div className={`absolute right-0 top-4 w-1/2 h-0.5 transition-all duration-500 ${
                    step > number ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gray-300'
                  }`}></div>
                )}
                
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold mb-2 relative z-10 transition-all duration-500 transform
                  ${step === number 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md scale-105 ring-2 ring-purple-200' 
                    : step > number 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm' 
                    : 'bg-white text-gray-400 border border-gray-200'
                  }`}>
                  {step > number ? '✓' : icon}
                </div>
                
                <div className="text-center">
                  <span className={`block text-xs font-bold transition-colors ${
                    step >= number ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                  <span className={`block text-xs transition-colors ${
                    step >= number ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {description}
                  </span>
                </div>
              </button>
            ))}
          </div>
          
          {/* Barre de progression améliorée */}
          <div className="h-2 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 transition-all duration-700 ease-out rounded-full"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-xs font-medium text-gray-600">
              Étape {step} sur 4
            </span>
            <span className="text-xs font-bold text-purple-600">
              {Math.round(((step - 1) / 3) * 100)}% complété
            </span>
          </div>
        </div>

        {/* Message d'information */}
        {step === 3 && (selectedSkills.length === 0 || selectedProjects.length === 0) && (
          <div className="mb-4 animate-fadeIn">
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                    ⚠️
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-yellow-800">
                    <span className="font-bold">Important :</span> Pour créer un portfolio, vous devez sélectionner au moins <span className="font-bold">une compétence et un projet</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Carte principale du formulaire */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 transform transition-all duration-300 hover:shadow-lg">
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
                <p className="text-gray-500 text-xs">
                  {step === 1 && 'Définissez les informations principales de votre portfolio'}
                  {step === 2 && 'Personnalisez l\'apparence et les éléments visibles'}
                  {step === 3 && 'Sélectionnez les compétences, projets et contacts à afficher'}
                  {step === 4 && 'Configurez le SEO et publiez votre portfolio'}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...initialFormData,
                      titre: "Portfolio Développeur Web",
                      titre_professionnel: "Développeur Full Stack",
                      description: "Création d'applications web modernes et performantes",
                      biographie: "Passionné par le développement web avec 5 ans d'expérience...",
                      layout_type: "moderne",
                      theme_couleur: "#2563eb"
                    });
                    setSuccess("Exemple chargé ! Modifiez les informations selon vos besoins.");
                  }}
                  className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-md hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 border border-blue-200"
                >
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    Charger un exemple
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Messages d'erreur et succès */}
          <div className="px-6 pt-4">
            {error && (
              <div className="mb-4 animate-fadeIn">
                <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 animate-fadeIn">
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-green-800">{success}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
         
          {/* Formulaire */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 pb-6">
              {/* Étape actuelle */}
              <div className="mb-6 min-h-[300px]">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
              </div>
            </div>

            {/* Barre d'actions */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                <div className="flex space-x-2">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={goToPrevStep}
                      className="group px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium flex items-center hover:border-gray-400 active:scale-95 text-sm"
                    >
                      <svg className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                      </svg>
                      Précédent
                    </button>
                  )}
                  
                  {step === 4 && !portfolioCreated && (
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={loading}
                      className="px-4 py-2 border border-yellow-400 text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-all duration-300 font-medium flex items-center disabled:opacity-50 hover:border-yellow-500 active:scale-95 text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                      </svg>
                      Sauvegarder brouillon
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="group relative overflow-hidden px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-md transition-all duration-300 font-bold shadow-sm hover:from-purple-700 hover:to-purple-800 active:scale-95 text-sm"
                    >
                      <span className="relative z-10 flex items-center">
                        Continuer
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    </button>
                  ) : !portfolioCreated ? (
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative overflow-hidden px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-md transition-all duration-300 font-bold shadow-sm hover:from-purple-700 hover:to-purple-800 active:scale-95 disabled:opacity-50 text-sm"
                    >
                      <span className="relative z-10 flex items-center">
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Création...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Créer le portfolio (brouillon)
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Aperçu en temps réel */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 transform transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800 text-sm flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                Aperçu en direct
              </h3>
              <p className="text-xs text-gray-500">Mise à jour automatique de votre portfolio</p>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
              Live Preview
            </span>
          </div>
          
          <div className="border border-gray-100 rounded-lg p-4 bg-gradient-to-br from-gray-50/50 to-white">
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-md transition-all duration-300 group-hover:scale-105">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-2xl opacity-90">P</span>
                    </div>
                  )}
                </div>
                {formData.afficher_photo && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border border-white shadow-sm flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Informations */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-800 text-base mb-1">
                      {formData.titre || "Mon Portfolio"}
                    </h4>
                    <p className="text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                      {formData.titre_professionnel || "Titre professionnel"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                      Brouillon
                    </span>
                  </div>
                </div>
                
                {/* Description */}
                {(formData.description || formData.biographie) && (
                  <p className="text-gray-600 text-xs mt-2 line-clamp-2">
                    {formData.description || formData.biographie}
                  </p>
                )}
                
                {/* Métriques */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {formData.afficher_competences && selectedSkills.length > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                      <span className="text-gray-500">💪</span>
                      <span>{selectedSkills.length} compétence{selectedSkills.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  
                  {formData.afficher_projets && selectedProjects.length > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                      <span className="text-gray-500">🚀</span>
                      <span>{selectedProjects.length} projet{selectedProjects.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  
                  {formData.afficher_contacts && selectedContacts.length > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                      <span className="text-gray-500">📞</span>
                      <span>{selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                
                {/* Couleur du thème */}
                <div className="flex items-center space-x-1.5 mt-3">
                  <span className="text-xs text-gray-500">Couleur :</span>
                  <div 
                    className="w-5 h-5 rounded-md border border-gray-300 shadow-sm"
                    style={{ backgroundColor: formData.theme_couleur }}
                  ></div>
                  <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{formData.theme_couleur}</span>
                </div>
              </div>
            </div>
            
            {/* Layout preview */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Layout : {formData.layout_type}</span>
                <span className="text-xs text-gray-500">Vue aperçu</span>
              </div>
              
              <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg p-3 border border-gray-200">
                <div className="flex space-x-2">
                  {/* Sections simulées */}
                  {formData.afficher_photo && (
                    <div className="w-12 h-12 rounded-lg bg-purple-200 flex items-center justify-center">
                      <span className="text-purple-600 text-xs font-medium">Photo</span>
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-1.5">
                    {formData.afficher_competences && (
                      <div className="h-2 bg-gradient-to-r from-purple-400 to-purple-300 rounded-full w-3/4 animate-pulse"></div>
                    )}
                    {formData.afficher_projets && (
                      <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-300 rounded-full w-1/2 animate-pulse delay-75"></div>
                    )}
                    {formData.afficher_contacts && (
                      <div className="h-2 bg-gradient-to-r from-green-400 to-green-300 rounded-full w-2/3 animate-pulse delay-150"></div>
                    )}
                    {(formData.afficher_formations || formData.afficher_experiences) && (
                      <div className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-5/6 animate-pulse delay-300"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="text-center py-4 border-t border-gray-200/50">
          <div className="flex flex-col lg:flex-row justify-between items-center text-gray-500 text-xs gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-r from-purple-100 to-purple-50 flex items-center justify-center">
                <span className="text-purple-600">🛡️</span>
              </div>
              <p>Vos données sont sécurisées et chiffrées</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium">PortfolioX v1.0</span>
              <div className="w-0.5 h-0.5 bg-gray-300 rounded-full"></div>
              <span>API: {API_BASE_URL}</span>
              <div className="w-0.5 h-0.5 bg-gray-300 rounded-full"></div>
              <span className="font-bold text-purple-600">Étape {step}/4</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-r from-blue-100 to-blue-50 flex items-center justify-center">
                <span className="text-blue-600">💡</span>
              </div>
              <p>Conseil : Remplissez tous les champs pour un portfolio complet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Style pour les animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Create_portfolio;