from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import login, authenticate, update_session_auth_hash
from django.contrib.auth.models import User
from .models import Utilisateur, Administrateur
from .serializers import (
    UtilisateurSerializer,
    UtilisateurInscriptionSerializer,
    UtilisateurConnexionSerializer,
    UtilisateurProfileSerializer,
    ChangementMotDePasseSerializer,
    AdministrateurSerializer
)

# =============================================================================
# FONCTIONS HELPER
# =============================================================================

def normalize_data(data):
    """Normalise les données reçues (accepte list ou dict)"""
    if isinstance(data, list) and len(data) > 0:
        return data[0] if isinstance(data[0], dict) else {}
    return data if isinstance(data, dict) else {}

# =============================================================================
# VUES D'AUTHENTIFICATION
# =============================================================================

# Vue pour l'inscription des nouveaux utilisateurs
class InscriptionView(generics.CreateAPIView):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurInscriptionSerializer
    permission_classes = [permissions.AllowAny]

# Vue de connexion - génère les tokens JWT
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def connexion(request):
    """
    Endpoint de connexion qui accepte plusieurs formats de données
    """
    try:
        print("🔍 DEBUG: Début connexion")
        
        # Méthode 1: Utiliser request.data (géré par DRF)
        data = request.data
        email = None
        password = None
        
        # Traitement intelligent des données
        if isinstance(data, list):
            print(f"📦 Format LISTE détecté, longueur: {len(data)}")
            if len(data) > 0:
                item = data[0]
                if isinstance(item, dict):
                    email = item.get('email')
                    password = item.get('password')
                    print(f"✅ Email extrait de liste[0]: {email}")
                else:
                    print(f"⚠️ Premier élément n'est pas un dict: {type(item)}")
        elif isinstance(data, dict):
            print(f"📦 Format DICT détecté")
            email = data.get('email')
            password = data.get('password')
            print(f"✅ Email extrait de dict: {email}")
        else:
            print(f"⚠️ Format inattendu: {type(data)}")
        
        # Si aucune donnée trouvée, essayer de parser le body directement
        if not email or not password:
            print("🔄 Tentative de parsing direct du body...")
            try:
                import json
                body_data = json.loads(request.body)
                print(f"📊 Body parsé: {body_data}, type: {type(body_data)}")
                
                if isinstance(body_data, dict):
                    email = body_data.get('email')
                    password = body_data.get('password')
                elif isinstance(body_data, list) and len(body_data) > 0:
                    item = body_data[0]
                    email = item.get('email') if isinstance(item, dict) else None
                    password = item.get('password') if isinstance(item, dict) else None
            except Exception as parse_error:
                print(f"❌ Erreur parsing body: {parse_error}")
        
        print(f"🎯 Email final: {email}")
        print(f"🎯 Password final: {'*' * len(password) if password else 'None'}")
        
        if not email or not password:
            return Response(
                {'success': False, 'error': 'Email et mot de passe requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authentification avec le modèle Utilisateur personnalisé
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            # Vérifier que l'utilisateur est actif
            if not user.is_active:
                return Response(
                    {'success': False, 'error': 'Ce compte est désactivé'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # ✅ GÉNÉRER LES TOKENS JWT
            refresh = RefreshToken.for_user(user)
            
            # Construire la réponse avec les attributs du modèle Utilisateur
            user_data = {
                'id_utilisateur': user.id_utilisateur,
                'email': user.email,
                'nom': user.nom,
                'prenom': user.prenom,
                # Champs de date
                'date_inscription': user.date_joined,
                'derniere_connexion': user.last_login,
                # Champs de statut
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_admin': user.is_admin,
            }
            
            # Vérifier si c'est un Administrateur
            try:
                administrateur = Administrateur.objects.get(id_utilisateur=user.id_utilisateur)
                user_data['is_administrateur'] = True
                user_data['id_administrateur'] = administrateur.id_administrateur
            except Administrateur.DoesNotExist:
                user_data['is_administrateur'] = False
            
            return Response({
                'success': True,
                'message': 'Connexion réussie',
                'user': user_data,
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }, status=status.HTTP_200_OK)
        else:
            print(f"❌ Authentification échouée pour: {email}")
            # Vérifier si l'email existe mais le mot de passe est incorrect
            try:
                user_exists = Utilisateur.objects.filter(email=email).exists()
                if user_exists:
                    return Response(
                        {'success': False, 'error': 'Mot de passe incorrect'}, 
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                else:
                    return Response(
                        {'success': False, 'error': 'Aucun compte trouvé avec cet email'}, 
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            except:
                return Response(
                    {'success': False, 'error': 'Email ou mot de passe incorrect'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
    except Exception as e:
        print("❌ ERREUR CONNEXION:", str(e))
        import traceback
        traceback.print_exc()
        return Response(
            {'success': False, 'error': f'Erreur lors de la connexion: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
# Vue de déconnexion - blacklist le token
@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def deconnexion(request):
    """
    Déconnexion simple sans authentification
    """
    try:
        refresh_token = None
        
        # Pour GET : prendre depuis query params
        if request.method == 'GET':
            refresh_token = request.GET.get('refresh_token')
        # Pour POST : prendre depuis body
        else:
            data = normalize_data(request.data)
            refresh_token = data.get('refresh_token') or data.get('refresh')
        
        # Blacklist si token fourni
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        
        return Response({
            'success': True,
            'message': 'Déconnexion réussie'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
        
# Vue pour rafraîchir le token JWT
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def rafraichir_token(request):
    """
    Rafraîchir le token JWT
    """
    try:
        data = normalize_data(request.data)
        refresh_token = data.get('refresh') or data.get('refresh_token')
        
        if not refresh_token:
            return Response(
                {
                    'success': False,
                    'error': 'Refresh token manquant'
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            refresh = RefreshToken(refresh_token)
            new_access_token = str(refresh.access_token)
            
            return Response({
                'success': True,
                'access': new_access_token,
                'message': 'Token rafraîchi avec succès'
            })
            
        except Exception as e:
            print(f"Erreur RefreshToken: {e}")
            return Response(
                {
                    'success': False,
                    'error': 'Token de rafraîchissement invalide ou expiré'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        print(f"ERREUR rafraichir_token: {e}")
        import traceback
        traceback.print_exc()
        return Response(
            {
                'success': False,
                'error': f'Erreur serveur: {str(e)}'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Vue pour vérifier le token (GET et POST)
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def verifier_token(request):
    """Vérifier si le token est toujours valide"""
    return Response({
        'success': True,
        'valid': True,
        'method': request.method,
        'user': {
            'id_utilisateur': request.user.id_utilisateur,
            'email': request.user.email,
            'nom': request.user.nom,
            'prenom': request.user.prenom
        }
    })

# =============================================================================
# VUES DE PROFIL UTILISATEUR
# =============================================================================

# Vue pour récupérer le profil de l'utilisateur connecté (GET et POST)
# =============================================================================
# VUES DE PROFIL UTILISATEUR
# =============================================================================

# Vue pour récupérer le profil de l'utilisateur connecté (GET et POST)
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def profil_utilisateur(request):
    """Récupérer le profil utilisateur - accepte GET et POST"""
    try:
        # Utiliser le sérialiseur de profil
        serializer = UtilisateurProfileSerializer(request.user)
        
        # Récupérer les données sérialisées
        user_data = serializer.data
        
        # Vérifier si c'est un Administrateur (comme dans la fonction connexion)
        try:
            administrateur = Administrateur.objects.get(id_utilisateur=request.user.id_utilisateur)
            user_data['is_administrateur'] = True
            user_data['id_administrateur'] = administrateur.id_administrateur
        except Administrateur.DoesNotExist:
            user_data['is_administrateur'] = False
        
        # Ajouter les champs de date (comme dans la fonction connexion)
        if 'date_inscription' not in user_data:
            user_data['date_inscription'] = request.user.date_joined
        if 'derniere_connexion' not in user_data:
            user_data['derniere_connexion'] = request.user.last_login
        
        # Ajouter les champs de statut (comme dans la fonction connexion)
        user_data['is_active'] = request.user.is_active
        user_data['is_staff'] = request.user.is_staff
        user_data['is_admin'] = getattr(request.user, 'is_admin', False)
        
        response_data = {
            'success': True,
            'method': request.method,
            'user': user_data
        }
        
        # Pour POST, on peut inclure les données reçues
        if request.method == 'POST':
            data = normalize_data(request.data)
            if data:
                response_data['data_received'] = data
        
        return Response(response_data)
        
    except Exception as e:
        print(f"❌ ERREUR dans profil_utilisateur: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    
# Vue pour récupérer le profil complet utilisateur (avec statistiques) (GET et POST)
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """Profil complet avec statistiques - accepte GET et POST"""
    try:
        user = request.user
        profile_data = {
            'id_utilisateur': user.id_utilisateur,
            'email': user.email,
            'nom': user.nom,
            'prenom': user.prenom,
            'telephone': getattr(user, 'telephone', ''),
            'profession': getattr(user, 'profession', ''),
            'bio': getattr(user, 'bio', ''),
            'portfolio_count': getattr(user, 'portfolios', []).count() if hasattr(user, 'portfolios') else 0,
            'created_at': user.date_joined,
            'last_login': user.last_login
        }
        
        response_data = {
            'success': True,
            'method': request.method,
            'profile': profile_data
        }
        
        # Pour POST, on peut inclure les données reçues
        if request.method == 'POST':
            data = normalize_data(request.data)
            if data:
                response_data['data_received'] = data
        
        return Response(response_data)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# Vue pour modifier le profil utilisateur (PUT et POST)
@api_view(['PUT', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def modifier_profil(request):
    """Modifier le profil utilisateur - accepte PUT et POST"""
    try:
        data = normalize_data(request.data)
        
        serializer = UtilisateurProfileSerializer(
            request.user,
            data=data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'method': request.method,
                'message': 'Profil modifié avec succès',
                'user': serializer.data
            })
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# Vue pour mettre à jour les informations personnelles (PUT et POST)
@api_view(['PUT', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    """Mettre à jour les informations personnelles - accepte PUT et POST"""
    try:
        data = normalize_data(request.data)
        user = request.user
        
        # Mettre à jour les champs de base
        if 'firstname' in data:
            user.prenom = data['firstname']
        if 'lastname' in data:
            user.nom = data['lastname']
        if 'email' in data:
            user.email = data['email']
        if 'phone' in data:
            user.telephone = data['phone']
        if 'profession' in data:
            user.profession = data['profession']
        if 'bio' in data:
            user.bio = data['bio']
        
        user.save()
        
        # Retourner les données mises à jour
        updated_data = {
            'firstname': user.prenom,
            'lastname': user.nom,
            'email': user.email,
            'phone': getattr(user, 'telephone', ''),
            'profession': getattr(user, 'profession', ''),
            'bio': getattr(user, 'bio', '')
        }
        
        return Response({
            'success': True,
            'method': request.method,
            'message': 'Profil mis à jour avec succès',
            'user': updated_data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# Vue pour modifier les coordonnées utilisateur (PUT et POST)
@api_view(['PUT', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def modifier_coordonnees(request):
    """Modifier les coordonnées - accepte PUT et POST"""
    try:
        data = normalize_data(request.data)
        user = request.user
        
        # Mettre à jour les champs autorisés
        if 'email' in data:
            user.email = data['email']
        if 'telephone' in data:
            user.telephone = data['telephone']
        if 'profession' in data:
            user.profession = data['profession']
        if 'bio' in data:
            user.bio = data['bio']
        
        user.save()
        
        return Response({
            'success': True,
            'method': request.method,
            'message': 'Coordonnées mises à jour avec succès',
            'user': {
                'email': user.email,
                'telephone': getattr(user, 'telephone', ''),
                'profession': getattr(user, 'profession', ''),
                'bio': getattr(user, 'bio', '')
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# =============================================================================
# VUES DE GESTION DES MOTS DE PASSE
# =============================================================================

# Vue pour changer le mot de passe (avec sérialiseur) (POST)
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def changer_mot_de_passe(request):
    """Changer le mot de passe - POST seulement"""
    try:
        data = normalize_data(request.data)
        
        serializer = ChangementMotDePasseSerializer(
            data=data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Mot de passe modifié avec succès'
            })
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# Vue pour changer le mot de passe (version alternative) (POST)
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Changer le mot de passe - POST seulement"""
    try:
        data = normalize_data(request.data)
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        # Validation
        if not current_password or not new_password or not confirm_password:
            return Response({
                'success': False,
                'error': 'Tous les champs sont obligatoires'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if new_password != confirm_password:
            return Response({
                'success': False,
                'error': 'Les nouveaux mots de passe ne correspondent pas'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Vérifier l'ancien mot de passe
        if not request.user.check_password(current_password):
            return Response({
                'success': False,
                'error': 'Mot de passe actuel incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Changer le mot de passe
        request.user.set_password(new_password)
        request.user.save()
        
        # Mettre à jour la session pour éviter la déconnexion
        update_session_auth_hash(request, request.user)
        
        return Response({
            'success': True,
            'message': 'Mot de passe changé avec succès'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# Vue pour réinitialiser le mot de passe (oublié) (POST)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password(request):
    """Réinitialiser le mot de passe - POST seulement"""
    try:
        data = normalize_data(request.data)
        email = data.get('email')
        
        if not email:
            return Response({
                'success': False,
                'error': 'Email requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si l'utilisateur existe
        try:
            user = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Aucun utilisateur trouvé avec cet email'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Ici vous pouvez implémenter la logique d'envoi d'email de réinitialisation
        return Response({
            'success': True,
            'message': 'Email de réinitialisation envoyé avec succès',
            'email': email
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# =============================================================================
# VUES DE GESTION DES PORTFOLIOS
# =============================================================================

# Vue pour récupérer les portfolios de l'utilisateur (GET et POST)
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def user_portfolios(request):
    """Récupérer les portfolios - accepte GET et POST"""
    try:
        # Supposons que vous avez un modèle Portfolio lié à Utilisateur
        portfolios = getattr(request.user, 'portfolios', []).all()
        
        portfolios_data = []
        for portfolio in portfolios:
            portfolios_data.append({
                'id': portfolio.id,
                'title': portfolio.titre,
                'description': portfolio.description,
                'template': portfolio.template,
                'is_published': portfolio.publie,
                'created_at': portfolio.date_creation,
                'updated_at': portfolio.date_modification
            })
        
        response_data = {
            'success': True,
            'method': request.method,
            'portfolios': portfolios_data
        }
        
        # Pour POST, on peut inclure les données reçues
        if request.method == 'POST':
            data = normalize_data(request.data)
            if data:
                response_data['data_received'] = data
        
        return Response(response_data)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# =============================================================================
# VUES DE STATISTIQUES ET DONNÉES
# =============================================================================

# Vue pour obtenir les statistiques utilisateur (GET et POST)
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """Obtenir les statistiques - accepte GET et POST"""
    try:
        user = request.user
        
        stats = {
            'portfolio_count': getattr(user, 'portfolios', []).count() if hasattr(user, 'portfolios') else 0,
            'projects_count': 0,  # À adapter selon vos modèles
            'views_count': 0,     # À adapter selon vos modèles
            'likes_count': 0,     # À adapter selon vos modèles
            'member_since': user.date_joined,
            'last_login': user.last_login
        }
        
        response_data = {
            'success': True,
            'method': request.method,
            'stats': stats
        }
        
        # Pour POST, on peut inclure les données reçues
        if request.method == 'POST':
            data = normalize_data(request.data)
            if data:
                response_data['data_received'] = data
        
        return Response(response_data)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# Vue pour exporter les données utilisateur (GET et POST)
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def export_data(request):
    """Exporter les données - accepte GET et POST"""
    try:
        user = request.user
        
        # Récupérer toutes les données de l'utilisateur
        user_data = {
            'profile': {
                'nom': user.nom,
                'prenom': user.prenom,
                'email': user.email,
                'telephone': getattr(user, 'telephone', ''),
                'profession': getattr(user, 'profession', ''),
                'bio': getattr(user, 'bio', ''),
                'date_inscription': user.date_joined,
                'derniere_connexion': user.last_login
            },
            'portfolios': [],
            'activity': []  # À compléter avec d'autres données
        }
        
        response_data = {
            'success': True,
            'method': request.method,
            'data': user_data
        }
        
        # Pour POST, on peut inclure les données reçues
        if request.method == 'POST':
            data = normalize_data(request.data)
            if data:
                response_data['data_received'] = data
        
        return Response(response_data)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# =============================================================================
# VUES DE GESTION DU COMPTE
# =============================================================================

# Vue pour vérifier l'email (POST)
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def verify_email(request):
    """Vérifier l'email - POST seulement"""
    try:
        data = normalize_data(request.data)
        user = request.user
        
        # Ici vous pouvez implémenter la logique d'envoi d'email de vérification
        # Simuler l'envoi d'email (à remplacer par votre logique réelle)
        return Response({
            'success': True,
            'message': 'Email de vérification envoyé avec succès',
            'email': user.email
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# Vue pour supprimer le compte utilisateur (DELETE et POST)
@api_view(['DELETE', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def delete_account(request):
    """Supprimer le compte - accepte DELETE et POST"""
    try:
        data = normalize_data(request.data)
        user = request.user
        password_confirmation = data.get('password')
        
        if not password_confirmation:
            return Response({
                'success': False,
                'error': 'Confirmation par mot de passe requise'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Vérifier le mot de passe
        if not user.check_password(password_confirmation):
            return Response({
                'success': False,
                'error': 'Mot de passe incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Supprimer l'utilisateur
        user.delete()
        
        return Response({
            'success': True,
            'method': request.method,
            'message': 'Compte supprimé avec succès'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# =============================================================================
# VUES ADMINISTRATEUR
# =============================================================================

# Vue ADMIN - Lister tous les utilisateurs (GET)
class UtilisateurListView(generics.ListAPIView):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]

# Vue ADMIN - Gérer un utilisateur spécifique
class UtilisateurDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAdminUser]