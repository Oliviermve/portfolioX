// src/pages/portfolio/Portfolio.jsx - VERSION MODIFIÉE
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

// Composant Portfolio modifié
const Create_portfolio = () => {
  
  const navigate = useNavigate();
  
  // État initial du formulaire
  const initialFormData = {
    titre: "",
    description: "",
    titre_professionnel: "",
    biographie: "",
    photo_profil: null,
    // Le statut est toujours "brouillon" par défaut
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
          // NE PAS mettre Content-Type pour FormData
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
        statut: "brouillon", // Toujours brouillon par défaut
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

  // RENDER STEP 1
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">Informations de base</h3>
        <span className="text-sm text-gray-500">
          {userPortfolios.length} portfolio{userPortfolios.length !== 1 ? 's' : ''} existant{userPortfolios.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre du portfolio *
          </label>
          <input
            type="text"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="Ex: Portfolio Développeur Frontend"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre professionnel *
          </label>
          <input
            type="text"
            name="titre_professionnel"
            value={formData.titre_professionnel}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="Ex: Développeur Full Stack"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description courte
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="Décrivez brièvement votre portfolio (visible dans les listes)..."
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.description.length}/200 caractères
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Biographie complète
          </label>
          <textarea
            name="biographie"
            value={formData.biographie}
            onChange={handleChange}
            rows="5"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="Racontez votre parcours professionnel, vos passions, vos valeurs..."
          />
        </div>
      </div>
    </div>
  );

  // RENDER STEP 2
  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Personnalisation</h3>
      
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
              className="w-14 h-14 cursor-pointer rounded-lg border border-gray-300 shadow-sm"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-700">Couleur principale</span>
                <span className="text-sm text-gray-500 font-mono">{formData.theme_couleur}</span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: formData.theme_couleur }}></div>
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          >
            <option value="classique">Classique</option>
            <option value="minimaliste">Minimaliste</option>
            <option value="creatif">Créatif</option>
            <option value="professionnel">Professionnel</option>
            <option value="moderne">Moderne</option>
            <option value="standard">Standard</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo de profil
          </label>
          <div className="flex items-center space-x-8">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
              {previewImage ? (
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
                  <span className="text-white text-5xl">👤</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                <span className="text-white text-sm font-medium">Cliquez pour changer</span>
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
                <label
                  htmlFor="photo_profil"
                  className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition cursor-pointer font-medium shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  Choisir une photo
                </label>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Recommandations :</span>
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
                    <li>Taille : 400×400 pixels minimum</li>
                    <li>Format : JPG, PNG, ou WebP</li>
                    <li>Fond neutre ou harmonieux</li>
                    <li>Visage bien visible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Éléments à afficher
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'afficher_photo', label: '📸 Photo', icon: '👤' },
            { name: 'afficher_competences', label: '🛠️ Compétences', icon: '💪' },
            { name: 'afficher_projets', label: '🚀 Projets', icon: '📂' },
            { name: 'afficher_contacts', label: '📞 Contacts', icon: '📱' },
            { name: 'afficher_formations', label: '🎓 Formations', icon: '📚' },
            { name: 'afficher_experiences', label: '💼 Expériences', icon: '🏢' },
          ].map((item) => (
            <label key={item.name} className="relative group">
              <input
                type="checkbox"
                name={item.name}
                checked={formData[item.name]}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200
                peer-checked:border-purple-500 peer-checked:bg-purple-50
                hover:border-purple-300 hover:shadow-md group-hover:scale-105">
                <span className="text-2xl mb-2">{item.icon}</span>
                <span className="text-sm font-medium text-gray-700 text-center">{item.label}</span>
                <div className="mt-2 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center
                  peer-checked:bg-purple-500 peer-checked:border-purple-500">
                  {formData[item.name] && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  // RENDER STEP 3
  const renderStep3 = () => (
    <div className="space-y-12">
      <h3 className="text-xl font-semibold text-gray-800">Contenu du portfolio</h3>
      
      {/* Création rapide d'éléments */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
        <h4 className="text-lg font-medium text-gray-800 mb-4">Créez rapidement des éléments</h4>
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-bold text-red-500">⚠️ IMPORTANT :</span> Créez vos éléments ici avant de pouvoir les sélectionner pour votre portfolio.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setShowNewSkillForm(true)}
            className="flex flex-col items-center p-4 bg-white border border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl mb-2">
              💡
            </div>
            <span className="font-medium text-gray-800">Nouvelle compétence</span>
            <span className="text-xs text-gray-500 mt-1">Créer une compétence</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowNewContactForm(true)}
            className="flex flex-col items-center p-4 bg-white border border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl mb-2">
              📞
            </div>
            <span className="font-medium text-gray-800">Nouveau contact</span>
            <span className="text-xs text-gray-500 mt-1">Ajouter un contact</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowNewProjectForm(true)}
            className="flex flex-col items-center p-4 bg-white border border-green-200 rounded-lg hover:border-green-400 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl mb-2">
              🚀
            </div>
            <span className="font-medium text-gray-800">Nouveau projet</span>
            <span className="text-xs text-gray-500 mt-1">Ajouter un projet</span>
          </button>
        </div>
      </div>

      {/* Formulaire de création de compétence */}
      {showNewSkillForm && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-medium text-gray-800 text-lg">Nouvelle compétence</h5>
            <button
              type="button"
              onClick={() => setShowNewSkillForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la compétence *
              </label>
              <input
                type="text"
                name="nom_competence"
                value={newSkill.nom_competence}
                onChange={handleNewSkillChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: React, Python, Design UX"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau *
              </label>
              <select
                name="niveau_competence"
                value={newSkill.niveau_competence}
                onChange={handleNewSkillChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancé</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                name="categorie"
                value={newSkill.categorie}
                onChange={handleNewSkillChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="mobile">Mobile</option>
                <option value="devops">DevOps</option>
                <option value="base_donnees">Base de données</option>
                <option value="design">Design</option>
                <option value="autres">Autres</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Années d'expérience
              </label>
              <input
                type="number"
                name="annees_experience"
                value={newSkill.annees_experience}
                onChange={handleNewSkillChange}
                min="0"
                step="0.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={newSkill.description}
                onChange={handleNewSkillChange}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Décrivez votre niveau de maîtrise..."
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="est_visible"
                checked={newSkill.est_visible}
                onChange={handleNewSkillChange}
                className="h-4 w-4 text-purple-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Rendre visible dans le portfolio
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowNewSkillForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleCreateSkill}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Créer la compétence
            </button>
          </div>
        </div>
      )}

      {/* Formulaire de création de contact */}
      {showNewContactForm && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-medium text-gray-800 text-lg">Nouveau contact</h5>
            <button
              type="button"
              onClick={() => setShowNewContactForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de contact *
              </label>
              <select
                name="type_contact"
                value={newContact.type_contact}
                onChange={handleNewContactChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="email">Email</option>
                <option value="telephone">Téléphone</option>
                <option value="linkedin">LinkedIn</option>
                <option value="github">GitHub</option>
                <option value="twitter">Twitter</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valeur du contact *
              </label>
              <input
                type="text"
                name="valeur_contact"
                value={newContact.valeur_contact}
                onChange={handleNewContactChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="exemple@email.com ou @utilisateur"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="est_principal"
                checked={newContact.est_principal}
                onChange={handleNewContactChange}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Contact principal
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowNewContactForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleCreateContact}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Créer le contact
            </button>
          </div>
        </div>
      )}

      {/* Formulaire de création de projet - MODIFIÉ */}
      {showNewProjectForm && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-medium text-gray-800 text-lg">Nouveau projet</h5>
            <button
              type="button"
              onClick={() => {
                setShowNewProjectForm(false);
                setPreviewProjectImage(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre du projet *
              </label>
              <input
                type="text"
                name="titre_projet"
                value={newProject.titre_projet}
                onChange={handleNewProjectChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Ex: Application E-commerce"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langage principal
              </label>
              <input
                type="text"
                name="langage_projet"
                value={newProject.langage_projet}
                onChange={handleNewProjectChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Ex: JavaScript, Python"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lien du projet
              </label>
              <input
                type="url"
                name="lien_projet"
                value={newProject.lien_projet}
                onChange={handleNewProjectChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="https://exemple.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lien GitHub
              </label>
              <input
                type="url"
                name="lien_github"
                value={newProject.lien_github}
                onChange={handleNewProjectChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="https://github.com/utilisateur/projet"
              />
            </div>
            
            {/* AJOUT: Champ pour l'image du projet */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image du projet
              </label>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100">
                    {previewProjectImage ? (
                      <img 
                        src={previewProjectImage} 
                        alt="Aperçu du projet" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="image_projet"
                    onChange={handleProjectImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="space-y-3">
                    <label
                      htmlFor="image_projet"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer font-medium text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      Choisir une image
                    </label>
                    <p className="text-xs text-gray-500">
                      Formats acceptés: JPG, PNG, WebP. Taille max: 5MB
                    </p>
                    {newProject.image_projet && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Image sélectionnée: {newProject.image_projet.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technologies (séparées par des virgules)
              </label>
              <input
                type="text"
                name="technologies"
                value={newProject.technologies ? newProject.technologies.join(', ') : ''}
                onChange={(e) => {
                  setNewProject(prev => ({
                    ...prev,
                    technologies: e.target.value ? e.target.value.split(',').map(t => t.trim()) : []
                  }));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="React, Node.js, MongoDB"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de réalisation
              </label>
              <input
                type="date"
                name="date_realisation"
                value={newProject.date_realisation}
                onChange={handleNewProjectChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description_projet"
                value={newProject.description_projet}
                onChange={handleNewProjectChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Décrivez votre projet..."
                required
              />
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="est_public"
                  checked={newProject.est_public}
                  onChange={handleNewProjectChange}
                  className="h-4 w-4 text-green-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Projet public
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="est_termine"
                  checked={newProject.est_termine}
                  onChange={handleNewProjectChange}
                  className="h-4 w-4 text-green-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Projet terminé
                </label>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowNewProjectForm(false);
                setPreviewProjectImage(null);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleCreateProject}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Créer le projet
            </button>
          </div>
        </div>
      )}

      {/* Compétences existantes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-medium text-gray-800">Sélectionnez vos compétences ({skills.length} disponibles)</h4>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {selectedSkills.length} sélectionnée{selectedSkills.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {skills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map(skill => {
              const skillId = skill.id_competence || skill.id;
              const isSelected = selectedSkills.includes(skillId);
              
              return (
                <div
                  key={skillId}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                    isSelected
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => handleSkillToggle(skillId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className="text-xl">💡</span>
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-800">{skill.nom_competence || skill.nom}</h5>
                          {skill.categorie && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {skill.categorie === 'autres' ? 'Autres' : 
                               skill.categorie === 'base_donnees' ? 'Base de données' :
                               skill.categorie.charAt(0).toUpperCase() + skill.categorie.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {skill.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{skill.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
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
                        
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          isSelected
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {isSelected ? '✓ Ajouté' : '+ Ajouter'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <div className="text-gray-400 text-4xl mb-3">🛠️</div>
            <p className="text-gray-600 mb-4">Aucune compétence trouvée. Créez-en une !</p>
          </div>
        )}
      </div>

      {/* Projets existants */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-medium text-gray-800">Sélectionnez vos projets ({projects.length} disponibles)</h4>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {selectedProjects.length} sélectionné{selectedProjects.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map(project => {
              const projectId = project.id_projet || project.id;
              const isSelected = selectedProjects.includes(projectId);
              
              return (
                <div
                  key={projectId}
                  className={`rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'border-purple-500 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => handleProjectToggle(projectId)}
                >
                  <div className={`h-2 ${
                    isSelected ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gray-200'
                  }`}></div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="font-bold text-gray-800 text-lg">
                        {project.titre_projet || project.titre}
                      </h5>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        project.est_termine ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.est_termine ? 'Terminé' : 'En cours'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description_projet || project.description}
                    </p>
                    
                    {project.langage_projet && (
                      <div className="mb-3">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {project.langage_projet}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-xs text-gray-500">
                        {project.date_realisation && new Date(project.date_realisation).toLocaleDateString('fr-FR')}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500 text-white'
                            : 'border-gray-300 text-transparent'
                        }`}>
                          {isSelected && '✓'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <div className="text-gray-400 text-4xl mb-3">🚀</div>
            <p className="text-gray-600 mb-4">Aucun projet trouvé. Créez-en un !</p>
          </div>
        )}
      </div>

      {/* Contacts existants */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-medium text-gray-800">Sélectionnez vos contacts ({contacts.length} disponibles)</h4>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {selectedContacts.length} sélectionné{selectedContacts.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {contacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleContactToggle(contactId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                        isSelected ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        {getIcon(contact.type_contact || contact.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {contact.type_contact === 'telephone' ? 'Téléphone' :
                           contact.type_contact === 'linkedin' ? 'LinkedIn' :
                           contact.type_contact === 'github' ? 'GitHub' :
                           contact.type_contact === 'twitter' ? 'Twitter' :
                           contact.type_contact === 'email' ? 'Email' :
                           contact.type_contact || contact.type || 'Contact'}
                        </p>
                        <p className="text-sm text-gray-600 truncate max-w-[180px]">
                          {contact.valeur_contact || contact.valeur}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500 text-white'
                        : 'border-gray-300 text-transparent'
                    }`}>
                      {isSelected && '✓'}
                    </div>
                  </div>
                  
                  {contact.est_principal && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                        ⭐ Contact principal
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <div className="text-gray-400 text-4xl mb-3">📞</div>
            <p className="text-gray-600 mb-4">Aucun contact trouvé. Créez-en un !</p>
          </div>
        )}
      </div>
    </div>
  );

  // RENDER STEP 4 - MODIFIÉE
  const renderStep4 = () => (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold text-gray-800">Publication et SEO</h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Description (SEO)
          </label>
          <textarea
            name="meta_description"
            value={formData.meta_description}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="Décrivez votre portfolio pour les moteurs de recherche..."
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">
              {formData.meta_description.length}/160 caractères
            </p>
            <p className="text-xs text-gray-500">
              Idéal pour le référencement Google
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mots-clés (SEO)
          </label>
          <input
            type="text"
            name="meta_keywords"
            value={formData.meta_keywords}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="développeur, portfolio, web, javascript, react, design"
          />
          <p className="text-sm text-gray-500 mt-1">
            Séparez les mots-clés par des virgules
          </p>
        </div>

        {/* Section Publication - NOUVELLE */}
        {portfolioCreated && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl mr-4">
                🎉
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">Portfolio créé avec succès !</h4>
                <p className="text-sm text-gray-600">
                  Votre portfolio a été créé en tant que <span className="font-medium text-yellow-600">brouillon</span>.
                  Vous pouvez maintenant le publier pour le rendre visible.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center space-x-4">
              <button
                type="button"
                onClick={handlePublishPortfolio}
                disabled={publishing}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition font-medium shadow-lg flex items-center disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Publication en cours...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Publier maintenant
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/models')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Retour aux portfolios
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              <span className="font-medium">Note :</span> Une fois publié, votre portfolio sera visible publiquement sur la plateforme.
              Vous pourrez toujours le modifier ou le repasser en brouillon ultérieurement.
            </p>
          </div>
        )}

        {/* Aperçu des données */}
        <div className="bg-gray-50 p-6 rounded-xl mt-6">
          <h4 className="font-medium text-gray-700 mb-3">Récapitulatif de votre portfolio :</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Titre :</span>
              <span className="font-medium">{formData.titre || "Non défini"}</span>
            </div>
            <div className="flex justify-between">
              <span>Profession :</span>
              <span className="font-medium">{formData.titre_professionnel || "Non défini"}</span>
            </div>
            <div className="flex justify-between">
              <span>Compétences :</span>
              <span className="font-medium">{selectedSkills.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Projets :</span>
              <span className="font-medium">{selectedProjects.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Contacts :</span>
              <span className="font-medium">{selectedContacts.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Éléments visibles :</span>
              <span className="font-medium">
                {[
                  formData.afficher_photo && "Photo",
                  formData.afficher_competences && "Compétences",
                  formData.afficher_projets && "Projets",
                  formData.afficher_contacts && "Contacts",
                  formData.afficher_formations && "Formations",
                  formData.afficher_experiences && "Expériences",
                ].filter(Boolean).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Layout :</span>
              <span className="font-medium">{formData.layout_type}</span>
            </div>
            <div className="flex justify-between">
              <span>Statut :</span>
              <span className="font-medium text-yellow-600">
                Brouillon {portfolioCreated && "(créé)"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Navigation entre étapes
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
    setStep(prev => Math.min(prev + 1, 4));
  };

  const goToPrevStep = () => {
    setError("");
    setStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 py-6 px-4 sm:px-6 lg:px-8">

      <div className="max-w-6xl mx-auto">
        {/* Message d'information */}
        {step === 3 && (selectedSkills.length === 0 || selectedProjects.length === 0) && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center">
              <div className="flex-shrink-0 text-yellow-500">⚠️</div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <span className="font-bold">Important :</span> Pour créer un portfolio, vous devez sélectionner au moins <span className="font-bold">une compétence et un projet</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* En-tête */}
        <header className="mb-8">
         <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                <span> Home </span>
              </button>
              <div className="hidden md:block h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Créer un nouveau portfolio
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700">Votre portfolio</p>
                <p className="text-xs text-gray-500">Étape {step} sur 4</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                <span className="text-lg">👤</span>
              </div>
            </div>
          </div>
        </header>

        {/* Indicateur d'étapes amélioré */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            {[
              { number: 1, label: 'Infos', icon: '📝' },
              { number: 2, label: 'Design', icon: '🎨' },
              { number: 3, label: 'Contenu', icon: '📦' },
              { number: 4, label: 'Publication', icon: '🚀' }
            ].map(({ number, label, icon }) => (
              <div key={number} className="flex flex-col items-center relative">
                {number > 1 && (
                  <div className="absolute left-1/2 top-5 -translate-x-[calc(50%+2rem)] w-16 h-0.5 bg-gray-300"></div>
                )}
                
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2 relative z-10 transition-all duration-300 ${
                  step === number 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg scale-110' 
                    : step > number 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > number ? '✓' : icon}
                </div>
                
                <span className={`text-sm font-medium transition-colors ${
                  step >= number ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  {label}
                </span>
                
                {step === number && (
                  <div className="absolute -bottom-6 w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Barre de progression */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-purple-700 transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
          </div>
          
          {/* Pourcentage */}
          <div className="text-right mt-2">
            <span className="text-sm font-medium text-gray-600">
              {Math.round(((step - 1) / 3) * 100)}% complété
            </span>
          </div>
        </div>

        {/* Carte principale du formulaire */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* En-tête de la carte */}
          <div className="px-8 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {step === 1 && 'Informations de base'}
                  {step === 2 && 'Personnalisation du design'}
                  {step === 3 && 'Sélection du contenu'}
                  {step === 4 && 'Publication et SEO'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {step === 1 && 'Définissez les informations principales de votre portfolio'}
                  {step === 2 && 'Personnalisez l\'apparence et les éléments visibles'}
                  {step === 3 && 'Sélectionnez les compétences, projets et contacts à afficher'}
                  {step === 4 && 'Configurez le SEO et publiez votre portfolio'}
                </p>
              </div>
              
              <div className="hidden lg:block">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Exemples :</span>
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
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  >
                    Charger un exemple
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Messages d'erreur et succès */}
          <div className="px-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
         
          {/* Formulaire */}
          <form onSubmit={handleSubmit}>
            <div className="px-8 pb-8">
              {/* Étape actuelle */}
              <div className="mb-8">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
              </div>
            </div>

            {/* Barre d'actions */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="flex space-x-3">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={goToPrevStep}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                      className="px-5 py-2.5 border border-yellow-300 text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition font-medium flex items-center disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                      </svg>
                      Sauvegarder brouillon
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition font-medium shadow-md flex items-center group"
                    >
                      Continuer
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  ) : !portfolioCreated ? (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition font-medium shadow-lg flex items-center disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          Créer le portfolio (brouillon)
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Aperçu en temps réel */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Aperçu en direct</h3>
            <span className="text-sm text-gray-500">Mise à jour automatique</span>
          </div>
          
          <div className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-2xl">P</span>
                    </div>
                  )}
                </div>
                {formData.afficher_photo && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
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
                    <h4 className="text-xl font-bold text-gray-800 mb-1">
                      {formData.titre || "Mon Portfolio"}
                    </h4>
                    <p className="text-purple-600 font-medium">
                      {formData.titre_professionnel || "Titre professionnel"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-yellow-100 text-yellow-800">
                      Brouillon
                    </span>
                  </div>
                </div>
                
                {/* Description */}
                {(formData.description || formData.biographie) && (
                  <p className="text-gray-600 text-sm mt-3 line-clamp-2">
                    {formData.description || formData.biographie}
                  </p>
                )}
                
                {/* Métriques */}
                <div className="flex items-center space-x-4 mt-4">
                  {formData.afficher_competences && selectedSkills.length > 0 && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <span className="text-gray-500">🛠️</span>
                      <span>{selectedSkills.length} compétence{selectedSkills.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  
                  {formData.afficher_projets && selectedProjects.length > 0 && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <span className="text-gray-500">🚀</span>
                      <span>{selectedProjects.length} projet{selectedProjects.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  
                  {formData.afficher_contacts && selectedContacts.length > 0 && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <span className="text-gray-500">📞</span>
                      <span>{selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                
                {/* Couleur du thème */}
                <div className="flex items-center space-x-2 mt-4">
                  <span className="text-xs text-gray-500">Couleur :</span>
                  <div 
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: formData.theme_couleur }}
                  ></div>
                  <span className="text-xs text-gray-600 font-mono">{formData.theme_couleur}</span>
                </div>
              </div>
            </div>
            
            {/* Layout preview */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Layout : {formData.layout_type}</span>
                <span className="text-xs text-gray-500">Vue aperçu</span>
              </div>
              
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex space-x-3">
                  {/* Sections simulées */}
                  {formData.afficher_photo && (
                    <div className="w-16 h-16 bg-purple-200 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-sm">Photo</span>
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                    {formData.afficher_competences && (
                      <div className="h-3 bg-gradient-to-r from-purple-400 to-purple-300 rounded-full w-3/4"></div>
                    )}
                    {formData.afficher_projets && (
                      <div className="h-3 bg-gradient-to-r from-blue-400 to-blue-300 rounded-full w-1/2"></div>
                    )}
                    {formData.afficher_contacts && (
                      <div className="h-3 bg-gradient-to-r from-green-400 to-green-300 rounded-full w-2/3"></div>
                    )}
                    {(formData.afficher_formations || formData.afficher_experiences) && (
                      <div className="h-3 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-5/6"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="text-center py-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
            <div className="mb-4 md:mb-0">
              <p className="flex items-center justify-center md:justify-start space-x-2">
                <span>🛡️</span>
                <span>Vos données sont sécurisées et chiffrées</span>
              </p>
            </div>
            
            <div className="space-x-4">
              <span>PortfolioX v1.0</span>
              <span>•</span>
              <span>API: {API_BASE_URL}</span>
              <span>•</span>
              <span>Étape {step}/4</span>
            </div>
            
            <div className="mt-4 md:mt-0">
              <p className="flex items-center justify-center md:justify-end space-x-2">
                <span>💡</span>
                <span>Conseil : Remplissez tous les champs pour un portfolio complet</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Create_portfolio;