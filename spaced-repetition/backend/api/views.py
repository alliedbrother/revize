from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth.models import User
from .models import Topic, Revision
from .serializers import TopicSerializer, TopicCreateSerializer, RevisionSerializer, UserSerializer
from django.utils import timezone
import datetime
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes

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
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        today = timezone.now().date()
        revisions = Revision.objects.filter(
            topic__user=request.user,
            scheduled_date=today,
            status='pending'
        )
        serializer = RevisionSerializer(revisions, many=True)
        return Response(serializer.data)

class RegisterUser(generics.CreateAPIView):
    """
    API endpoint for registering a new user.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not email or not password:
            return Response(
                {'error': 'Please provide username, email, and password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(username=username, email=email, password=password)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        }, status=status.HTTP_201_CREATED)


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
            'username': user.username,
            'email': user.email
        })
