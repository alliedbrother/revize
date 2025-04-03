from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from ..models import Topic, RevisionSchedule
from ..admin import TopicAdmin, RevisionScheduleAdmin

User = get_user_model()

class TopicAdminTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_user = User.objects.create_superuser(
            username='admin',
            password='admin123',
            email='admin@example.com'
        )
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )

    def test_topic_admin_list_display(self):
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_topic_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Topic')
        self.assertContains(response, 'testuser')
        self.assertContains(response, 'Test Content')

    def test_topic_admin_search_fields(self):
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_topic_changelist')
        response = self.client.get(url, {'q': 'Test Topic'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Topic')

    def test_topic_admin_list_filter(self):
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_topic_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'User')

    def test_topic_admin_readonly_fields(self):
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_topic_change', args=[self.topic.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'created_at')
        self.assertContains(response, 'updated_at')

    def test_topic_admin_ordering(self):
        # Create another topic
        Topic.objects.create(
            user=self.user,
            title='Another Topic',
            content='Another Content'
        )
        
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_topic_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        topics = response.context['cl'].queryset
        self.assertEqual(topics[0].title, 'Another Topic')
        self.assertEqual(topics[1].title, 'Test Topic')

class RevisionScheduleAdminTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_user = User.objects.create_superuser(
            username='admin',
            password='admin123',
            email='admin@example.com'
        )
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
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

    def test_revision_schedule_admin_list_display(self):
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_revisionschedule_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Topic')
        self.assertContains(response, str(self.revision.scheduled_date))
        self.assertContains(response, 'Pending')

    def test_revision_schedule_admin_search_fields(self):
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_revisionschedule_changelist')
        response = self.client.get(url, {'q': 'Test Topic'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Topic')

    def test_revision_schedule_admin_list_filter(self):
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_revisionschedule_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Topic')
        self.assertContains(response, 'Status')

    def test_revision_schedule_admin_readonly_fields(self):
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_revisionschedule_change', args=[self.revision.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'created_at')
        self.assertContains(response, 'updated_at')

    def test_revision_schedule_admin_ordering(self):
        # Create another revision
        RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=timezone.now().date() + timezone.timedelta(days=1),
            completed=False,
            postponed=False
        )
        
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_revisionschedule_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        revisions = response.context['cl'].queryset
        self.assertLess(revisions[0].scheduled_date, revisions[1].scheduled_date)

    def test_revision_schedule_admin_status_display(self):
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_revisionschedule_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Pending')

        # Test completed status
        self.revision.completed = True
        self.revision.save()
        response = self.client.get(url)
        self.assertContains(response, 'Completed')

        # Test postponed status
        self.revision.completed = False
        self.revision.postponed = True
        self.revision.save()
        response = self.client.get(url)
        self.assertContains(response, 'Postponed')

    def test_revision_schedule_admin_topic_link(self):
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_revisionschedule_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, f'<a href="/admin/api/topic/{self.topic.id}/change/">Test Topic</a>')

    def test_revision_schedule_admin_date_hierarchy(self):
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_revisionschedule_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'scheduled_date')

    def test_revision_schedule_admin_actions(self):
        self.client.login(username='admin', password='admin123')
        url = reverse('admin:api_revisionschedule_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'action-select') 