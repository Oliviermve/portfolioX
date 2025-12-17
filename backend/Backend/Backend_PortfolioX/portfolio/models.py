from django.db import models
from utilisateur.models import Utilisateur

class Contact(models.Model):
    TYPE_CONTACT_CHOICES = [
        ('email', 'Email'),
        ('telephone', 'Téléphone'),
        ('linkedin', 'LinkedIn'),
        ('github', 'GitHub'),
        ('twitter', 'Twitter'),
        ('autre', 'Autre'),
    ]
    
    id_contact = models.AutoField(primary_key=True)
    type_contact = models.CharField(max_length=20, choices=TYPE_CONTACT_CHOICES)
    valeur_contact = models.CharField(max_length=255)
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='contacts')
    est_principal = models.BooleanField(default=False, verbose_name='Contact principal')
    ordre = models.PositiveIntegerField(default=0, verbose_name='Ordre d\'affichage')
    date_ajout = models.DateTimeField(auto_now_add=True, verbose_name='Date d\'ajout')
    
    class Meta:
        verbose_name = 'Contact'
        verbose_name_plural = 'Contacts'
        ordering = ['ordre', 'date_ajout']
        db_table = 'portfolio_contact'
    
    def __str__(self):
        return f"{self.type_contact}: {self.valeur_contact}"

class Competence(models.Model):
    NIVEAU_CHOICES = [
        ('debutant', 'Débutant'),
        ('intermediaire', 'Intermédiaire'),
        ('avance', 'Avancé'),
        ('expert', 'Expert'),
    ]
    
    CATEGORIE_CHOICES = [
        ('frontend', 'Frontend'),
        ('backend', 'Backend'),
        ('mobile', 'Mobile'),
        ('devops', 'DevOps'),
        ('base_donnees', 'Base de données'),
        ('design', 'Design'),
        ('autres', 'Autres'),
    ]
    
    id_competence = models.AutoField(primary_key=True)
    nom_competence = models.CharField(max_length=100, verbose_name='Nom de la compétence')
    niveau_competence = models.CharField(max_length=20, choices=NIVEAU_CHOICES, verbose_name='Niveau')
    categorie = models.CharField(max_length=20, choices=CATEGORIE_CHOICES, default='autres', verbose_name='Catégorie')
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='competences')
    annees_experience = models.PositiveIntegerField(default=0, verbose_name='Années d\'expérience')
    description = models.TextField(blank=True, verbose_name='Description')
    est_visible = models.BooleanField(default=True, verbose_name='Visible')
    ordre = models.PositiveIntegerField(default=0, verbose_name='Ordre d\'affichage')
    date_ajout = models.DateTimeField(auto_now_add=True, verbose_name='Date d\'ajout')
    
    class Meta:
        verbose_name = 'Compétence'
        verbose_name_plural = 'Compétences'
        ordering = ['categorie', 'ordre', 'nom_competence']
        unique_together = ['utilisateur', 'nom_competence']
        db_table = 'portfolio_competence'
    
    def __str__(self):
        return f"{self.nom_competence} ({self.niveau_competence})"

class Projet(models.Model):
    id_projet = models.AutoField(primary_key=True)
    titre_projet = models.CharField(max_length=200, verbose_name='Titre du projet')
    description_projet = models.TextField(verbose_name='Description')
    langage_projet = models.CharField(max_length=100, verbose_name='Langage principal')
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='projets')
    lien_projet = models.URLField(blank=True, null=True, verbose_name='Lien du projet')
    lien_github = models.URLField(blank=True, null=True, verbose_name='Lien GitHub')
    image_projet = models.ImageField(upload_to='projets/', blank=True, null=True, verbose_name='Image du projet')
    technologies = models.JSONField(default=list, blank=True, verbose_name='Technologies utilisées')
    date_realisation = models.DateField(null=True, blank=True, verbose_name='Date de réalisation')
    date_ajout = models.DateTimeField(auto_now_add=True, verbose_name='Date d\'ajout')
    est_public = models.BooleanField(default=True, verbose_name='Public')
    est_termine = models.BooleanField(default=True, verbose_name='Terminé')
    ordre = models.PositiveIntegerField(default=0, verbose_name='Ordre d\'affichage')
    image_projet = models.ImageField(
        upload_to='projet_photos/', 
        blank=True, 
        null=True, 
        verbose_name='Photo du projet'
    )
    
    class Meta:
        verbose_name = 'Projet'
        verbose_name_plural = 'Projets'
        ordering = ['ordre', '-date_realisation', 'titre_projet']
        db_table = 'portfolio_projet'
    
    def __str__(self):
        return self.titre_projet

