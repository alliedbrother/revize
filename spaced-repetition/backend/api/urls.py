from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomObtainAuthToken,
    TopicViewSet,
    RevisionScheduleViewSet,
    StatisticsViewSet,
    RegisterUser,
    UserProfileView,
    TopicListCreate,
    TopicDetail,
    RevisionListCreate,
    RevisionDetail,
    TodayRevisions,
    MissedRevisions,
    ServerTime
)

router = DefaultRouter()
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'statistics', StatisticsViewSet, basename='statistics')

# Create a separate router for revisions to avoid URL conflicts
revision_router = DefaultRouter()
revision_router.register(r'revisions', RevisionScheduleViewSet, basename='revision')

urlpatterns = [
    # Authentication endpoints
    path('login/', CustomObtainAuthToken.as_view(), name='api_token_auth'),
    path('register/', RegisterUser.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Server time endpoint for timezone synchronization
    path('server-time/', ServerTime.as_view(), name='server-time'),
    
    # Topic endpoints
    path('topics/', TopicListCreate.as_view(), name='topic-list-create'),
    path('topics/<int:pk>/', TopicDetail.as_view(), name='topic-detail'),
    
    # Custom revision endpoints - Must come BEFORE the router includes
    path('revisions/today/', TodayRevisions.as_view(), name='revision-today'),
    path('revisions/missed/', MissedRevisions.as_view(), name='revision-missed'),
    path('revisions/schedule/', RevisionScheduleViewSet.as_view({'get': 'schedule'}), name='revision-schedule'),
    path('revisions/<int:pk>/complete/', RevisionScheduleViewSet.as_view({'post': 'complete'}), name='revision-complete'),
    path('revisions/<int:pk>/postpone/', RevisionScheduleViewSet.as_view({'post': 'postpone'}), name='revision-postpone'),
    
    # List/detail endpoints for revisions
    path('revisions/', RevisionListCreate.as_view(), name='revision-list-create'),
    path('revisions/<int:pk>/', RevisionDetail.as_view(), name='revision-detail'),
    
    # Include routers last to avoid conflicts
    path('', include(router.urls)),
] 