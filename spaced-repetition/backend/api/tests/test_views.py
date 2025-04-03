from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from ..models import Topic, RevisionSchedule

User = get_user_model()

class TopicViewSetTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )
        self.url = reverse('topic-list')

    def test_list_topics(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Topic')

    def test_create_topic(self):
        data = {
            'title': 'New Topic',
            'content': 'New Content'
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Topic.objects.count(), 2)
        self.assertEqual(response.data['title'], 'New Topic')

    def test_create_topic_validation(self):
        data = {
            'title': '',  # Empty title
            'content': 'New Content'
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_topic(self):
        url = reverse('topic-detail', kwargs={'pk': self.topic.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Topic')

    def test_update_topic(self):
        url = reverse('topic-detail', kwargs={'pk': self.topic.pk})
        data = {
            'title': 'Updated Topic',
            'content': 'Updated Content'
        }
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Topic')

    def test_delete_topic(self):
        url = reverse('topic-detail', kwargs={'pk': self.topic.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Topic.objects.count(), 0)

    def test_unauthorized_access(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class RevisionScheduleViewSetTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )
        self.revision = RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=timezone.now().date(),
            completed=False,
            postponed=False
        )
        self.url = reverse('revision-list')

    def test_list_revisions(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['topic']['title'], 'Test Topic')

    def test_get_todays_revisions(self):
        url = reverse('revision-todays-revisions')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_complete_revision(self):
        url = reverse('revision-complete', kwargs={'pk': self.revision.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.revision.refresh_from_db()
        self.assertTrue(self.revision.completed)

    def test_postpone_revision(self):
        original_date = self.revision.scheduled_date
        url = reverse('revision-postpone', kwargs={'pk': self.revision.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.revision.refresh_from_db()
        self.assertTrue(self.revision.postponed)
        self.assertEqual(self.revision.scheduled_date, original_date + timedelta(days=1))

    def test_get_revision_schedule(self):
        url = reverse('revision-schedule')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_unauthorized_access(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class StatisticsViewSetTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )
        self.revision = RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=timezone.now().date(),
            completed=False,
            postponed=False
        )
        self.url = reverse('statistics-list')

    def test_get_statistics(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_topics'], 1)
        self.assertEqual(response.data['completed_revisions'], 0)
        self.assertEqual(response.data['pending_revisions'], 1)

    def test_unauthorized_access(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED) 