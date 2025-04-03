from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from ..models import Topic, RevisionSchedule
from ..permissions import IsOwnerOrReadOnly

User = get_user_model()

class IsOwnerOrReadOnlyTest(TestCase):
    def setUp(self):
        self.permission = IsOwnerOrReadOnly()
        self.user1 = User.objects.create_user(
            username='user1',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='testpass123'
        )
        self.topic = Topic.objects.create(
            user=self.user1,
            title='Test Topic',
            content='Test Content'
        )

    def test_has_object_permission_owner(self):
        request = type('Request', (), {'user': self.user1})()
        self.assertTrue(self.permission.has_object_permission(request, None, self.topic))

    def test_has_object_permission_not_owner(self):
        request = type('Request', (), {'user': self.user2})()
        self.assertFalse(self.permission.has_object_permission(request, None, self.topic))

    def test_has_object_permission_safe_method(self):
        request = type('Request', (), {'user': self.user2, 'method': 'GET'})()
        self.assertTrue(self.permission.has_object_permission(request, None, self.topic))

    def test_has_object_permission_unsafe_method(self):
        request = type('Request', (), {'user': self.user2, 'method': 'PUT'})()
        self.assertFalse(self.permission.has_object_permission(request, None, self.topic))

class TopicPermissionsTest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='testpass123'
        )
        self.topic = Topic.objects.create(
            user=self.user1,
            title='Test Topic',
            content='Test Content'
        )
        self.url = reverse('topic-detail', kwargs={'pk': self.topic.pk})

    def test_owner_can_update_topic(self):
        self.client.force_authenticate(user=self.user1)
        data = {'title': 'Updated Title'}
        response = self.client.patch(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_owner_can_delete_topic(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_non_owner_cannot_update_topic(self):
        self.client.force_authenticate(user=self.user2)
        data = {'title': 'Updated Title'}
        response = self.client.patch(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_owner_cannot_delete_topic(self):
        self.client.force_authenticate(user=self.user2)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anyone_can_view_topic(self):
        # Test unauthenticated user
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test non-owner authenticated user
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class RevisionSchedulePermissionsTest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='testpass123'
        )
        self.topic = Topic.objects.create(
            user=self.user1,
            title='Test Topic',
            content='Test Content'
        )
        self.revision = RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=timezone.now().date(),
            completed=False,
            postponed=False
        )
        self.url = reverse('revision-detail', kwargs={'pk': self.revision.pk})

    def test_owner_can_update_revision(self):
        self.client.force_authenticate(user=self.user1)
        data = {'completed': True}
        response = self.client.patch(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_owner_can_delete_revision(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_non_owner_cannot_update_revision(self):
        self.client.force_authenticate(user=self.user2)
        data = {'completed': True}
        response = self.client.patch(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_owner_cannot_delete_revision(self):
        self.client.force_authenticate(user=self.user2)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anyone_can_view_revision(self):
        # Test unauthenticated user
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test non-owner authenticated user
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class StatisticsPermissionsTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.url = reverse('statistics-list')

    def test_authenticated_user_can_view_statistics(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated_user_cannot_view_statistics(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_cannot_modify_statistics(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED) 