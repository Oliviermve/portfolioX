# Backend PortfolioX

backend PortfolioX — API Django REST pour gérer les utilisateurs et les portfolios.

## Vue d'ensemble
Ce dépôt contient le backend de PortfolioX, construit avec Django 4.2+ et Django REST Framework. L'architecture est modulaire (applications `utilisateur` et `portfolio`) et s'appuie sur JWT pour l'authentification.

Arborescence principale
```
Backend_PortfolioX/
├── Backend_PortfolioX/             # Configuration Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── utilisateur/                     # Gestion des utilisateurs
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── admin.py
├── portfolio/                       # Gestion des portfolios
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── admin.py
└── manage.py
```

# 1. Installer les dépendances
bash

pip install -r requirements.txt

# 2. Appliquer les migrations
bash

python3 manage.py makemigrations
python3 manage.py migrate

# 3. Créer un superutilisateur (optionnel)
bash

python manage.py createsuperuser

6. Lancer le serveur
bash

python3 manage.py runserver

LVoici toutes les URLs que vous pouvez tester pour votre API PortfolioX :
URLs d'Administration

 Interface Admin : http://127.0.0.1:8000/admin/

# Toute les autres routes API sont directement afficher :
      
par  http://127.0.0.1:8000/api/

# tester directement chaques routes

Vérification Token : http://127.0.0.1:8000/api/token/verify/

Authentification

    Inscription : http://127.0.0.1:8000/api/auth/inscription/ (POST)

    Connexion : http://127.0.0.1:8000/api/auth/connexion/ (POST)

    Déconnexion : http://127.0.0.1:8000/api/auth/deconnexion/ (POST)

    Rafraîchir Token : http://127.0.0.1:8000/api/auth/rafraichir-token/ (POST)

    Vérifier Token : http://127.0.0.1:8000/api/auth/verifier-token/ (POST)

    Profil : http://127.0.0.1:8000/api/auth/profil/ (GET)

    Modifier Profil : http://127.0.0.1:8000/api/auth/profil/modifier/ (PUT/PATCH)

    Statistiques : http://127.0.0.1:8000/api/auth/profil/stats/ (GET)

    Exporter Données : http://127.0.0.1:8000/api/auth/profil/export/ (GET)

    Changer Mot de Passe : http://127.0.0.1:8000/api/auth/changer-mot-de-passe/ (POST)

    Réinitialiser Mot de Passe : http://127.0.0.1:8000/api/auth/reinitialiser-mot-de-passe/ (POST)

    Vérifier Email : http://127.0.0.1:8000/api/auth/verifier-email/ (POST)

    Modifier Coordonnées : http://127.0.0.1:8000/api/auth/coordonnees/ (PUT/PATCH)

    Supprimer Compte : http://127.0.0.1:8000/api/auth/supprimer-compte/ (DELETE)

    Mes Portfolios : http://127.0.0.1:8000/api/auth/portfolios/ (GET)

Administration Utilisateurs (Admin seulement)

    Liste Utilisateurs : http://127.0.0.1:8000/api/auth/admin/utilisateurs/ (GET)

    Détail Utilisateur : http://127.0.0.1:8000/api/auth/admin/utilisateurs/1/ (GET)

Portfolios - CRUD

    Liste Portfolios : http://127.0.0.1:8000/api/portfolio/portfolios/ (GET)

    Créer Portfolio : http://127.0.0.1:8000/api/portfolio/portfolios/ (POST)

    Détail Portfolio (ID=1) : http://127.0.0.1:8000/api/portfolio/portfolios/{id_utilisateur}/ (GET)

    Modifier Portfolio (ID=1) : http://127.0.0.1:8000/api/portfolio/portfolios/{id_utilisateur}/ (PUT)

    Modifier Partiel (ID=1) : http://127.0.0.1:8000/api/portfolio/portfolios/{id_utilisateur}/ (PATCH)

    Supprimer Portfolio (ID=1) : http://127.0.0.1:8000/api/portfolio/portfolios/{id_utilisateur}/ (DELETE)

Portfolios - Actions Spéciales

    Mes Portfolios : http://127.0.0.1:8000/api/portfolio/portfolios/my/ (GET)

    Portfolios Publiés : http://127.0.0.1:8000/api/portfolio/portfolios/published/ (GET)

    Recherche Portfolios : http://127.0.0.1:8000/api/portfolio/portfolios/search/ (GET)

    Publier Portfolio (ID=1) : http://127.0.0.1:8000/api/portfolio/portfolios/{id_utilisateur}/publish/ (POST)

    Statistiques Portfolio (ID=1) : http://127.0.0.1:8000/api/portfolio/portfolios/v/stats/ (GET)

    Dupliquer Portfolio (ID=1) : http://127.0.0.1:8000/api/portfolio/portfolios/{id_utilisateur}/duplicate/ (POST)

    Ajouter Contact (ID=1) : http://127.0.0.1:8000/api/portfolio/portfolios/{id_utilisateur}/add-contact/ (POST)

    Ajouter Compétence (ID=1) : http://127.0.0.1:8000/api/portfolio/portfolios/{id_utilisateur}/add-competence/ (POST)

    Ajouter Projet (ID=1) : http://127.0.0.1:8000/api/portfolio/portfolios/1/add-projet/ (POST)

