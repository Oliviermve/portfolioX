# portfolio/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'portfolio'

# Création du router pour les ViewSets
router = DefaultRouter()

# ==========================================================================
# ROUTES AUTOMATIQUES DES VIEWSETS
# ==========================================================================

# Contacts - CRUD complet: GET, POST, PUT, PATCH, DELETE
router.register(r'contacts', views.ContactViewSet, basename='contact')

# Compétences - CRUD complet: GET, POST, PUT, PATCH, DELETE  
router.register(r'competences', views.CompetenceViewSet, basename='competence')

# Projets - CRUD complet: GET, POST, PUT, PATCH, DELETE
router.register(r'projets', views.ProjetViewSet, basename='projet')

# Portfolios - CRUD complet avec actions personnalisées
router.register(r'portfolios', views.PortfolioViewSet, basename='portfolio')

# ==========================================================================
# URLS PERSONNALISÉES (EN PLUS DES VIEWSETS)
# ==========================================================================

urlpatterns = [
    # ==========================================================================
    # INCLUSION DES ROUTES AUTOMATIQUES DES VIEWSETS
    # ==========================================================================
    path('', include(router.urls)),
    
    # ==========================================================================
    # ENDPOINTS SPÉCIFIQUES POUR PORTFOLIO
    # ==========================================================================
    
    # GET - Mon portfolio (utilisateur connecté)
    path('portfolios/my/', 
         views.PortfolioViewSet.as_view({'get': 'my_portfolio'}), 
         name='my_portfolio'),
    
    # GET - Liste des portfolios publiés
    path('portfolios/published/', 
         views.PortfolioViewSet.as_view({'get': 'published'}), 
         name='published_portfolios'),
    
    # GET - Recherche avancée
    path('portfolios/search/', 
         views.PortfolioViewSet.as_view({'get': 'search'}), 
         name='portfolio_search'),
    
    # ==========================================================================
    # ACTIONS SUR UN PORTFOLIO SPÉCIFIQUE
    # ==========================================================================
    
    # POST - Publier/dépublier un portfolio
    path('portfolios/<int:pk>/publish/', 
         views.PortfolioViewSet.as_view({'post': 'publish'}), 
         name='publish_portfolio'),
    
    # GET - Statistiques d'un portfolio
    path('portfolios/<int:pk>/stats/', 
         views.PortfolioViewSet.as_view({'get': 'stats'}), 
         name='portfolio_stats'),
    
    # POST - Dupliquer un portfolio
    path('portfolios/<int:pk>/duplicate/', 
         views.PortfolioViewSet.as_view({'post': 'duplicate'}), 
         name='duplicate_portfolio'),
    
    # POST - Ajouter un contact existant au portfolio
    path('portfolios/<int:pk>/add-contact/', 
         views.PortfolioViewSet.as_view({'post': 'add_contact'}), 
         name='add_contact_to_portfolio'),
    
    # POST - Ajouter une compétence existante au portfolio
    path('portfolios/<int:pk>/add-competence/', 
         views.PortfolioViewSet.as_view({'post': 'add_competence'}), 
         name='add_competence_to_portfolio'),
    
    # POST - Ajouter un projet existant au portfolio
    path('portfolios/<int:pk>/add-projet/', 
         views.PortfolioViewSet.as_view({'post': 'add_projet'}), 
         name='add_projet_to_portfolio'),
    
    # ==========================================================================
    # ENDPOINTS SPÉCIAUX POUR COMPÉTENCES ET PROJETS
    # ==========================================================================
    
    # GET - Contacts principaux
    path('contacts/principaux/', 
         views.ContactViewSet.as_view({'get': 'principaux'}), 
         name='contacts_principaux'),
    
    # GET - Compétences par catégorie
    path('competences/par-categorie/', 
         views.CompetenceViewSet.as_view({'get': 'par_categorie'}), 
         name='competences_par_categorie'),
    
    # GET - Projets publics
    path('projets/publics/', 
         views.ProjetViewSet.as_view({'get': 'publics'}), 
         name='projets_publics'),
    
    # ==========================================================================
    # ENDPOINTS PUBLICS POUR L'ACCÈS AUX DONNÉES DES PORTFOLIOS PUBLIÉS
    # ==========================================================================
    
    # GET - Contacts d'un portfolio publié (public)
    path('portfolios/<int:portfolio_id>/public-contacts/', 
         views.PortfolioPublicContactsAPIView.as_view(), 
         name='portfolio_public_contacts'),
    
    # GET - Compétences d'un portfolio publié (public)
    path('portfolios/<int:portfolio_id>/public-competences/', 
         views.PortfolioPublicCompetencesAPIView.as_view(), 
         name='portfolio_public_competences'),
    
    # GET - Projets d'un portfolio publié (public)
    path('portfolios/<int:portfolio_id>/public-projets/', 
         views.PortfolioPublicProjetsAPIView.as_view(), 
         name='portfolio_public_projets'),
    
    # GET - Toutes les données d'un portfolio publié (public)
    path('portfolios/<int:portfolio_id>/public-data/', 
         views.PortfolioPublicDataAPIView.as_view(), 
         name='portfolio_public_data'),
    
    # GET - Tous les portfolios publiés avec données résumées (public)
    path('portfolios/public/all/', 
         views.PublicPortfoliosAPIView.as_view(), 
         name='public_portfolios_all'),
    
    # ==========================================================================
    # ACTIONS PUBLIQUES DANS PortfolioViewSet (accès direct)
    # ==========================================================================
    
    # GET - Contacts publics d'un portfolio spécifique
    path('portfolios/<int:pk>/contacts-publics/', 
         views.PortfolioViewSet.as_view({'get': 'contacts_publics'}), 
         name='portfolio_contacts_publics'),
    
    # GET - Compétences publiques d'un portfolio spécifique
    path('portfolios/<int:pk>/competences-publics/', 
         views.PortfolioViewSet.as_view({'get': 'competences_publics'}), 
         name='portfolio_competences_publics'),
    
    # GET - Projets publics d'un portfolio spécifique
    path('portfolios/<int:pk>/projets-publics/', 
         views.PortfolioViewSet.as_view({'get': 'projets_publics'}), 
         name='portfolio_projets_publics'),
    
    # ==========================================================================
    # ENDPOINT POUR LES CONTACTS D'UN PORTFOLIO SPÉCIFIQUE
    # ==========================================================================
    
    # GET - Contacts d'un portfolio spécifique
    path('contacts/portfolio/<int:portfolio_id>/', 
         views.ContactViewSet.as_view({'get': 'portfolio_contacts'}), 
         name='portfolio_contacts'),
    
    # ==========================================================================
    # ENDPOINTS PUBLICS SUPPLÉMENTAIRES POUR COMPÉTENCES ET PROJETS
    # ==========================================================================
    
    # GET - Liste publique des compétences
    path('public-competences/', 
         views.PublicCompetencesListAPIView.as_view(), 
         name='public_competences_list'),
    
    # GET - Compétences publiques par catégorie
    path('public-competences/by-category/', 
         views.PublicCompetencesByCategoryAPIView.as_view(), 
         name='public_competences_by_category'),
    
    # GET - Détail d'une compétence publique
    path('public-competences/<int:competence_id>/', 
         views.PublicCompetenceDetailAPIView.as_view(), 
         name='public_competence_detail'),
    
    # GET - Liste publique des projets
    path('public-projets/', 
         views.PublicProjetsListAPIView.as_view(), 
         name='public_projets_list'),
    
    # GET - Projets publics par langage
    path('public-projets/by-language/', 
         views.PublicProjetsByLanguageAPIView.as_view(), 
         name='public_projets_by_language'),
    
    # GET - Détail d'un projet public
    path('public-projets/<int:projet_id>/', 
         views.PublicProjetDetailAPIView.as_view(), 
         name='public_projet_detail'),
    
    # GET - Liste publique des contacts
    path('public-contacts/', 
         views.PublicContactsListAPIView.as_view(), 
         name='public_contacts_list'),
    
    # GET - Détail d'un contact public
    path('public-contacts/<int:contact_id>/', 
         views.PublicContactDetailAPIView.as_view(), 
         name='public_contact_detail'),
    
    # ==========================================================================
    # ENDPOINTS PUBLICS POUR LES STATISTIQUES
    # ==========================================================================
    
    # GET - Statistiques d'un portfolio publié
    path('public/portfolio/<int:portfolio_id>/stats/', 
         views.PublicPortfolioStatsAPIView.as_view(), 
         name='public_portfolio_stats'),
    
    # GET - Statistiques globales de la plateforme
    path('public/platform-stats/', 
         views.PublicPlatformStatsAPIView.as_view(), 
         name='public_platform_stats'),
    
    # ==========================================================================
    # ENDPOINTS PUBLICS POUR LA RECHERCHE
    # ==========================================================================
    
    # GET - Recherche globale
    path('public/search/', 
         views.PublicSearchAPIView.as_view(), 
         name='public_search'),
]

# ==========================================================================
# DOCUMENTATION DES ENDPOINTS DISPONIBLES
# ==========================================================================

"""
ENDPOINTS AUTOMATIQUES GÉNÉRÉS PAR LES VIEWSETS:

CONTACTS:
  GET    /api/portfolio/contacts/          - Liste tous les contacts (public pour portfolios publiés)
  POST   /api/portfolio/contacts/          - Créer un nouveau contact (authentifié)
  GET    /api/portfolio/contacts/{id}/     - Détails d'un contact (public pour portfolios publiés)
  PUT    /api/portfolio/contacts/{id}/     - Modifier complètement un contact (authentifié/propriétaire)
  PATCH  /api/portfolio/contacts/{id}/     - Modifier partiellement un contact (authentifié/propriétaire)
  DELETE /api/portfolio/contacts/{id}/     - Supprimer un contact (authentifié/propriétaire)

  ACTIONS PERSONNALISÉES:
  GET    /api/portfolio/contacts/principaux/ - Contacts principaux (public)
  GET    /api/portfolio/contacts/portfolio/{portfolio_id}/ - Contacts d'un portfolio spécifique (public)

COMPÉTENCES:
  GET    /api/portfolio/competences/       - Liste toutes les compétences (public pour portfolios publiés)
  POST   /api/portfolio/competences/       - Créer une nouvelle compétence (authentifié)
  GET    /api/portfolio/competences/{id}/  - Détails d'une compétence (public pour portfolios publiés)
  PUT    /api/portfolio/competences/{id}/  - Modifier complètement une compétence (authentifié/propriétaire)
  PATCH  /api/portfolio/competences/{id}/  - Modifier partiellement une compétence (authentifié/propriétaire)  
  DELETE /api/portfolio/competences/{id}/  - Supprimer une compétence (authentifié/propriétaire)

  ACTIONS PERSONNALISÉES:
  GET    /api/portfolio/competences/par-categorie/ - Compétences par catégorie (public)

PROJETS:
  GET    /api/portfolio/projets/           - Liste tous les projets (public pour portfolios publiés)
  POST   /api/portfolio/projets/           - Créer un nouveau projet (authentifié)
  GET    /api/portfolio/projets/{id}/      - Détails d'un projet (public pour portfolios publiés)
  PUT    /api/portfolio/projets/{id}/      - Modifier complètement un projet (authentifié/propriétaire)
  PATCH  /api/portfolio/projets/{id}/      - Modifier partiellement un projet (authentifié/propriétaire)
  DELETE /api/portfolio/projets/{id}/      - Supprimer un projet (authentifié/propriétaire)

  ACTIONS PERSONNALISÉES:
  GET    /api/portfolio/projets/publics/   - Projets publics seulement (public)

PORTFOLIOS (CRUD STANDARD):
  GET    /api/portfolio/portfolios/        - Liste tous les portfolios (public pour publiés)
  POST   /api/portfolio/portfolios/        - Créer un nouveau portfolio (authentifié)
  GET    /api/portfolio/portfolios/{id}/   - Détails d'un portfolio (public pour publiés)
  PUT    /api/portfolio/portfolios/{id}/   - Modifier complètement un portfolio (authentifié/propriétaire)
  PATCH  /api/portfolio/portfolios/{id}/   - Modifier partiellement un portfolio (authentifié/propriétaire)
  DELETE /api/portfolio/portfolios/{id}/   - Archiver un portfolio (authentifié/propriétaire)

PORTFOLIOS (ACTIONS PERSONNALISÉES):
  GET    /api/portfolio/portfolios/my/         - Mon portfolio (authentifié)
  GET    /api/portfolio/portfolios/published/  - Liste des portfolios publiés (public)
  GET    /api/portfolio/portfolios/search/     - Recherche avancée (public)
  
  ACTIONS SUR UN PORTFOLIO SPÉCIFIQUE:
  POST   /api/portfolio/portfolios/{id}/publish/      - Publier/dépublier (authentifié/propriétaire)
  GET    /api/portfolio/portfolios/{id}/stats/        - Statistiques (authentifié/propriétaire)
  POST   /api/portfolio/portfolios/{id}/duplicate/    - Dupliquer (authentifié/propriétaire)
  POST   /api/portfolio/portfolios/{id}/add-contact/  - Ajouter un contact (authentifié/propriétaire)
  POST   /api/portfolio/portfolios/{id}/add-competence/ - Ajouter une compétence (authentifié/propriétaire)
  POST   /api/portfolio/portfolios/{id}/add-projet/   - Ajouter un projet (authentifié/propriétaire)

  ACTIONS PUBLIQUES SUR UN PORTFOLIO PUBLIÉ:
  GET    /api/portfolio/portfolios/{id}/contacts-publics/    - Contacts publics
  GET    /api/portfolio/portfolios/{id}/competences-publics/ - Compétences publiques
  GET    /api/portfolio/portfolios/{id}/projets-publics/     - Projets publics

ENDPOINTS PUBLICS SPÉCIFIQUES:
  GET    /api/portfolio/portfolios/{portfolio_id}/public-contacts/    - Contacts d'un portfolio publié
  GET    /api/portfolio/portfolios/{portfolio_id}/public-competences/ - Compétences d'un portfolio publié
  GET    /api/portfolio/portfolios/{portfolio_id}/public-projets/     - Projets d'un portfolio publié
  GET    /api/portfolio/portfolios/{portfolio_id}/public-data/        - Toutes les données d'un portfolio publié
  GET    /api/portfolio/portfolios/public/all/                        - Tous les portfolios publiés avec données résumées

ENDPOINTS PUBLICS SUPPLÉMENTAIRES:
  GET    /api/portfolio/public-competences/                          - Liste toutes les compétences visibles (public)
  GET    /api/portfolio/public-competences/by-category/              - Compétences groupées par catégorie (public)
  GET    /api/portfolio/public-competences/{id}/                     - Détails d'une compétence (public)
  GET    /api/portfolio/public-projets/                              - Liste tous les projets publics (public)
  GET    /api/portfolio/public-projets/by-language/                  - Projets groupés par langage (public)
  GET    /api/portfolio/public-projets/{id}/                         - Détails d'un projet (public)
  GET    /api/portfolio/public-contacts/                             - Liste tous les contacts (public)
  GET    /api/portfolio/public-contacts/{id}/                        - Détails d'un contact (public)
  GET    /api/portfolio/public/portfolio/{id}/stats/                 - Statistiques d'un portfolio (public)
  GET    /api/portfolio/public/platform-stats/                       - Statistiques globales de la plateforme (public)
  GET    /api/portfolio/public/search/                               - Recherche globale (public)

FILTRES DISPONIBLES:
  Contacts: ?type=email, ?principal=true, ?search=terme
  Compétences: ?categorie=frontend, ?niveau_competence=avance, ?est_visible=true, ?search=terme
  Projets: ?langage_projet=Python, ?est_public=true, ?est_termine=true, ?search=terme
  Portfolios: ?statut=publie, ?utilisateur=1, ?competence=Python, ?langage=JavaScript

RECHERCHE (search_fields):
  Contacts: valeur_contact, type_contact
  Compétences: nom_competence, description
  Projets: titre_projet, description_projet, langage_projet
  Portfolios: titre, description, titre_professionnel, biographie

TRI (ordering_fields):
  Contacts: ordre, date_ajout
  Compétences: nom_competence, categorie, ordre, annees_experience
  Projets: titre_projet, date_realisation, ordre
  Portfolios: date_creation, date_modification, vue_count, titre

PAGINATION:
  Toutes les listes sont paginées (12 éléments par page)
  Modifier avec ?page_size=20
  Maximum: 100 éléments par page

PERMISSIONS:
  Contacts/Compétences/Projets: 
    - Lecture: Public pour les éléments des portfolios publiés
    - Écriture: Authentifié et propriétaire uniquement
  
  Portfolios:
    - Lecture: Public pour les portfolios publiés
    - Écriture: Authentifié et propriétaire uniquement
  
  Mon portfolio: Authentification requise

  Endpoints publics: Accessibles à tous sans authentification
  Endpoints privés: JWT Token requis (Header: Authorization: Bearer <token>)
"""