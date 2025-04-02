from django.urls import path
from .views import (
    TopicListCreate,
    TopicDetail,
    RevisionListCreate,
    RevisionDetail,
    TodayRevisions,
    RegisterUser,
    CustomObtainAuthToken,
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.reverse import reverse

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request, format=None):
    return Response({
        'register': reverse('register', request=request, format=format),
        'login': reverse('login', request=request, format=format),
        'topics': reverse('topic-list-create', request=request, format=format),
        'revisions': reverse('revision-list-create', request=request, format=format),
        'today-revisions': reverse('today-revisions', request=request, format=format),
    })

urlpatterns = [
    # API Root endpoint
    path('', api_root, name='api-root'),
    
    # Auth endpoints
    path('register/', RegisterUser.as_view(), name='register'),
    path('login/', CustomObtainAuthToken.as_view(), name='login'),
    
    # Topic endpoints
    path('topics/', TopicListCreate.as_view(), name='topic-list-create'),
    path('topics/<int:pk>/', TopicDetail.as_view(), name='topic-detail'),
    
    # Revision endpoints
    path('revisions/', RevisionListCreate.as_view(), name='revision-list-create'),
    path('revisions/<int:pk>/', RevisionDetail.as_view(), name='revision-detail'),
    path('today-revisions/', TodayRevisions.as_view(), name='today-revisions'),
] 