Contacts

    Liste Contacts : http://127.0.0.1:8000/api/portfolio/contacts/ (GET)

    Créer Contact : http://127.0.0.1:8000/api/portfolio/contacts/ (POST)

    Détail Contact (ID=1) : http://127.0.0.1:8000/api/portfolio/contacts/{id_utilisateur}/ (GET)

    Modifier Contact (ID=1) : http://127.0.0.1:8000/api/portfolio/contacts/{id_utilisateur}/ (PUT)

    Modifier Partiel Contact (ID=1) : http://127.0.0.1:8000/api/portfolio/contacts/{id_utilisateur}/ (PATCH)

    Supprimer Contact (ID=1) : http://127.0.0.1:8000/api/portfolio/contacts/{id_utilisateur}/ (DELETE)

    Contacts Principaux : http://127.0.0.1:8000/api/portfolio/contacts/principaux/ (GET)

Compétences

    Liste Compétences : http://127.0.0.1:8000/api/portfolio/competences/ (GET)

    Créer Compétence : http://127.0.0.1:8000/api/portfolio/competences/ (POST)

    Détail Compétence (ID=1) : http://127.0.0.1:8000/api/portfolio/competences/{id_utilisateur}/ (GET)

    Modifier Compétence (ID=1) : http://127.0.0.1:8000/api/portfolio/competences/{id_utilisateur}/ (PUT)

    Modifier Partiel Compétence (ID=1) : http://127.0.0.1:8000/api/portfolio/competences/{id_utilisateur}/ (PATCH)

    Supprimer Compétence (ID=1) : http://127.0.0.1:8000/api/portfolio/competences/{id_utilisateur}/ (DELETE)

    Compétences par Catégorie : http://127.0.0.1:8000/api/portfolio/competences/par-categorie/ (GET)

Projets

    Liste Projets : http://127.0.0.1:8000/api/portfolio/projets/ (GET)

    Créer Projet : http://127.0.0.1:8000/api/portfolio/projets/ (POST)

    Détail Projet (ID=1) : http://127.0.0.1:8000/api/portfolio/projets/{id_utilisateur}/ (GET)

    Modifier Projet (ID=1) : http://127.0.0.1:8000/api/portfolio/projets/{id_utilisateur}/ (PUT)

    Modifier Partiel Projet (ID=1) : http://127.0.0.1:8000/api/portfolio/projets/{id_utilisateur}/ (PATCH)

    Supprimer Projet (ID=1) : http://127.0.0.1:8000/api/portfolio/projets/{id_utilisateur}/ (DELETE)

    Projets Publics : http://127.0.0.1:8000/api/portfolio/projets/publics/ (GET)

URLs Utiles pour Tests

    Test API Racine : http://127.0.0.1:8000/

    Interface Admin : http://127.0.0.1:8000/admin/ (login requis)

    Page d'Accueil API : http://127.0.0.1:8000/api/ (si vous avez configuré une vue racine)

Ordre Recommandé pour Tester

    Inscription (POST) → http://127.0.0.1:8000/api/auth/inscription/

    Connexion (POST) → http://127.0.0.1:8000/api/auth/connexion/

    Créer Contact (POST) → http://127.0.0.1:8000/api/portfolio/contacts/

    Créer Compétence (POST) → http://127.0.0.1:8000/api/portfolio/competences/

    Créer Projet (POST) → http://127.0.0.1:8000/api/portfolio/projets/

    Créer Portfolio (POST) → http://127.0.0.1:8000/api/portfolio/portfolios/

    Ajouter éléments au portfolio → http://127.0.0.1:8000/api/portfolio/portfolios/{id_utilisateur}/add-contact/ etc.

Note : Pour les URLs qui nécessitent l'authentification (la plupart), vous devrez inclure le token JWT dans l'en-tête :
text

Authorization: Bearer <votre_token>

Si vous voulez tester avec cURL, voici un exemple :
bash

# Connexion
curl -X POST http://127.0.0.1:8000/api/auth/connexion/ \
  -H "Content-Type: application/json" \
  -d '{"email": "votre@email.com", "password": "votre_mot_de_passe"}'

# Ensuite utiliser le token retourné
curl http://127.0.0.1:8000/api/portfolio/contacts/ \
  -H "Authorization: Bearer <votre_token>"



