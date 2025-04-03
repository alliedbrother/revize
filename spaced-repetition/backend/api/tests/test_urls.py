from django.test import TestCase
from django.urls import reverse, resolve
from ..views import (
    TopicViewSet,
    RevisionScheduleViewSet,
    StatisticsViewSet,
    CustomObtainAuthToken
)

class URLTests(TestCase):
    def test_topic_list_url(self):
        url = reverse('topic-list')
        self.assertEqual(resolve(url).func.cls, TopicViewSet)

    def test_topic_detail_url(self):
        url = reverse('topic-detail', kwargs={'pk': 1})
        self.assertEqual(resolve(url).func.cls, TopicViewSet)

    def test_revision_list_url(self):
        url = reverse('revision-list')
        self.assertEqual(resolve(url).func.cls, RevisionScheduleViewSet)

    def test_revision_detail_url(self):
        url = reverse('revision-detail', kwargs={'pk': 1})
        self.assertEqual(resolve(url).func.cls, RevisionScheduleViewSet)

    def test_todays_revisions_url(self):
        url = reverse('revision-todays-revisions')
        self.assertEqual(resolve(url).func.cls, RevisionScheduleViewSet)

    def test_revision_schedule_url(self):
        url = reverse('revision-schedule')
        self.assertEqual(resolve(url).func.cls, RevisionScheduleViewSet)

    def test_complete_revision_url(self):
        url = reverse('revision-complete', kwargs={'pk': 1})
        self.assertEqual(resolve(url).func.cls, RevisionScheduleViewSet)

    def test_postpone_revision_url(self):
        url = reverse('revision-postpone', kwargs={'pk': 1})
        self.assertEqual(resolve(url).func.cls, RevisionScheduleViewSet)

    def test_statistics_url(self):
        url = reverse('statistics-list')
        self.assertEqual(resolve(url).func.cls, StatisticsViewSet)

    def test_auth_token_url(self):
        url = reverse('api-token-auth')
        self.assertEqual(resolve(url).func.cls, CustomObtainAuthToken)

    def test_url_names(self):
        """Test that all URL names are unique and properly configured"""
        url_names = [
            'topic-list',
            'topic-detail',
            'revision-list',
            'revision-detail',
            'revision-todays-revisions',
            'revision-schedule',
            'revision-complete',
            'revision-postpone',
            'statistics-list',
            'api-token-auth'
        ]
        
        for name in url_names:
            try:
                reverse(name)
            except:
                self.fail(f"URL name '{name}' is not properly configured")

    def test_url_patterns(self):
        """Test that URL patterns are properly formatted"""
        url_patterns = [
            ('topic-list', '/api/topics/'),
            ('topic-detail', '/api/topics/1/'),
            ('revision-list', '/api/revisions/'),
            ('revision-detail', '/api/revisions/1/'),
            ('revision-todays-revisions', '/api/revisions/today/'),
            ('revision-schedule', '/api/revisions/schedule/'),
            ('revision-complete', '/api/revisions/1/complete/'),
            ('revision-postpone', '/api/revisions/1/postpone/'),
            ('statistics-list', '/api/statistics/'),
            ('api-token-auth', '/api/token/')
        ]
        
        for name, expected_pattern in url_patterns:
            url = reverse(name, kwargs={'pk': 1} if 'pk' in name else {})
            self.assertEqual(url, expected_pattern)

    def test_url_resolution(self):
        """Test that URLs resolve to the correct view functions"""
        url_patterns = [
            ('/api/topics/', TopicViewSet),
            ('/api/topics/1/', TopicViewSet),
            ('/api/revisions/', RevisionScheduleViewSet),
            ('/api/revisions/1/', RevisionScheduleViewSet),
            ('/api/revisions/today/', RevisionScheduleViewSet),
            ('/api/revisions/schedule/', RevisionScheduleViewSet),
            ('/api/revisions/1/complete/', RevisionScheduleViewSet),
            ('/api/revisions/1/postpone/', RevisionScheduleViewSet),
            ('/api/statistics/', StatisticsViewSet),
            ('/api/token/', CustomObtainAuthToken)
        ]
        
        for pattern, expected_view in url_patterns:
            resolved = resolve(pattern)
            self.assertEqual(resolved.func.cls, expected_view) 