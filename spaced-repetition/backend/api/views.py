from django.shortcuts import render
from rest_framework import generics, permissions, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth.models import User
from .models import Topic, Revision, RevisionSchedule
from .serializers import TopicSerializer, TopicCreateSerializer, RevisionSerializer, UserSerializer, RevisionScheduleSerializer
from django.utils import timezone
import datetime
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes, action
from datetime import timedelta
from django.urls import path

# Create your views here.

class TopicListCreate(generics.ListCreateAPIView):
    """
    API endpoint that allows topics to be viewed or created.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TopicCreateSerializer

    def get_queryset(self):
        return Topic.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return TopicSerializer
        return TopicCreateSerializer

class TopicDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint that allows a topic to be viewed, updated, or deleted.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TopicSerializer

    def get_queryset(self):
        return Topic.objects.filter(user=self.request.user)

class RevisionListCreate(generics.ListCreateAPIView):
    """
    API endpoint that allows revisions to be viewed or created.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RevisionSerializer

    def get_queryset(self):
        queryset = Revision.objects.filter(topic__user=self.request.user)
        
        # Filter by date if provided
        date_filter = self.request.query_params.get('date', None)
        if date_filter:
            try:
                filter_date = datetime.datetime.strptime(date_filter, '%Y-%m-%d').date()
                queryset = queryset.filter(scheduled_date=filter_date)
            except ValueError:
                pass  # Invalid date format
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset

class RevisionDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint that allows a revision to be viewed, updated, or deleted.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RevisionSerializer

    def get_queryset(self):
        return Revision.objects.filter(topic__user=self.request.user)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle specific action parameters
        action = request.data.get('action', None)
        if action == 'complete':
            instance.mark_completed()
            return Response(self.get_serializer(instance).data)
        elif action == 'postpone':
            days = request.data.get('days', 1)
            try:
                days = int(days)
            except (ValueError, TypeError):
                days = 1
            instance.postpone(days=days)
            return Response(self.get_serializer(instance).data)
        
        # Default update behavior
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class TodayRevisions(APIView):
    """
    API endpoint that returns revisions scheduled for today.
    This includes both regular and postponed revisions.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        today = timezone.now().date()
        # Get all revisions for today that aren't completed, including postponed ones
        revisions = RevisionSchedule.objects.filter(
            topic__user=request.user,
            scheduled_date=today,
            completed=False
        )
        serializer = RevisionScheduleSerializer(revisions, many=True)
        return Response(serializer.data)

class ServerTime(APIView):
    """
    API endpoint that returns the server's current time information.
    This helps clients synchronize with the server's timezone.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        now = timezone.now()
        return Response({
            'datetime': now.isoformat(),
            'date': now.date().isoformat(),
            'timezone': str(timezone.get_current_timezone()),
            'timezone_name': timezone.get_current_timezone_name()
        })

class MissedRevisions(APIView):
    """
    API endpoint that returns revisions scheduled for before today that haven't been completed.
    This includes both regular and postponed revisions.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        today = timezone.now().date()
        revisions = RevisionSchedule.objects.filter(
            topic__user=request.user,
            scheduled_date__lt=today,
            completed=False
        )
        serializer = RevisionScheduleSerializer(revisions, many=True)
        return Response(serializer.data)

class RegisterUser(generics.CreateAPIView):
    """
    API endpoint for registering a new user.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'username': user.username,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomObtainAuthToken(ObtainAuthToken):
    """
    API endpoint for user login.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username
        })

class TopicViewSet(viewsets.ModelViewSet):
    serializer_class = TopicSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Topic.objects.filter(user=self.request.user)
        
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TopicCreateSerializer
        return TopicSerializer

    def perform_create(self, serializer):
        # Get initial_revision_date from serializer if provided
        initial_revision_date = None
        if 'initial_revision_date' in serializer.validated_data:
            initial_revision_date = serializer.validated_data.pop('initial_revision_date')
            
        # Create the topic
        topic = serializer.save(user=self.request.user)
        
        # Create revision schedule for the new topic with the specified date
        RevisionSchedule.create_schedule(topic, base_date=initial_revision_date)

class RevisionScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = RevisionScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RevisionSchedule.objects.filter(topic__user=self.request.user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        revisions = RevisionSchedule.objects.filter(
            topic__user=request.user,
            scheduled_date=today,
            completed=False
        )
        serializer = self.get_serializer(revisions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def schedule(self, request):
        revisions = RevisionSchedule.objects.filter(
            topic__user=request.user
        ).order_by('scheduled_date')
        serializer = self.get_serializer(revisions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        revision = self.get_object()
        revision.complete()
        serializer = self.get_serializer(revision)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def postpone(self, request, pk=None):
        revision = self.get_object()
        revision.postpone()
        serializer = self.get_serializer(revision)
        return Response(serializer.data)

class StatisticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)

        # Get all topics and revisions for the user
        topics = Topic.objects.filter(user=request.user)
        revisions = RevisionSchedule.objects.filter(topic__user=request.user)

        # Calculate statistics
        stats = {
            'total_topics': topics.count(),
            'total_revisions': revisions.count(),
            'completed_revisions': revisions.filter(completed=True).count(),
            'pending_revisions': revisions.filter(completed=False).count(),
            'topics_this_week': topics.filter(created_at__gte=week_ago).count(),
            'revisions_today': revisions.filter(
                scheduled_date=today,
                completed=True
            ).count(),
            'avg_daily_topics': topics.count() / max(1, (today - topics.first().created_at.date()).days)
        }

        return Response(stats)

class UserProfileView(APIView):
    """
    API endpoint for getting and updating the user profile.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get the user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        """Update the user profile"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
