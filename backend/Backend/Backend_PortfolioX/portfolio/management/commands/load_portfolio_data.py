import json
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from portfolio.models import Competence, Template, Projet, Contact

class Command(BaseCommand):
    help = 'Charge les données initiales depuis un fichier JSON'
    
    def handle(self, *args, **options):
        # Chemin vers le fichier JSON
        json_file = os.path.join(settings.BASE_DIR, 'portfolio', 'fixtures', 'data_initial.json')
        
        try:
            with open(json_file, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            # Charger les compétences
            self.load_competences(data.get('competences', []))
            
            # Charger les templates
            self.load_templates(data.get('templates', []))
            
            # Charger les projets
            self.load_projets(data.get('projets', []))
            
            # Charger les contacts
            self.load_contacts(data.get('contacts', []))
            
            self.stdout.write(
                self.style.SUCCESS('✅ Données initiales chargées avec succès !')
            )
            
        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR('❌ Fichier JSON non trouvé')
            )
        except json.JSONDecodeError:
            self.stdout.write(
                self.style.ERROR('❌ Erreur de décodage JSON')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erreur lors du chargement: {str(e)}')
            )
    
    def load_competences(self, competences_data):
        """Charge les compétences depuis les données JSON"""
        for comp_data in competences_data:
            Competence.objects.get_or_create(
                id_competence=comp_data['id_competence'],
                defaults={
                    'nom_competence': comp_data['nom_competence'],
                    'niveau_competence': comp_data['niveau_competence']
                }
            )
        self.stdout.write(f'✅ {len(competences_data)} compétences chargées')
    
    def load_templates(self, templates_data):
        """Charge les templates depuis les données JSON"""
        for template_data in templates_data:
            Template.objects.get_or_create(
                id_template=template_data['id_template'],
                defaults={
                    'nom_template': template_data['nom_template'],
                    'description_template': template_data['description_template'],
                    'fichier_html': template_data['fichier_html'],
                    'image_template': template_data.get('image_template', '')
                }
            )
        self.stdout.write(f'✅ {len(templates_data)} templates chargés')
    
    def load_projets(self, projets_data):
        """Charge les projets depuis les données JSON"""
        for projet_data in projets_data:
            Projet.objects.get_or_create(
                id_projet=projet_data['id_projet'],
                defaults={
                    'titre_projet': projet_data['titre_projet'],
                    'description_projet': projet_data['description_projet'],
                    'langage_projet': projet_data['langage_projet'],
                    'lien_projet': projet_data.get('lien_projet', ''),
                    'image_projet': projet_data.get('image_projet', '')
                }
            )
        self.stdout.write(f'✅ {len(projets_data)} projets chargés')
    
    def load_contacts(self, contacts_data):
        """Charge les contacts depuis les données JSON"""
        for contact_data in contacts_data:
            Contact.objects.get_or_create(
                id_contact=contact_data['id_contact'],
                defaults={
                    'type_contact': contact_data['type_contact'],
                    'valeur_contact': contact_data['valeur_contact']
                }
            )
        self.stdout.write(f'✅ {len(contacts_data)} contacts chargés')