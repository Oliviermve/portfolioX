# Import des modules nécessaires pour les serializers et l'authentification
from rest_framework import serializers
from django.contrib.auth import authenticate  # Pour vérifier les identifiants
from django.contrib.auth.password_validation import validate_password  # Validation force mot de passe
from .models import Utilisateur, Administrateur  # Import des modèles

# Serializer pour l'inscription d'un nouvel utilisateur
class UtilisateurInscriptionSerializer(serializers.ModelSerializer):
    # Champ mot de passe avec validation et masquage
    password = serializers.CharField(
        write_only=True,  # Ne sera pas renvoyé dans la réponse
        style={'input_type': 'password'},  # Affiche des points dans les formulaires
        validators=[validate_password]  # Utilise les validateurs Django de mot de passe
    )
    # Champ de confirmation du mot de passe
    password_confirmation = serializers.CharField(
        write_only=True, 
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = Utilisateur  # Modèle associé à ce serializer
        fields = ['id_utilisateur', 'nom', 'prenom', 'email', 'password', 'password_confirmation']
        read_only_fields = ['id_utilisateur']  # L'ID est généré automatiquement
    
    # Validation globale pour vérifier que les mots de passe correspondent
    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return data  # Retourne les données si validation OK
    
    # Surcharge de la méthode create pour gérer le mot de passe
    def create(self, validated_data):
        validated_data.pop('password_confirmation')  # Supprime le champ confirmation
        password = validated_data.pop('password')  # Récupère et supprime le mot de passe
        # Crée l'utilisateur sans le mot de passe
        user = Utilisateur.objects.create_user(**validated_data)
        user.set_password(password)  # Hash et assigne le mot de passe
        user.save()  # Sauvegarde l'utilisateur
        return user  # Retourne l'utilisateur créé

# Serializer pour la connexion (ne repose pas sur un modèle)
class UtilisateurConnexionSerializer(serializers.Serializer):
    email = serializers.EmailField()  # Champ email avec validation
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    # Validation personnalisée pour l'authentification
    def validate(self, data):
        email = data.get('email')  # Récupère l'email
        password = data.get('password')  # Récupère le mot de passe
        
        if email and password:  # Vérifie que les deux champs sont présents
            # Tente d'authentifier l'utilisateur
            user = authenticate(username=email, password=password)
            if user:  # Si l'utilisateur existe
                if user.is_active:  # Vérifie que le compte est actif
                    data['user'] = user  # Ajoute l'utilisateur aux données validées
                else:
                    raise serializers.ValidationError("Le compte utilisateur est désactivé.")
            else:
                raise serializers.ValidationError("Identifiants invalides.")
        else:
            raise serializers.ValidationError("Email et mot de passe sont requis.")
        
        return data  # Retourne les données avec l'utilisateur authentifié

# Serializer pour afficher les informations utilisateur (lecture seule)
class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id_utilisateur', 'nom', 'prenom', 'email', 'date_joined', 'last_login']
        read_only_fields = ['id_utilisateur', 'date_joined', 'last_login']  # Champs non modifiables

# Serializer pour le profil utilisateur (modification limitée)
class UtilisateurProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id_utilisateur', 'nom', 'prenom', 'email', 'date_joined', 'last_login']
        read_only_fields = ['id_utilisateur', 'email', 'date_joined', 'last_login']  # Email non modifiable

# Serializer pour changer le mot de passe (ne repose pas sur un modèle)
class ChangementMotDePasseSerializer(serializers.Serializer):
    ancien_mot_de_passe = serializers.CharField(write_only=True, style={'input_type': 'password'})
    nouveau_mot_de_passe = serializers.CharField(
        write_only=True, 
        style={'input_type': 'password'},
        validators=[validate_password]  # Validation force du nouveau mot de passe
    )
    confirmation_mot_de_passe = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    # Validation de l'ancien mot de passe
    def validate_ancien_mot_de_passe(self, value):
        user = self.context['request'].user  # Récupère l'utilisateur connecté
        if not user.check_password(value):  # Vérifie si l'ancien mot de passe est correct
            raise serializers.ValidationError("L'ancien mot de passe est incorrect.")
        return value  # Retourne la valeur si correcte
    
    # Validation globale pour la correspondance des nouveaux mots de passe
    def validate(self, data):
        if data['nouveau_mot_de_passe'] != data['confirmation_mot_de_passe']:
            raise serializers.ValidationError({"nouveau_mot_de_passe": "Les mots de passe ne correspondent pas."})
        return data  # Retourne les données si validation OK
    
    # Méthode pour sauvegarder le nouveau mot de passe
    def save(self, **kwargs):
        user = self.context['request'].user  # Récupère l'utilisateur connecté
        # Hash et assigne le nouveau mot de passe
        user.set_password(self.validated_data['nouveau_mot_de_passe'])
        user.save()  # Sauvegarde l'utilisateur
        return user  # Retourne l'utilisateur modifié

# Serializer pour les administrateurs (affichage des détails utilisateur)
class AdministrateurSerializer(serializers.ModelSerializer):
    utilisateur_details = UtilisateurSerializer(source='utilisateur_ptr', read_only=True)
    
    class Meta:
        model = Administrateur
        fields = ['id_administrateur', 'utilisateur_details']
        read_only_fields = ['id_administrateur']  # ID administrateur non modifiable