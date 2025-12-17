"""
URL configuration for Backend_PortfolioX project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenVerifyView
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Vue racine de l'API - remplace api_root.urls
@api_view(['GET'])
def api_root(request):
    """
    Page d'accueil de l'API PortfolioX
    Affiche tous les endpoints disponibles
    """
    return Response({
        'message': '🚀 Bienvenue sur l\'API PortfolioX',
        'description': 'Plateforme de création de portfolios en ligne',
        'version': '1.0',
        'endpoints': {
            'administration': {
                'admin': '/admin/',
                'verification_token': '/api/token/verify/'
            },
            'authentification': {
                'inscription': '/api/auth/inscription/',
                'connexion': '/api/auth/connexion/',
                'deconnexion': '/api/auth/deconnexion/',
                'rafraichir_token': '/api/auth/rafraichir-token/',
                'verifier_token': '/api/auth/verifier-token/',
                'profil': '/api/auth/profil/',
                'modifier_profil': '/api/auth/profil/modifier/',
                'statistiques': '/api/auth/profil/stats/',
                'exporter_donnees': '/api/auth/profil/export/',
                'changer_mot_de_passe': '/api/auth/changer-mot-de-passe/',
                'reinitialiser_mot_de_passe': '/api/auth/reinitialiser-mot-de-passe/',
                'verifier_email': '/api/auth/verifier-email/',
                'modifier_coordonnees': '/api/auth/coordonnees/',
                'supprimer_compte': '/api/auth/supprimer-compte/',
                'mes_portfolios': '/api/auth/portfolios/'
            },
            'administration_utilisateurs': {
                'liste_utilisateurs': '/api/auth/admin/utilisateurs/',
                'detail_utilisateur': '/api/auth/admin/utilisateurs/<int:pk>/'
            },
            'portfolios': {
                'crud_portfolios': {
                    'liste_portfolios': 'GET    /api/portfolio/portfolios/',
                    'creer_portfolio': 'POST   /api/portfolio/portfolios/',
                    'detail_portfolio': 'GET    /api/portfolio/portfolios/{id}/',
                    'modifier_portfolio': 'PUT    /api/portfolio/portfolios/{id}/',
                    'modifier_partiel': 'PATCH  /api/portfolio/portfolios/{id}/',
                    'supprimer_portfolio': 'DELETE /api/portfolio/portfolios/{id}/'
                },
                'actions_portfolios': {
                    'mes_portfolios': 'GET    /api/portfolio/portfolios/my_portfolio/',
                    'portfolios_publies': 'GET    /api/portfolio/portfolios/published/',
                    'recherche_portfolios': 'GET    /api/portfolio/portfolios/search/',
                    'publier_portfolio': 'POST   /api/portfolio/portfolios/{id}/publish/',
                    'statistiques_portfolio': 'GET    /api/portfolio/portfolios/{id}/stats/',
                    'dupliquer_portfolio': 'POST   /api/portfolio/portfolios/{id}/duplicate/',
                    'ajouter_contact': 'POST   /api/portfolio/portfolios/{id}/add-contact/',
                    'ajouter_competence': 'POST   /api/portfolio/portfolios/{id}/add-competence/',
                    'ajouter_projet': 'POST   /api/portfolio/portfolios/{id}/add-projet/'
                },
                'elements_portfolio': {
                    'contacts': {
                        'liste': 'GET    /api/portfolio/contacts/',
                        'creer': 'POST   /api/portfolio/contacts/',
                        'detail': 'GET    /api/portfolio/contacts/{id}/',
                        'modifier': 'PUT    /api/portfolio/contacts/{id}/',
                        'modifier_partiel': 'PATCH  /api/portfolio/contacts/{id}/',
                        'supprimer': 'DELETE /api/portfolio/contacts/{id}/',
                        'contacts_principaux': 'GET    /api/portfolio/contacts/principaux/'
                    },
                    'competences': {
                        'liste': 'GET    /api/portfolio/competences/',
                        'creer': 'POST   /api/portfolio/competences/',
                        'detail': 'GET    /api/portfolio/competences/{id}/',
                        'modifier': 'PUT    /api/portfolio/competences/{id}/',
                        'modifier_partiel': 'PATCH  /api/portfolio/competences/{id}/',
                        'supprimer': 'DELETE /api/portfolio/competences/{id}/',
                        'par_categorie': 'GET    /api/portfolio/competences/par-categorie/'
                    },
                    'projets': {
                        'liste': 'GET    /api/portfolio/projets/',
                        'creer': 'POST   /api/portfolio/projets/',
                        'detail': 'GET    /api/portfolio/projets/{id}/',
                        'modifier': 'PUT    /api/portfolio/projets/{id}/',
                        'modifier_partiel': 'PATCH  /api/portfolio/projets/{id}/',
                        'supprimer': 'DELETE /api/portfolio/projets/{id}/',
                        'projets_publics': 'GET    /api/portfolio/projets/publics/'
                    }
                },
                'endpoints_publics': {
                    'contacts_publics': {
                        'liste': 'GET    /api/portfolio/public-contacts/',
                        'detail': 'GET    /api/portfolio/public-contacts/{id}/',
                        'portfolio_contacts': 'GET    /api/portfolio/portfolios/{id}/public-contacts/',
                        'portfolio_data': 'GET    /api/portfolio/portfolios/{id}/public-data/'
                    },
                    'competences_publics': {
                        'liste': 'GET    /api/portfolio/public-competences/',
                        'detail': 'GET    /api/portfolio/public-competences/{id}/',
                        'par_categorie': 'GET    /api/portfolio/public-competences/by-category/',
                        'portfolio_competences': 'GET    /api/portfolio/portfolios/{id}/public-competences/'
                    },
                    'projets_publics': {
                        'liste': 'GET    /api/portfolio/public-projets/',
                        'detail': 'GET    /api/portfolio/public-projets/{id}/',
                        'par_langage': 'GET    /api/portfolio/public-projets/by-language/',
                        'portfolio_projets': 'GET    /api/portfolio/portfolios/{id}/public-projets/'
                    },
                    'portfolios_publics': {
                        'liste': 'GET    /api/portfolio/portfolios/public/all/',
                        'stats': 'GET    /api/portfolio/public/portfolio/{id}/stats/',
                        'platform_stats': 'GET    /api/portfolio/public/platform-stats/'
                    },
                    'recherche': {
                        'globale': 'GET    /api/portfolio/public/search/?q=terme'
                    }
                }
            },
            'utilitaires': {
                'documentation': 'GET    /api/',
                'verification_token': 'POST   /api/token/verify/'
            }
        },
        'notes_techniques': {
            'architecture': 'Système de portfolio avec contacts, compétences et projets séparés',
            'authentification': 'JWT Token requis pour les opérations d\'écriture',
            'format_token': 'Header: Authorization: Bearer <votre_token_jwt>',
            'pagination': 'Toutes les listes sont paginées (12 éléments par défaut)',
            'filtres': 'Support des filtres via paramètres GET (?statut=publie, ?competence=Python, etc.)',
            'recherche': 'Recherche textuelle disponible sur la plupart des endpoints',
            'tri': 'Tri disponible via ?ordering=<champ> (?ordering=-date_creation)'
        },
        'exemples_utilisation': {
            'creer_portfolio': 'POST /api/portfolio/portfolios/ avec données JSON',
            'ajouter_competence': 'POST /api/portfolio/competences/ ou utiliser add-competence',
            'publier': 'POST /api/portfolio/portfolios/1/publish/ avec {"statut": "publie"}',
            'rechercher': 'GET /api/portfolio/portfolios/search/?competence=Python&langage=JavaScript',
            'mes_portfolios': 'GET /api/portfolio/portfolios/my/ (authentification requise)',
            'contacts_principaux': 'GET /api/portfolio/contacts/principaux/',
            'competences_categories': 'GET /api/portfolio/competences/par-categorie/',
            'acces_public': {
                'compétences_visibles': 'GET /api/portfolio/public-competences/',
                'projets_publics': 'GET /api/portfolio/public-projets/',
                'donnees_portfolio': 'GET /api/portfolio/portfolios/{id}/public-data/'
            }
        },
          'forma json pour la creation experience, certification, centre interet et lamgue': {   
               
            "competences": [
                     {"nom": "React", "niveau": 4, "categorie": "Frontend"}
                  ],
   
              "projets": [
                      {"titre": "Mon Projet", "description": "...", "lien_live": "https://...", "lien_github": "https://..."}
                               ],
               
               "experiences": [
              {"poste": "Développeur", "entreprise": "Compagnie", "date_debut": "2023-01-01"}
                  ],
  
              "langues": [
                   {"langue": "Français", "niveau": "Natif"}
                   ],
  
             "certifications": [
                 {"nom": "AWS Certified", "organisme": "Amazon", "date_obtention": "2023"}
                 ],
  
                    "interets": [
                         {"nom": "Photographie"}
                                 ]
            },
        'statistiques_plateforme': 'Pour les statistiques administrateur, contactez l\'administrateur système',
        'support': 'Documentation technique disponible sur /admin/ pour les utilisateurs autorisés'
    })

urlpatterns = [
    # Interface d'administration Django
    path('admin/', admin.site.urls),
    
    # API Authentication JWT
    path('api/auth/', include('utilisateur.urls')),
    
    # API Portfolio
    path('api/portfolio/', include('portfolio.urls')),
    
    # Vérification de token JWT
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # API Root - Utilise la vue locale au lieu d'inclure api_root.urls
    path('api/', api_root, name='api_root'),
]

# Servir les fichiers médias en développement
# Ajouter les fichiers statiques seulement en mode DEBUG
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)