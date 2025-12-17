# portfolio/views.py
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.db import transaction
from django.utils import timezone
from django.db import models  # Ajouter cette importation pour les statistiques

from .models import Contact, Competence, Projet, Portfolio
from .serializers import (
    ContactSerializer,
    CompetenceSerializer,
    ProjetSerializer,
    PortfolioListSerializer,
    PortfolioDetailSerializer,
    PortfolioCreateUpdateSerializer,
    PortfolioPublishSerializer
)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # CORRECTION : Utiliser request.user directement
        return obj.utilisateur == request.user

class PortfolioPermissions(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS and obj.is_published():
            return True
        # CORRECTION : Utiliser request.user directement
        return obj.utilisateur == request.user

class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        """
        Permettre l'accès public aux actions de lecture (list, retrieve, principaux)
        pour les contacts des portfolios publiés
        """
        if self.action in ['list', 'retrieve', 'principaux', 'portfolio_contacts']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            # Utilisateur connecté : voir ses contacts
            return Contact.objects.filter(utilisateur=self.request.user)
        else:
            # Utilisateur non connecté : voir les contacts des portfolios publiés
            return Contact.objects.filter(
                portfolios__statut='publie'
            ).distinct()
    
    def perform_create(self, serializer):
        # CORRECTION : Utiliser self.request.user directement
        serializer.save(utilisateur=self.request.user)
    
    @action(detail=False, methods=['get'])
    def principaux(self, request):
        """
        Récupérer les contacts principaux de tous les portfolios publiés
        """
        # Récupérer les contacts principaux des portfolios publiés
        contacts = Contact.objects.filter(
            portfolios__statut='publie',
            est_principal=True
        ).distinct()
        
        page = self.paginate_queryset(contacts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(contacts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def portfolio_contacts(self, request, portfolio_id=None):
        """Récupérer les contacts d'un portfolio spécifique (public)"""
        try:
            portfolio = Portfolio.objects.get(
                id_portfolio=portfolio_id,
                statut='publie'
            )
            contacts = portfolio.contacts.all()
            serializer = ContactSerializer(contacts, many=True)
            return Response(serializer.data)
        except Portfolio.DoesNotExist:
            return Response({"error": "Portfolio non trouvé ou non publié"}, status=404)

class CompetenceViewSet(viewsets.ModelViewSet):
    serializer_class = CompetenceSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nom_competence', 'description']
    filterset_fields = ['categorie', 'niveau_competence', 'est_visible']
    ordering_fields = ['nom_competence', 'categorie', 'ordre', 'annees_experience']
    
    def get_permissions(self):
        """
        Permettre l'accès public aux actions de lecture pour les compétences visibles
        des portfolios publiés
        """
        if self.action in ['list', 'retrieve', 'par_categorie']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            # Utilisateur connecté : voir ses compétences
            return Competence.objects.filter(utilisateur=self.request.user)
        else:
            # Utilisateur non connecté : voir les compétences visibles des portfolios publiés
            return Competence.objects.filter(
                portfolios__statut='publie',
                est_visible=True
            ).distinct()
    
    def perform_create(self, serializer):
        # CORRECTION : Utiliser self.request.user directement
        serializer.save(utilisateur=self.request.user)
    
    @action(detail=False, methods=['get'])
    def par_categorie(self, request):
        competences = self.get_queryset().filter(est_visible=True)
        result = {}
        for competence in competences:
            categorie = competence.get_categorie_display()
            if categorie not in result:
                result[categorie] = []
            serializer = self.get_serializer(competence)
            result[categorie].append(serializer.data)
        return Response(result)

class ProjetViewSet(viewsets.ModelViewSet):
    serializer_class = ProjetSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titre_projet', 'description_projet', 'langage_projet']
    filterset_fields = ['langage_projet', 'est_public', 'est_termine']
    ordering_fields = ['titre_projet', 'date_realisation', 'ordre']
    
    def get_permissions(self):
        """
        Permettre l'accès public aux actions de lecture pour les projets publics
        des portfolios publiés
        """
        if self.action in ['list', 'retrieve', 'publics']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            # Utilisateur connecté : voir ses projets
            return Projet.objects.filter(utilisateur=self.request.user)
        else:
            # Utilisateur non connecté : voir les projets publics des portfolios publiés
            return Projet.objects.filter(
                portfolios__statut='publie',
                est_public=True
            ).distinct()
    
    def perform_create(self, serializer):
        # CORRECTION : Utiliser self.request.user directement
        serializer.save(utilisateur=self.request.user)
    
    @action(detail=False, methods=['get'])
    def publics(self, request):
        projets = self.get_queryset().filter(est_public=True)
        page = self.paginate_queryset(projets)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(projets, many=True)
        return Response(serializer.data)

class PortfolioViewSet(viewsets.ModelViewSet):
    queryset = Portfolio.objects.all()
    permission_classes = [PortfolioPermissions]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titre', 'description', 'titre_professionnel', 'biographie']
    filterset_fields = ['statut', 'layout_type']
    ordering_fields = ['date_creation', 'date_modification', 'vue_count', 'titre']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PortfolioListSerializer
        elif self.action in ['retrieve', 'stats']:
            return PortfolioDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PortfolioCreateUpdateSerializer
        elif self.action == 'publish':
            return PortfolioPublishSerializer
        return PortfolioDetailSerializer
    
    def get_queryset(self):
        queryset = Portfolio.objects.select_related('utilisateur').all()
        statut = self.request.query_params.get('statut', None)
        if statut:
            queryset = queryset.filter(statut=statut)
        
        utilisateur_id = self.request.query_params.get('utilisateur', None)
        if utilisateur_id:
            queryset = queryset.filter(utilisateur__id_utilisateur=utilisateur_id)
        
        competence = self.request.query_params.get('competence', None)
        if competence:
            queryset = queryset.filter(competences__nom_competence__icontains=competence)
        
        langage = self.request.query_params.get('langage', None)
        if langage:
            queryset = queryset.filter(projets__langage_projet__icontains=langage)
        
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(statut='publie')
        elif not self.request.user.is_staff:
            # CORRECTION : Utiliser self.request.user directement
            queryset = queryset.filter(
                Q(statut='publie') | Q(utilisateur=self.request.user)
            )
        
        return queryset.distinct()
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_published():
            instance.increment_vue_count()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # CORRECTION : Utiliser request.user directement
        if Portfolio.objects.filter(utilisateur=request.user).exists():
            raise ValidationError("Vous avez déjà un portfolio")
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        detail_serializer = PortfolioDetailSerializer(
            serializer.instance,
            context={'request': request}
        )
        
        return Response(
            detail_serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.statut = 'archive'
        instance.save()
        return Response(
            {'message': 'Portfolio archivé avec succès'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def my_portfolio(self, request):
        # CORRECTION : Supprimer la vérification hasattr
        try:
            portfolio = Portfolio.objects.get(utilisateur=request.user)
            serializer = PortfolioDetailSerializer(
                portfolio,
                context={'request': request}
            )
            return Response(serializer.data)
        except Portfolio.DoesNotExist:
            return Response(
                {'message': 'Aucun portfolio trouvé pour cet utilisateur'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        portfolio = self.get_object()
        serializer = PortfolioPublishSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        try:
            serializer.update(portfolio, serializer.validated_data)
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(
            PortfolioDetailSerializer(portfolio, context={'request': request}).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        portfolio = self.get_object()
        stats = {
            'general': {
                'vues': portfolio.vue_count,
                'statut': portfolio.get_statut_display(),
                'date_creation': portfolio.date_creation,
                'date_modification': portfolio.date_modification,
                'date_publication': portfolio.date_publication,
                'jours_actif': (timezone.now() - portfolio.date_creation).days if portfolio.date_creation else 0
            },
            'contenu': {
                'contacts': portfolio.contacts.count(),
                'contacts_principaux': portfolio.contacts.filter(est_principal=True).count(),
                'competences': portfolio.competences.count(),
                'competences_visibles': portfolio.competences.filter(est_visible=True).count(),
                'projets': portfolio.projets.count(),
                'projets_publics': portfolio.projets.filter(est_public=True).count()
            },
            'competences_par_categorie': {},
            'projets_par_langage': {}
        }
        
        competences = portfolio.competences.all()
        for competence in competences:
            categorie = competence.get_categorie_display()
            if categorie not in stats['competences_par_categorie']:
                stats['competences_par_categorie'][categorie] = 0
            stats['competences_par_categorie'][categorie] += 1
        
        projets = portfolio.projets.all()
        for projet in projets:
            langage = projet.langage_projet
            if langage not in stats['projets_par_langage']:
                stats['projets_par_langage'][langage] = 0
            stats['projets_par_langage'][langage] += 1
        
        return Response(stats, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def published(self, request):
        portfolios = Portfolio.objects.filter(statut='publie')
        page = self.paginate_queryset(portfolios)
        if page is not None:
            serializer = PortfolioListSerializer(
                page,
                many=True,
                context={'request': request}
            )
            return self.get_paginated_response(serializer.data)
        serializer = PortfolioListSerializer(
            portfolios,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def duplicate(self, request, pk=None):
        portfolio = self.get_object()
        self.check_object_permissions(request, portfolio)
        
        # CORRECTION : Utiliser request.user directement
        if Portfolio.objects.filter(utilisateur=request.user).exists():
            raise ValidationError("Vous avez déjà un portfolio")
        
        new_portfolio = Portfolio.objects.create(
            utilisateur=request.user,
            titre=f"{portfolio.titre} (Copie)",
            description=portfolio.description,
            titre_professionnel=portfolio.titre_professionnel,
            biographie=portfolio.biographie,
            statut='brouillon',
            theme_couleur=portfolio.theme_couleur,
            layout_type=portfolio.layout_type,
            meta_description=portfolio.meta_description,
            meta_keywords=portfolio.meta_keywords,
            afficher_photo=portfolio.afficher_photo,
            afficher_competences=portfolio.afficher_competences,
            afficher_projets=portfolio.afficher_projets,
            afficher_contacts=portfolio.afficher_contacts,
            afficher_formations=portfolio.afficher_formations,
            afficher_experiences=portfolio.afficher_experiences,
            formations=portfolio.formations,
            experiences=portfolio.experiences,
            langues=portfolio.langues,
            certifications=portfolio.certifications,
            interets=portfolio.interets
        )
        
        for contact in portfolio.contacts.all():
            new_contact = Contact.objects.create(
                type_contact=contact.type_contact,
                valeur_contact=contact.valeur_contact,
                utilisateur=request.user,
                est_principal=contact.est_principal,
                ordre=contact.ordre
            )
            new_portfolio.contacts.add(new_contact)
        
        for competence in portfolio.competences.all():
            new_competence = Competence.objects.create(
                nom_competence=competence.nom_competence,
                niveau_competence=competence.niveau_competence,
                categorie=competence.categorie,
                utilisateur=request.user,
                annees_experience=competence.annees_experience,
                description=competence.description,
                est_visible=competence.est_visible,
                ordre=competence.ordre
            )
            new_portfolio.competences.add(new_competence)
        
        for projet in portfolio.projets.all():
            new_projet = Projet.objects.create(
                titre_projet=projet.titre_projet,
                description_projet=projet.description_projet,
                langage_projet=projet.langage_projet,
                utilisateur=request.user,
                lien_projet=projet.lien_projet,
                lien_github=projet.lien_github,
                technologies=projet.technologies,
                date_realisation=projet.date_realisation,
                est_public=projet.est_public,
                est_termine=projet.est_termine,
                ordre=projet.ordre
            )
            new_portfolio.projets.add(new_projet)
        
        return Response(
            PortfolioDetailSerializer(new_portfolio, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def add_contact(self, request, pk=None):
        portfolio = self.get_object()
        contact_id = request.data.get('contact_id')
        if not contact_id:
            return Response(
                {'error': 'contact_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            contact = Contact.objects.get(id_contact=contact_id)
            # CORRECTION : Utiliser request.user directement
            if contact.utilisateur != request.user:
                raise PermissionDenied("Ce contact ne vous appartient pas")
            portfolio.contacts.add(contact)
            return Response(
                PortfolioDetailSerializer(portfolio, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        except Contact.DoesNotExist:
            return Response(
                {'error': 'Contact non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def add_competence(self, request, pk=None):
        portfolio = self.get_object()
        competence_id = request.data.get('competence_id')
        if not competence_id:
            return Response(
                {'error': 'competence_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            competence = Competence.objects.get(id_competence=competence_id)
            # CORRECTION : Utiliser request.user directement
            if competence.utilisateur != request.user:
                raise PermissionDenied("Cette compétence ne vous appartient pas")
            portfolio.competences.add(competence)
            return Response(
                PortfolioDetailSerializer(portfolio, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        except Competence.DoesNotExist:
            return Response(
                {'error': 'Compétence non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def add_projet(self, request, pk=None):
        portfolio = self.get_object()
        projet_id = request.data.get('projet_id')
        if not projet_id:
            return Response(
                {'error': 'projet_id est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            projet = Projet.objects.get(id_projet=projet_id)
            # CORRECTION : Utiliser request.user directement
            if projet.utilisateur != request.user:
                raise PermissionDenied("Ce projet ne vous appartient pas")
            portfolio.projets.add(projet)
            return Response(
                PortfolioDetailSerializer(portfolio, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        except Projet.DoesNotExist:
            return Response(
                {'error': 'Projet non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        queryset = Portfolio.objects.filter(statut='publie')
        competence = request.query_params.get('competence', None)
        if competence:
            queryset = queryset.filter(competences__nom_competence__icontains=competence)
        
        langage = request.query_params.get('langage', None)
        if langage:
            queryset = queryset.filter(projets__langage_projet__icontains=langage)
        
        niveau = request.query_params.get('niveau', None)
        if niveau:
            queryset = queryset.filter(competences__niveau_competence=niveau)
        
        categorie = request.query_params.get('categorie', None)
        if categorie:
            queryset = queryset.filter(competences__categorie=categorie)
        
        page = self.paginate_queryset(queryset.distinct())
        if page is not None:
            serializer = PortfolioListSerializer(
                page,
                many=True,
                context={'request': request}
            )
            return self.get_paginated_response(serializer.data)
        
        serializer = PortfolioListSerializer(
            queryset.distinct(),
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def contacts_publics(self, request, pk=None):
        """
        Récupérer les contacts d'un portfolio publié (public)
        """
        portfolio = self.get_object()
        
        # Vérifier si le portfolio est publié
        if not portfolio.is_published():
            return Response(
                {"error": "Ce portfolio n'est pas publié"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        contacts = portfolio.contacts.all()
        serializer = ContactSerializer(contacts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def competences_publics(self, request, pk=None):
        """
        Récupérer les compétences d'un portfolio publié (public)
        """
        portfolio = self.get_object()
        
        if not portfolio.is_published():
            return Response(
                {"error": "Ce portfolio n'est pas publié"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        competences = portfolio.competences.filter(est_visible=True)
        serializer = CompetenceSerializer(competences, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def projets_publics(self, request, pk=None):
        """
        Récupérer les projets d'un portfolio publié (public)
        """
        portfolio = self.get_object()
        
        if not portfolio.is_published():
            return Response(
                {"error": "Ce portfolio n'est pas publié"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        projets = portfolio.projets.filter(est_public=True)
        serializer = ProjetSerializer(projets, many=True)
        return Response(serializer.data)

# ============================================================================
# VUES PUBLIQUES POUR LES DONNÉES DE PORTFOLIO
# ============================================================================

class PortfolioPublicContactsAPIView(APIView):
    """
    Vue publique pour récupérer les contacts d'un portfolio publié
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, portfolio_id):
        try:
            # Récupérer le portfolio publié
            portfolio = Portfolio.objects.get(
                id_portfolio=portfolio_id,
                statut='publie'
            )
            
            # Récupérer les contacts du portfolio
            contacts = portfolio.contacts.all()
            
            # Sérialiser les contacts
            serializer = ContactSerializer(contacts, many=True)
            
            return Response(serializer.data)
            
        except Portfolio.DoesNotExist:
            return Response(
                {"error": "Portfolio non trouvé ou non publié"},
                status=status.HTTP_404_NOT_FOUND
            )

class PortfolioPublicCompetencesAPIView(APIView):
    """
    Vue publique pour récupérer les compétences d'un portfolio publié
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, portfolio_id):
        try:
            portfolio = Portfolio.objects.get(
                id_portfolio=portfolio_id,
                statut='publie'
            )
            
            competences = portfolio.competences.filter(est_visible=True)
            serializer = CompetenceSerializer(competences, many=True)
            
            return Response(serializer.data)
            
        except Portfolio.DoesNotExist:
            return Response(
                {"error": "Portfolio non trouvé ou non publié"},
                status=status.HTTP_404_NOT_FOUND
            )

class PortfolioPublicProjetsAPIView(APIView):
    """
    Vue publique pour récupérer les projets d'un portfolio publié
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, portfolio_id):
        try:
            portfolio = Portfolio.objects.get(
                id_portfolio=portfolio_id,
                statut='publie'
            )
            
            projets = portfolio.projets.filter(est_public=True)
            serializer = ProjetSerializer(projets, many=True)
            
            return Response(serializer.data)
            
        except Portfolio.DoesNotExist:
            return Response(
                {"error": "Portfolio non trouvé ou non publié"},
                status=status.HTTP_404_NOT_FOUND
            )

class PortfolioPublicDataAPIView(APIView):
    """
    Vue publique pour récupérer toutes les données d'un portfolio publié
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, portfolio_id):
        try:
            # Récupérer le portfolio publié
            portfolio = Portfolio.objects.get(
                id_portfolio=portfolio_id,
                statut='publie'
            )
            
            # Récupérer toutes les données associées
            contacts = portfolio.contacts.all()
            competences = portfolio.competences.filter(est_visible=True)
            projets = portfolio.projets.filter(est_public=True)
            
            # Sérialiser toutes les données
            data = {
                'portfolio': PortfolioDetailSerializer(portfolio).data,
                'contacts': ContactSerializer(contacts, many=True).data,
                'competences': CompetenceSerializer(competences, many=True).data,
                'projets': ProjetSerializer(projets, many=True).data,
            }
            
            return Response(data)
            
        except Portfolio.DoesNotExist:
            return Response(
                {"error": "Portfolio non trouvé ou non publié"},
                status=status.HTTP_404_NOT_FOUND
            )

class PublicPortfoliosAPIView(APIView):
    """
    Vue publique pour récupérer tous les portfolios publiés avec leurs données
    """
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination
    
    def get(self, request):
        # Récupérer tous les portfolios publiés
        portfolios = Portfolio.objects.filter(statut='publie')
        
        # Pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(portfolios, request)
        
        if page is not None:
            # Pour chaque portfolio, récupérer les données associées
            data = []
            for portfolio in page:
                portfolio_data = PortfolioListSerializer(portfolio).data
                
                # Ajouter les contacts principaux
                contacts_principaux = portfolio.contacts.filter(est_principal=True)[:3]
                portfolio_data['contacts_principaux'] = ContactSerializer(
                    contacts_principaux, many=True
                ).data
                
                # Ajouter quelques compétences visibles
                competences_visibles = portfolio.competences.filter(est_visible=True)[:5]
                portfolio_data['competences_visibles'] = CompetenceSerializer(
                    competences_visibles, many=True
                ).data
                
                # Ajouter quelques projets publics
                projets_publics = portfolio.projets.filter(est_public=True)[:3]
                portfolio_data['projets_publics'] = ProjetSerializer(
                    projets_publics, many=True
                ).data
                
                data.append(portfolio_data)
            
            return paginator.get_paginated_response(data)
        
        # Si pas de pagination
        data = []
        for portfolio in portfolios:
            portfolio_data = PortfolioListSerializer(portfolio).data
            data.append(portfolio_data)
        
        return Response(data)

# ============================================================================
# ENDPOINTS PUBLICS SUPPLÉMENTAIRES POUR LES COMPÉTENCES ET PROJETS
# ============================================================================

class PublicCompetencesListAPIView(APIView):
    """
    Vue publique pour récupérer toutes les compétences visibles des portfolios publiés
    """
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination
    
    def get(self, request):
        # Récupérer toutes les compétences visibles des portfolios publiés
        competences = Competence.objects.filter(
            portfolios__statut='publie',
            est_visible=True
        ).distinct()
        
        # Filtrer par catégorie si spécifié
        categorie = request.query_params.get('categorie', None)
        if categorie:
            competences = competences.filter(categorie=categorie)
        
        # Filtrer par niveau si spécifié
        niveau = request.query_params.get('niveau', None)
        if niveau:
            competences = competences.filter(niveau_competence=niveau)
        
        # Recherche si spécifiée
        search = request.query_params.get('search', None)
        if search:
            competences = competences.filter(
                Q(nom_competence__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(competences, request)
        
        if page is not None:
            serializer = CompetenceSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = CompetenceSerializer(competences, many=True)
        return Response(serializer.data)

class PublicCompetencesByCategoryAPIView(APIView):
    """
    Vue publique pour récupérer les compétences groupées par catégorie
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # Récupérer toutes les compétences visibles des portfolios publiés
        competences = Competence.objects.filter(
            portfolios__statut='publie',
            est_visible=True
        ).distinct()
        
        # Grouper par catégorie
        result = {}
        for competence in competences:
            categorie = competence.get_categorie_display()
            if categorie not in result:
                result[categorie] = []
            
            serializer = CompetenceSerializer(competence)
            result[categorie].append(serializer.data)
        
        return Response(result)

class PublicCompetenceDetailAPIView(APIView):
    """
    Vue publique pour récupérer les détails d'une compétence spécifique
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, competence_id):
        try:
            # Récupérer la compétence uniquement si elle appartient à un portfolio publié
            competence = Competence.objects.get(
                id_competence=competence_id,
                portfolios__statut='publie',
                est_visible=True
            )
            
            serializer = CompetenceSerializer(competence)
            return Response(serializer.data)
            
        except Competence.DoesNotExist:
            return Response(
                {"error": "Compétence non trouvée ou non accessible"},
                status=status.HTTP_404_NOT_FOUND
            )

class PublicProjetsListAPIView(APIView):
    """
    Vue publique pour récupérer tous les projets publics des portfolios publiés
    """
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination
    
    def get(self, request):
        # Récupérer tous les projets publics des portfolios publiés
        projets = Projet.objects.filter(
            portfolios__statut='publie',
            est_public=True
        ).distinct()
        
        # Filtrer par langage si spécifié
        langage = request.query_params.get('langage', None)
        if langage:
            projets = projets.filter(langage_projet__icontains=langage)
        
        # Filtrer par état si spécifié
        termine = request.query_params.get('termine', None)
        if termine is not None:
            projets = projets.filter(est_termine=termine.lower() == 'true')
        
        # Recherche si spécifiée
        search = request.query_params.get('search', None)
        if search:
            projets = projets.filter(
                Q(titre_projet__icontains=search) |
                Q(description_projet__icontains=search) |
                Q(langage_projet__icontains=search)
            )
        
        # Pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(projets, request)
        
        if page is not None:
            serializer = ProjetSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = ProjetSerializer(projets, many=True)
        return Response(serializer.data)

class PublicProjetsByLanguageAPIView(APIView):
    """
    Vue publique pour récupérer les projets groupés par langage
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # Récupérer tous les projets publics des portfolios publiés
        projets = Projet.objects.filter(
            portfolios__statut='publie',
            est_public=True
        ).distinct()
        
        # Grouper par langage
        result = {}
        for projet in projets:
            langage = projet.langage_projet
            if langage not in result:
                result[langage] = []
            
            serializer = ProjetSerializer(projet)
            result[langage].append(serializer.data)
        
        return Response(result)

class PublicProjetDetailAPIView(APIView):
    """
    Vue publique pour récupérer les détails d'un projet spécifique
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, projet_id):
        try:
            # Récupérer le projet uniquement s'il appartient à un portfolio publié
            projet = Projet.objects.get(
                id_projet=projet_id,
                portfolios__statut='publie',
                est_public=True
            )
            
            serializer = ProjetSerializer(projet)
            return Response(serializer.data)
            
        except Projet.DoesNotExist:
            return Response(
                {"error": "Projet non trouvé ou non accessible"},
                status=status.HTTP_404_NOT_FOUND
            )

class PublicContactsListAPIView(APIView):
    """
    Vue publique pour récupérer tous les contacts des portfolios publiés
    """
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination
    
    def get(self, request):
        # Récupérer tous les contacts des portfolios publiés
        contacts = Contact.objects.filter(
            portfolios__statut='publie'
        ).distinct()
        
        # Filtrer par type si spécifié
        type_contact = request.query_params.get('type', None)
        if type_contact:
            contacts = contacts.filter(type_contact=type_contact)
        
        # Filtrer pour contacts principaux si spécifié
        principal = request.query_params.get('principal', None)
        if principal is not None:
            contacts = contacts.filter(est_principal=principal.lower() == 'true')
        
        # Recherche si spécifiée
        search = request.query_params.get('search', None)
        if search:
            contacts = contacts.filter(
                Q(valeur_contact__icontains=search) |
                Q(type_contact__icontains=search)
            )
        
        # Pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(contacts, request)
        
        if page is not None:
            serializer = ContactSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = ContactSerializer(contacts, many=True)
        return Response(serializer.data)

class PublicContactDetailAPIView(APIView):
    """
    Vue publique pour récupérer les détails d'un contact spécifique
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, contact_id):
        try:
            # Récupérer le contact uniquement s'il appartient à un portfolio publié
            contact = Contact.objects.get(
                id_contact=contact_id,
                portfolios__statut='publie'
            )
            
            serializer = ContactSerializer(contact)
            return Response(serializer.data)
            
        except Contact.DoesNotExist:
            return Response(
                {"error": "Contact non trouvé ou non accessible"},
                status=status.HTTP_404_NOT_FOUND
            )

# ============================================================================
# ENDPOINTS PUBLICS POUR LES STATISTIQUES
# ============================================================================

class PublicPortfolioStatsAPIView(APIView):
    """
    Vue publique pour récupérer les statistiques d'un portfolio publié
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, portfolio_id):
        try:
            # Récupérer le portfolio publié
            portfolio = Portfolio.objects.get(
                id_portfolio=portfolio_id,
                statut='publie'
            )
            
            # Récupérer les statistiques
            stats = {
                'general': {
                    'vues': portfolio.vue_count,
                    'statut': portfolio.get_statut_display(),
                    'date_creation': portfolio.date_creation,
                    'date_modification': portfolio.date_modification,
                    'date_publication': portfolio.date_publication,
                    'jours_actif': (timezone.now() - portfolio.date_creation).days if portfolio.date_creation else 0
                },
                'contenu': {
                    'contacts': portfolio.contacts.count(),
                    'contacts_principaux': portfolio.contacts.filter(est_principal=True).count(),
                    'competences': portfolio.competences.count(),
                    'competences_visibles': portfolio.competences.filter(est_visible=True).count(),
                    'projets': portfolio.projets.count(),
                    'projets_publics': portfolio.projets.filter(est_public=True).count()
                }
            }
            
            return Response(stats)
            
        except Portfolio.DoesNotExist:
            return Response(
                {"error": "Portfolio non trouvé ou non publié"},
                status=status.HTTP_404_NOT_FOUND
            )

class PublicPlatformStatsAPIView(APIView):
    """
    Vue publique pour récupérer les statistiques globales de la plateforme
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # Récupérer les statistiques globales
        stats = {
            'portfolios': {
                'total': Portfolio.objects.count(),
                'publies': Portfolio.objects.filter(statut='publie').count(),
                'brouillons': Portfolio.objects.filter(statut='brouillon').count(),
                'archives': Portfolio.objects.filter(statut='archive').count(),
                'vues_total': Portfolio.objects.aggregate(total_vues=models.Sum('vue_count'))['total_vues'] or 0,
            },
            'competences': {
                'total': Competence.objects.count(),
                'visibles': Competence.objects.filter(est_visible=True).count(),
                'par_categorie': {},
            },
            'projets': {
                'total': Projet.objects.count(),
                'publics': Projet.objects.filter(est_public=True).count(),
                'termines': Projet.objects.filter(est_termine=True).count(),
                'par_langage': {},
            },
            'contacts': {
                'total': Contact.objects.count(),
                'principaux': Contact.objects.filter(est_principal=True).count(),
            }
        }
        
        # Compétences par catégorie
        for categorie, _ in Competence.CATEGORIE_CHOICES:
            count = Competence.objects.filter(categorie=categorie, est_visible=True).count()
            if count > 0:
                stats['competences']['par_categorie'][categorie] = count
        
        # Projets par langage (top 10)
        langages = Projet.objects.filter(est_public=True).values('langage_projet').annotate(
            count=models.Count('id_projet')
        ).order_by('-count')[:10]
        
        for langage in langages:
            stats['projets']['par_langage'][langage['langage_projet']] = langage['count']
        
        return Response(stats)

# ============================================================================
# ENDPOINTS PUBLICS POUR LA RECHERCHE
# ============================================================================

class PublicSearchAPIView(APIView):
    """
    Vue publique pour la recherche globale dans les portfolios publiés
    """
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination
    
    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({"error": "Paramètre de recherche 'q' requis"}, status=400)
        
        # Rechercher dans les portfolios publiés
        portfolios = Portfolio.objects.filter(
            statut='publie'
        ).filter(
            Q(titre__icontains=query) |
            Q(description__icontains=query) |
            Q(titre_professionnel__icontains=query) |
            Q(biographie__icontains=query)
        ).distinct()
        
        # Rechercher dans les compétences visibles
        competences = Competence.objects.filter(
            portfolios__statut='publie',
            est_visible=True
        ).filter(
            Q(nom_competence__icontains=query) |
            Q(description__icontains=query)
        ).distinct()
        
        # Rechercher dans les projets publics
        projets = Projet.objects.filter(
            portfolios__statut='publie',
            est_public=True
        ).filter(
            Q(titre_projet__icontains=query) |
            Q(description_projet__icontains=query) |
            Q(langage_projet__icontains=query)
        ).distinct()
        
        # Préparer les résultats
        results = {
            'portfolios': PortfolioListSerializer(portfolios, many=True).data,
            'competences': CompetenceSerializer(competences, many=True).data,
            'projets': ProjetSerializer(projets, many=True).data,
            'counts': {
                'portfolios': portfolios.count(),
                'competences': competences.count(),
                'projets': projets.count(),
                'total': portfolios.count() + competences.count() + projets.count()
            }
        }
        
        return Response(results)