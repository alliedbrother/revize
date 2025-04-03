from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from ..models import Topic, RevisionSchedule

User = get_user_model()

class TopicModelTest(TestCase):
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

    def test_topic_creation(self):
        self.assertEqual(self.topic.title, 'Test Topic')
        self.assertEqual(self.topic.content, 'Test Content')
        self.assertEqual(self.topic.user, self.user)
        self.assertIsNotNone(self.topic.created_at)
        self.assertIsNotNone(self.topic.updated_at)

    def test_topic_str(self):
        self.assertEqual(str(self.topic), 'Test Topic')

    def test_topic_ordering(self):
        # Create another topic
        topic2 = Topic.objects.create(
            user=self.user,
            title='Another Topic',
            content='Another Content'
        )
        
        # Topics should be ordered by created_at in descending order
        topics = Topic.objects.all()
        self.assertEqual(topics[0], topic2)
        self.assertEqual(topics[1], self.topic)

class RevisionScheduleModelTest(TestCase):
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

    def test_revision_creation(self):
        self.assertEqual(self.revision.topic, self.topic)
        self.assertEqual(self.revision.scheduled_date, timezone.now().date())
        self.assertFalse(self.revision.completed)
        self.assertFalse(self.revision.postponed)
        self.assertIsNotNone(self.revision.created_at)
        self.assertIsNotNone(self.revision.updated_at)

    def test_revision_str(self):
        expected_str = f'Revision for {self.topic.title} on {self.revision.scheduled_date}'
        self.assertEqual(str(self.revision), expected_str)

    def test_revision_ordering(self):
        # Create another revision for a different date
        future_date = timezone.now().date() + timedelta(days=1)
        revision2 = RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=future_date,
            completed=False,
            postponed=False
        )
        
        # Revisions should be ordered by scheduled_date in ascending order
        revisions = RevisionSchedule.objects.all()
        self.assertEqual(revisions[0], self.revision)
        self.assertEqual(revisions[1], revision2)

    def test_revision_status(self):
        # Test completed status
        self.revision.completed = True
        self.revision.save()
        self.assertTrue(self.revision.is_completed())
        
        # Test postponed status
        self.revision.completed = False
        self.revision.postponed = True
        self.revision.save()
        self.assertTrue(self.revision.is_postponed())
        
        # Test pending status
        self.revision.postponed = False
        self.revision.save()
        self.assertTrue(self.revision.is_pending())

    def test_revision_day_number(self):
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
        
        # Check day numbers
        self.assertEqual(revision1.day_number, 1)
        self.assertEqual(revision2.day_number, 2)

    def test_revision_completion(self):
        self.assertFalse(self.revision.completed)
        self.revision.complete()
        self.assertTrue(self.revision.completed)

    def test_revision_postponement(self):
        original_date = self.revision.scheduled_date
        self.revision.postpone()
        self.assertTrue(self.revision.postponed)
        self.assertEqual(self.revision.scheduled_date, original_date + timedelta(days=1))

    def test_revision_user_relationship(self):
        # Revisions should be accessible through the topic's user
        self.assertEqual(self.revision.topic.user, self.user)
        
        # Create a revision for another user's topic
        other_user = User.objects.create_user(
            username='otheruser',
            password='testpass123'
        )
        other_topic = Topic.objects.create(
            user=other_user,
            title='Other Topic',
            content='Other Content'
        )
        other_revision = RevisionSchedule.objects.create(
            topic=other_topic,
            scheduled_date=timezone.now().date(),
            completed=False,
            postponed=False
        )
        
        # Verify revisions are properly associated with their respective users
        self.assertNotEqual(self.revision.topic.user, other_revision.topic.user) 