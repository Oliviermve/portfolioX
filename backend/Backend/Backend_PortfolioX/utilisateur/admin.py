from django.contrib import admin
from .models import Utilisateur, Administrateur

admin.site.register(Utilisateur)
admin.site.register(Administrateur)