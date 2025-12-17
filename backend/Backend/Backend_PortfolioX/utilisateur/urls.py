from django.urls import path
from . import views
from .views import InscriptionView

urlpatterns = [
    # ==================== AUTHENTIFICATION DE BASE ====================
    path('inscription/', InscriptionView.as_view(), name='inscription'),
    path('connexion/', views.connexion, name='connexion'),
    path('deconnexion/', views.deconnexion, name='deconnexion'),
    path('rafraichir-token/', views.rafraichir_token, name='rafraichir_token'),
    path('verifier-token/', views.verifier_token, name='verifier_token'),
    
    # ==================== GESTION DU PROFIL ====================
    path('profil/', views.profil_utilisateur, name='profil_utilisateur'),
    path('profil/modifier/', views.modifier_profil, name='modifier_profil'),
    path('profil/stats/', views.user_stats, name='user_stats'),
    path('profil/export/', views.export_data, name='export_data'),
    
    # ==================== MOTS DE PASSE ====================
    path('changer-mot-de-passe/', views.changer_mot_de_passe, name='changer_mot_de_passe'),
    path('reinitialiser-mot-de-passe/', views.reset_password, name='reset_password'),
    
    # ==================== COORDONNÉES ET COMPTE ====================
    path('verifier-email/', views.verify_email, name='verify_email'),
    path('coordonnees/', views.modifier_coordonnees, name='modifier_coordonnees'),
    path('supprimer-compte/', views.delete_account, name='delete_account'),
    
    # ==================== PORTFOLIOS ====================
    path('portfolios/', views.user_portfolios, name='user_portfolios'),
    
    # ==================== ADMINISTRATION ====================
    path('admin/utilisateurs/', views.UtilisateurListView.as_view(), name='liste_utilisateurs'),
    path('admin/utilisateurs/<int:pk>/', views.UtilisateurDetailView.as_view(), name='detail_utilisateur'),
    
    # ==================== API ALTERNATIVE (pour compatibilité) ====================
    path('api/auth/inscription/', InscriptionView.as_view(), name='api_inscription'),
    path('api/auth/connexion/', views.connexion, name='api_connexion'),
    path('api/auth/deconnexion/', views.deconnexion, name='api_deconnexion'),
    path('api/auth/rafraichir-token/', views.rafraichir_token, name='api_rafraichir_token'),
    
    # API user profile
    path('api/user/profile/', views.user_profile, name='user_profile'),
    path('api/user/profile/update/', views.update_profile, name='update_profile'),
    path('api/user/profile/stats/', views.user_stats, name='api_user_stats'),
    path('api/user/profile/export/', views.export_data, name='api_export_data'),
    
    # API password management
    path('api/user/change-password/', views.change_password, name='change_password'),
    path('api/user/reset-password/', views.reset_password, name='api_reset_password'),
    path('api/user/verify-email/', views.verify_email, name='api_verify_email'),
    path('api/user/coordonnees/', views.modifier_coordonnees, name='api_coordonnees'),
    path('api/user/delete-account/', views.delete_account, name='api_delete_account'),
    path('api/user/portfolios/', views.user_portfolios, name='api_user_portfolios'),
    
    # API admin
    path('api/admin/utilisateurs/', views.UtilisateurListView.as_view(), name='utilisateurs_list'),
    path('api/admin/utilisateurs/<int:pk>/', views.UtilisateurDetailView.as_view(), name='utilisateur_detail'),
]