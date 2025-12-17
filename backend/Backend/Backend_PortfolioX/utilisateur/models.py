from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class UtilisateurManager(BaseUserManager):
    def create_user(self, email, nom, prenom, password=None):
        if not email:
            raise ValueError('L\'email est obligatoire')
        
        user = self.model(
            email=self.normalize_email(email),
            nom=nom,
            prenom=prenom,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nom, prenom, password=None):
        user = self.create_user(
            email=email,
            password=password,
            nom=nom,
            prenom=prenom
        )
        user.is_admin = True
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

class Utilisateur(AbstractBaseUser):
    id_utilisateur = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)
    is_admin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']
    
    objects = UtilisateurManager()
    
    def __str__(self):
        return f"{self.prenom} {self.nom}"
    
    def has_perm(self, perm, obj=None):
        return self.is_admin
    
    def has_module_perms(self, app_label):
        return True

class Administrateur(Utilisateur):
    id_administrateur = models.AutoField(primary_key=True)
    
    def __str__(self):
        return f"Admin: {self.prenom} {self.nom}"