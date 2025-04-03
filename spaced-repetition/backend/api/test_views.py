from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from .models import Topic, RevisionSchedule

class APITests(APITestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # Create test client and login
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create test topic
        self.topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )
        RevisionSchedule.create_schedule(self.topic)

    def test_create_topic(self):
        url = reverse('topic-list')
        data = {
            'title': 'New Topic',
            'content': 'New Content'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Topic.objects.count(), 2)  # Original + new topic
        
        # Check if revision schedule was created
        new_topic = Topic.objects.latest('id')
        self.assertEqual(
            RevisionSchedule.objects.filter(topic=new_topic).count(),
            7
        )

    def test_get_todays_revisions(self):
        url = reverse('revision-today')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Create a revision for today
        today = timezone.now().date()
        RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=today
        )
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_complete_revision(self):
        revision = RevisionSchedule.objects.filter(topic=self.topic).first()
        url = reverse('revision-complete', kwargs={'pk': revision.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        revision.refresh_from_db()
        self.assertTrue(revision.completed)

    def test_postpone_revision(self):
        revision = RevisionSchedule.objects.filter(topic=self.topic).first()
        original_date = revision.scheduled_date
        url = reverse('revision-postpone', kwargs={'pk': revision.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        revision.refresh_from_db()
        self.assertTrue(revision.postponed)
        self.assertEqual(
            revision.scheduled_date,
            original_date + timedelta(days=1)
        )

    def test_get_statistics(self):
        url = reverse('statistics-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        stats = response.data
        self.assertEqual(stats['total_topics'], 1)
        self.assertEqual(stats['total_revisions'], 7)  # 7 revisions per topic
        self.assertEqual(stats['pending_revisions'], 7)

    def test_get_revision_schedule(self):
        url = reverse('revision-schedule')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 7)  # 7 revisions per topic

    def test_unauthorized_access(self):
        # Create a new client without authentication
        self.client = APIClient()
        
        # Try to access protected endpoints
        urls = [
            reverse('topic-list'),
            reverse('revision-today'),
            reverse('statistics-list')
        ]
        
        for url in urls:
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED) 