class Portfolio(models.Model):
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('publie', 'Publié'),
        ('archive', 'Archivé'),
    ]
    
    id_portfolio = models.AutoField(primary_key=True)
    utilisateur = models.OneToOneField(
        Utilisateur, 
        on_delete=models.CASCADE, 
        related_name='portfolio'
    )
    
    # Informations de base
    titre = models.CharField(max_length=200, verbose_name='Titre du portfolio')
    slug = models.SlugField(max_length=200, unique=True, blank=True, verbose_name='Slug')
    description = models.TextField(blank=True, verbose_name='Description')
    titre_professionnel = models.CharField(max_length=200, blank=True, verbose_name='Titre professionnel')
    biographie = models.TextField(blank=True, verbose_name='Biographie')
    photo_profil = models.ImageField(
        upload_to='portfolio_photos/', 
        blank=True, 
        null=True, 
        verbose_name='Photo de profil'
    )
    
    # Statut et dates
    statut = models.CharField(
        max_length=20, 
        choices=STATUT_CHOICES, 
        default='brouillon', 
        verbose_name='Statut'
    )
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name='Date de création')
    date_modification = models.DateTimeField(auto_now=True, verbose_name='Date de modification')
    date_publication = models.DateTimeField(null=True, blank=True, verbose_name='Date de publication')
    
    # Relations avec les autres modèles
    contacts = models.ManyToManyField(
        Contact, 
        blank=True,
        related_name='portfolios',
        verbose_name='Contacts'
    )
    competences = models.ManyToManyField(
        Competence, 
        blank=True,
        related_name='portfolios',
        verbose_name='Compétences'
    )
    projets = models.ManyToManyField(
        Projet, 
        blank=True,
        related_name='portfolios',
        verbose_name='Projets'
    )
    
    # Métadonnées et statistiques
    vue_count = models.PositiveIntegerField(default=0, verbose_name='Nombre de vues')
    theme_couleur = models.CharField(max_length=7, default='#2563eb', verbose_name='Couleur du thème')
    layout_type = models.CharField(
        max_length=50, 
        default='classique',
        verbose_name='Type de mise en page'
    )
    meta_description = models.CharField(max_length=300, blank=True, verbose_name='Meta description')
    meta_keywords = models.CharField(max_length=200, blank=True, verbose_name='Mots-clés')
    
    # Paramètres de personnalisation
    afficher_photo = models.BooleanField(default=True, verbose_name='Afficher la photo')
    afficher_competences = models.BooleanField(default=True, verbose_name='Afficher les compétences')
    afficher_projets = models.BooleanField(default=True, verbose_name='Afficher les projets')
    afficher_contacts = models.BooleanField(default=True, verbose_name='Afficher les contacts')
    afficher_formations = models.BooleanField(default=True, verbose_name='Afficher les formations')
    afficher_experiences = models.BooleanField(default=True, verbose_name='Afficher les expériences')
    
    # Données supplémentaires (optionnelles, stockées en JSON)
    formations = models.JSONField(default=list, blank=True, verbose_name='Formations')
    experiences = models.JSONField(default=list, blank=True, verbose_name='Expériences')
    langues = models.JSONField(default=list, blank=True, verbose_name='Langues')
    certifications = models.JSONField(default=list, blank=True, verbose_name='Certifications')
    interets = models.JSONField(default=list, blank=True, verbose_name='Centres d\'intérêt')
    
    class Meta:
        verbose_name = 'Portfolio'
        verbose_name_plural = 'Portfolios'
        ordering = ['-date_modification']
        db_table = 'portfolio_portfolio'
    
    def __str__(self):
        # Utiliser les attributs disponibles du modèle Utilisateur
        nom_complet = ""
        try:
            # Essayer d'abord avec nom et prénom si disponibles
            if hasattr(self.utilisateur, 'nom') and hasattr(self.utilisateur, 'prenom'):
                nom_complet = f"{self.utilisateur.prenom} {self.utilisateur.nom}"
            # Sinon utiliser le nom d'utilisateur
            elif hasattr(self.utilisateur, 'username'):
                nom_complet = self.utilisateur.username
            else:
                nom_complet = str(self.utilisateur)
        except AttributeError:
            nom_complet = str(self.utilisateur)
        
        return f"Portfolio de {nom_complet} - {self.titre}"
    
    def save(self, *args, **kwargs):
        from django.utils.text import slugify
        
        # Générer un slug automatiquement si vide
        if not self.slug:
            base_slug = slugify(f"{self.utilisateur.prenom}-{self.utilisateur.nom}-{self.titre}")
            if len(base_slug) > 200:
                base_slug = base_slug[:200]
            self.slug = base_slug
            counter = 1
            while Portfolio.objects.filter(slug=self.slug).exists():
                self.slug = f"{base_slug}-{counter}"
                counter += 1
        
        # Mettre à jour la date de publication si le statut change
        if self.statut == 'publie' and not self.date_publication:
            self.date_publication = timezone.now()
        elif self.statut != 'publie':
            self.date_publication = None
        
        super().save(*args, **kwargs)
    
    def increment_vue_count(self):
        """Incrémenter le compteur de vues"""
        self.vue_count += 1
        self.save(update_fields=['vue_count'])
    
    def is_published(self):
        """Vérifier si le portfolio est publié"""
        return self.statut == 'publie'
    
    def get_absolute_url(self):
        """URL absolue du portfolio"""
        from django.urls import reverse
        return reverse('portfolio-detail', kwargs={'slug': self.slug})
    
    def get_contacts_principaux(self):
        """Récupérer les contacts principaux"""
        return self.contacts.filter(est_principal=True).order_by('ordre')
    
    def get_competences_par_categorie(self):
        """Récupérer les compétences groupées par catégorie"""
        competences = self.competences.filter(est_visible=True).order_by('categorie', 'ordre')
        result = {}
        for competence in competences:
            categorie = competence.get_categorie_display()
            if categorie not in result:
                result[categorie] = []
            result[categorie].append(competence)
        return result
    
    def get_projets_visibles(self):
        """Récupérer les projets visibles"""
        return self.projets.filter(est_public=True).order_by('ordre', '-date_realisation')
    
    def can_be_published(self):
        """Vérifier si le portfolio peut être publié"""
        # Vérifier les conditions minimales pour publication
        conditions = [
            self.titre.strip() != '',
            self.description.strip() != '',
            self.competences.exists(),
            self.projets.filter(est_public=True).exists(),
        ]
        return all(conditions)

# Import nécessaire pour timezone
from django.utils import timezone