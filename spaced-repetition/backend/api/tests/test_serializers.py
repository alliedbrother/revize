from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from ..models import Topic, RevisionSchedule
from ..serializers import TopicSerializer, RevisionScheduleSerializer

User = get_user_model()

class TopicSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )
        self.serializer = TopicSerializer(instance=self.topic)

    def test_contains_expected_fields(self):
        data = self.serializer.data
        expected_fields = {'id', 'title', 'content', 'created_at', 'updated_at'}
        self.assertEqual(set(data.keys()), expected_fields)

    def test_title_content(self):
        data = self.serializer.data
        self.assertEqual(data['title'], 'Test Topic')
        self.assertEqual(data['content'], 'Test Content')

    def test_read_only_fields(self):
        data = self.serializer.data
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    def test_serializer_validation(self):
        # Test empty title
        data = {
            'title': '',
            'content': 'Test Content'
        }
        serializer = TopicSerializer(data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('title', serializer.errors)

        # Test valid data
        data = {
            'title': 'New Topic',
            'content': 'New Content'
        }
        serializer = TopicSerializer(data=data, partial=True)
        self.assertTrue(serializer.is_valid())

class RevisionScheduleSerializerTest(TestCase):
    def setUp(self):
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
        self.serializer = RevisionScheduleSerializer(instance=self.revision)

    def test_contains_expected_fields(self):
        data = self.serializer.data
        expected_fields = {
            'id', 'topic', 'scheduled_date', 'completed',
            'postponed', 'created_at', 'updated_at', 'day_number'
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_topic_nested_serialization(self):
        data = self.serializer.data
        self.assertIn('topic', data)
        self.assertEqual(data['topic']['title'], 'Test Topic')
        self.assertEqual(data['topic']['content'], 'Test Content')

    def test_scheduled_date_format(self):
        data = self.serializer.data
        self.assertEqual(data['scheduled_date'], self.revision.scheduled_date.isoformat())

    def test_status_fields(self):
        data = self.serializer.data
        self.assertFalse(data['completed'])
        self.assertFalse(data['postponed'])

    def test_day_number_calculation(self):
        # Create a topic with multiple revisions
        topic = Topic.objects.create(
            user=self.user,
            title='Topic with Revisions',
            content='Content'
        )
        
        # Create revisions with different scheduled dates
        today = timezone.now().date()
        revision1 = RevisionSchedule.objects.create(
            topic=topic,
            scheduled_date=today,
            completed=False,
            postponed=False
        )
        
        tomorrow = today + timedelta(days=1)
        revision2 = RevisionSchedule.objects.create(
            topic=topic,
            scheduled_date=tomorrow,
            completed=False,
            postponed=False
        )
        
        serializer1 = RevisionScheduleSerializer(instance=revision1)
        serializer2 = RevisionScheduleSerializer(instance=revision2)
        
        self.assertEqual(serializer1.data['day_number'], 1)
        self.assertEqual(serializer2.data['day_number'], 2)

    def test_serializer_validation(self):
        # Test invalid scheduled date
        data = {
            'topic': self.topic.id,
            'scheduled_date': 'invalid-date',
            'completed': False,
            'postponed': False
        }
        serializer = RevisionScheduleSerializer(data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('scheduled_date', serializer.errors)

        # Test valid data
        data = {
            'topic': self.topic.id,
            'scheduled_date': timezone.now().date().isoformat(),
            'completed': False,
            'postponed': False
        }
        serializer = RevisionScheduleSerializer(data=data, partial=True)
        self.assertTrue(serializer.is_valid())

    def test_read_only_fields(self):
        data = self.serializer.data
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)
        self.assertIn('day_number', data)

    def test_completed_revision_serialization(self):
        self.revision.completed = True
        self.revision.save()
        serializer = RevisionScheduleSerializer(instance=self.revision)
        data = serializer.data
        self.assertTrue(data['completed'])

    def test_postponed_revision_serialization(self):
        self.revision.postponed = True
        self.revision.save()
        serializer = RevisionScheduleSerializer(instance=self.revision)
        data = serializer.data
        self.assertTrue(data['postponed']) 