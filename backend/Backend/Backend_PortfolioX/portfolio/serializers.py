from rest_framework import serializers
from .models import Contact, Competence, Projet, Portfolio
from utilisateur.models import Utilisateur

# Serializer pour l'utilisateur (simplifié)
class UtilisateurSimpleSerializer(serializers.ModelSerializer):
    nom_complet = serializers.SerializerMethodField()
    
    class Meta:
        model = Utilisateur
        fields = ['id_utilisateur', 'prenom', 'nom', 'email', 'nom_complet']
        read_only_fields = fields
    
    def get_nom_complet(self, obj):
        if hasattr(obj, 'prenom') and hasattr(obj, 'nom'):
            return f"{obj.prenom} {obj.nom}"
        elif hasattr(obj, 'first_name') and hasattr(obj, 'last_name'):
            return f"{obj.first_name} {obj.last_name}"
        elif hasattr(obj, 'username'):
            return obj.username
        return str(obj)

# Serializer pour Contact
class ContactSerializer(serializers.ModelSerializer):
    utilisateur = serializers.PrimaryKeyRelatedField(
        read_only=True,
        default=serializers.CurrentUserDefault()
    )
    
    class Meta:
        model = Contact
        fields = [
            'id_contact', 'type_contact', 'valeur_contact', 'utilisateur',
            'est_principal', 'ordre', 'date_ajout'
        ]
        read_only_fields = ['id_contact', 'date_ajout']
    
    def create(self, validated_data):
        # Associer automatiquement l'utilisateur connecté
        validated_data['utilisateur'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate(self, data):
        # Validation personnalisée
        request = self.context.get('request')
        
        # Pour la création, vérifier que l'utilisateur ne dépasse pas la limite
        if request and request.method == 'POST':
            user_contacts = Contact.objects.filter(utilisateur=request.user).count()
            if user_contacts >= 10:  # Limite à 10 contacts par utilisateur
                raise serializers.ValidationError("Limite de 10 contacts atteinte")
            
            # Gérer le contact principal
            if data.get('est_principal', False):
                # Désactiver les autres contacts principaux
                Contact.objects.filter(utilisateur=request.user, est_principal=True).update(est_principal=False)
        
        return data

# Serializer pour Competence
class CompetenceSerializer(serializers.ModelSerializer):
    utilisateur = serializers.PrimaryKeyRelatedField(
        read_only=True,
        default=serializers.CurrentUserDefault()
    )
    
    class Meta:
        model = Competence
        fields = [
            'id_competence', 'nom_competence', 'niveau_competence', 'categorie',
            'utilisateur', 'annees_experience', 'description', 'est_visible',
            'ordre', 'date_ajout'
        ]
        read_only_fields = ['id_competence', 'date_ajout']
    
    def create(self, validated_data):
        validated_data['utilisateur'] = self.context['request'].user
        return super().create(validated_data)

# Serializer pour Projet
class ProjetSerializer(serializers.ModelSerializer):
    utilisateur = serializers.PrimaryKeyRelatedField(
        read_only=True,
        default=serializers.CurrentUserDefault()
    )
    
    class Meta:
        model = Projet
        fields = [
            'id_projet', 'titre_projet', 'description_projet', 'langage_projet',
            'utilisateur', 'lien_projet', 'lien_github', 'image_projet',
            'technologies', 'date_realisation', 'date_ajout', 'est_public',
            'est_termine', 'ordre'
        ]
        read_only_fields = ['id_projet', 'date_ajout']
    
    def create(self, validated_data):
        validated_data['utilisateur'] = self.context['request'].user
        return super().create(validated_data)

# Serializer pour Portfolio (Liste)
class PortfolioListSerializer(serializers.ModelSerializer):
    utilisateur = UtilisateurSimpleSerializer(read_only=True)
    nombre_contacts = serializers.SerializerMethodField()
    nombre_competences = serializers.SerializerMethodField()
    nombre_projets = serializers.SerializerMethodField()
    is_published = serializers.SerializerMethodField()
    
    class Meta:
        model = Portfolio
        fields = [
            'id_portfolio', 'titre', 'slug', 'utilisateur', 'statut',
            'date_creation', 'date_modification', 'vue_count',
            'nombre_contacts', 'nombre_competences', 'nombre_projets',
            'is_published'
        ]
        read_only_fields = fields
    
    def get_nombre_contacts(self, obj):
        return obj.contacts.count()
    
    def get_nombre_competences(self, obj):
        return obj.competences.count()
    
    def get_nombre_projets(self, obj):
        return obj.projets.count()
    
    def get_is_published(self, obj):
        return obj.is_published()

# Serializer pour Portfolio (Détail)
class PortfolioDetailSerializer(serializers.ModelSerializer):
    utilisateur = UtilisateurSimpleSerializer(read_only=True)
    contacts = ContactSerializer(many=True, read_only=True)
    competences = CompetenceSerializer(many=True, read_only=True)
    projets = ProjetSerializer(many=True, read_only=True)
    is_published = serializers.SerializerMethodField()
    can_be_published = serializers.SerializerMethodField()
    
    class Meta:
        model = Portfolio
        fields = [
            'id_portfolio', 'utilisateur', 'titre', 'slug', 'description',
            'titre_professionnel', 'biographie', 'photo_profil', 'statut',
            'date_creation', 'date_modification', 'date_publication',
            'contacts', 'competences', 'projets', 'vue_count',
            'theme_couleur', 'layout_type', 'meta_description', 'meta_keywords',
            'afficher_photo', 'afficher_competences', 'afficher_projets',
            'afficher_contacts', 'afficher_formations', 'afficher_experiences',
            'formations', 'experiences', 'langues', 'certifications', 'interets',
            'is_published', 'can_be_published'
        ]
        read_only_fields = [
            'id_portfolio', 'utilisateur', 'date_creation', 'date_modification',
            'date_publication', 'vue_count', 'slug'
        ]
    
    def get_is_published(self, obj):
        return obj.is_published()
    
    def get_can_be_published(self, obj):
        return obj.can_be_published()

# Serializer pour créer/update Portfolio
class PortfolioCreateUpdateSerializer(serializers.ModelSerializer):
    contacts_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Contact.objects.all(),
        write_only=True,
        required=False
    )
    competences_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Competence.objects.all(),
        write_only=True,
        required=False
    )
    projets_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Projet.objects.all(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Portfolio
        fields = [
            'titre', 'description', 'titre_professionnel', 'biographie',
            'photo_profil', 'statut', 'theme_couleur', 'layout_type',
            'meta_description', 'meta_keywords',
            'afficher_photo', 'afficher_competences', 'afficher_projets',
            'afficher_contacts', 'afficher_formations', 'afficher_experiences',
            'formations', 'experiences', 'langues', 'certifications', 'interets',
            'contacts_ids', 'competences_ids', 'projets_ids'
        ]
    
    def validate(self, data):
        request = self.context.get('request')
        
        # Vérifier que les contacts/compétences/projets appartiennent à l'utilisateur
        if request and request.user:
            utilisateur = request.user
            
            # Vérifier les contacts
            contacts_ids = data.get('contacts_ids', [])
            for contact in contacts_ids:
                if contact.utilisateur != utilisateur:
                    raise serializers.ValidationError(
                        f"Le contact {contact.id_contact} ne vous appartient pas"
                    )
            
            # Vérifier les compétences
            competences_ids = data.get('competences_ids', [])
            for competence in competences_ids:
                if competence.utilisateur != utilisateur:
                    raise serializers.ValidationError(
                        f"La compétence {competence.id_competence} ne vous appartient pas"
                    )
            
            # Vérifier les projets
            projets_ids = data.get('projets_ids', [])
            for projet in projets_ids:
                if projet.utilisateur != utilisateur:
                    raise serializers.ValidationError(
                        f"Le projet {projet.id_projet} ne vous appartient pas"
                    )
        
        return data
    
    def create(self, validated_data):
        # Extraire les IDs des relations
        contacts_ids = validated_data.pop('contacts_ids', [])
        competences_ids = validated_data.pop('competences_ids', [])
        projets_ids = validated_data.pop('projets_ids', [])
        
        # Associer l'utilisateur
        validated_data['utilisateur'] = self.context['request'].user
        
        # Créer le portfolio
        portfolio = Portfolio.objects.create(**validated_data)
        
        # Ajouter les relations
        portfolio.contacts.set(contacts_ids)
        portfolio.competences.set(competences_ids)
        portfolio.projets.set(projets_ids)
        
        return portfolio
    
    def update(self, instance, validated_data):
        # Extraire les IDs des relations
        contacts_ids = validated_data.pop('contacts_ids', None)
        competences_ids = validated_data.pop('competences_ids', None)
        projets_ids = validated_data.pop('projets_ids', None)
        
        # Mettre à jour les autres champs
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Mettre à jour les relations si fournies
        if contacts_ids is not None:
            instance.contacts.set(contacts_ids)
        if competences_ids is not None:
            instance.competences.set(competences_ids)
        if projets_ids is not None:
            instance.projets.set(projets_ids)
        
        instance.save()
        return instance

# Serializer pour publier un portfolio
class PortfolioPublishSerializer(serializers.Serializer):
    statut = serializers.ChoiceField(choices=Portfolio.STATUT_CHOICES)
    
    def update(self, instance, validated_data):
        statut = validated_data['statut']
        
        if statut == 'publie':
            # Vérifier si le portfolio peut être publié
            if not instance.can_be_published():
                raise serializers.ValidationError(
                    "Le portfolio ne remplit pas les conditions minimales pour publication. "
                    "Vérifiez que vous avez au moins une compétence et un projet public."
                )
            
            # Vérifier qu'il n'y a pas déjà un portfolio publié pour cet utilisateur
            existing_published = Portfolio.objects.filter(
                utilisateur=instance.utilisateur,
                statut='publie'
            ).exclude(id_portfolio=instance.id_portfolio)
            
            if existing_published.exists():
                raise serializers.ValidationError(
                    "Un portfolio est déjà publié pour cet utilisateur. "
                    "Archivez-le d'abord avant d'en publier un nouveau."
                )
        
        instance.statut = statut
        instance.save()
        
        return instance