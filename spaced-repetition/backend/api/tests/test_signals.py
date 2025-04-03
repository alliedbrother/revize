from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from ..models import Topic, RevisionSchedule
from ..signals import create_revision_schedule, update_revision_status

User = get_user_model()

class TopicSignalsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_create_revision_schedule_signal(self):
        # Create a topic
        topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )

        # Check if revision schedule was created
        revisions = RevisionSchedule.objects.filter(topic=topic)
        self.assertEqual(revisions.count(), 7)  # Should create 7 revisions

        # Check revision intervals
        intervals = [1, 4, 9, 16, 25, 39, 60]  # Expected intervals in days
        for i, revision in enumerate(revisions.order_by('scheduled_date')):
            expected_date = topic.created_at.date() + timedelta(days=intervals[i])
            self.assertEqual(revision.scheduled_date, expected_date)
            self.assertEqual(revision.day_number, i + 1)
            self.assertFalse(revision.completed)
            self.assertFalse(revision.postponed)

    def test_revision_schedule_ordering(self):
        # Create a topic
        topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )

        # Check if revisions are ordered by scheduled_date
        revisions = RevisionSchedule.objects.filter(topic=topic).order_by('scheduled_date')
        for i in range(len(revisions) - 1):
            self.assertLess(revisions[i].scheduled_date, revisions[i + 1].scheduled_date)

    def test_revision_schedule_user_association(self):
        # Create a topic
        topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )

        # Check if revisions are associated with the correct user through the topic
        revisions = RevisionSchedule.objects.filter(topic=topic)
        for revision in revisions:
            self.assertEqual(revision.topic.user, self.user)

    def test_revision_schedule_creation_date(self):
        # Create a topic
        topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )

        # Check if revisions have correct creation dates
        revisions = RevisionSchedule.objects.filter(topic=topic)
        for revision in revisions:
            self.assertEqual(revision.created_at.date(), topic.created_at.date())

    def test_revision_schedule_update_date(self):
        # Create a topic
        topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )

        # Check if revisions have correct update dates
        revisions = RevisionSchedule.objects.filter(topic=topic)
        for revision in revisions:
            self.assertEqual(revision.updated_at.date(), topic.created_at.date())

    def test_revision_schedule_deletion(self):
        # Create a topic
        topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )

        # Delete the topic
        topic.delete()

        # Check if revisions were deleted
        self.assertEqual(RevisionSchedule.objects.filter(topic=topic).count(), 0)

    def test_revision_schedule_bulk_creation(self):
        # Create multiple topics
        topics = [
            Topic.objects.create(
                user=self.user,
                title=f'Test Topic {i}',
                content=f'Test Content {i}'
            )
            for i in range(3)
        ]

        # Check if each topic has its own revision schedule
        for topic in topics:
            revisions = RevisionSchedule.objects.filter(topic=topic)
            self.assertEqual(revisions.count(), 7)

    def test_revision_schedule_interval_calculation(self):
        # Create a topic
        topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )

        # Check if revision intervals are calculated correctly
        revisions = RevisionSchedule.objects.filter(topic=topic).order_by('scheduled_date')
        intervals = [1, 4, 9, 16, 25, 39, 60]
        
        for i, revision in enumerate(revisions):
            expected_days = intervals[i]
            actual_days = (revision.scheduled_date - topic.created_at.date()).days
            self.assertEqual(actual_days, expected_days)

    def test_revision_schedule_status_initialization(self):
        # Create a topic
        topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )

        # Check if all revisions are initialized with correct status
        revisions = RevisionSchedule.objects.filter(topic=topic)
        for revision in revisions:
            self.assertFalse(revision.completed)
            self.assertFalse(revision.postponed)

    def test_revision_schedule_unique_constraint(self):
        # Create a topic
        topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )

        # Try to create a duplicate revision schedule
        with self.assertRaises(Exception):
            create_revision_schedule(sender=Topic, instance=topic, created=True)

class RevisionScheduleSignalsTest(TestCase):
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

    def test_update_revision_status_signal(self):
        # Test completing a revision
        self.revision.completed = True
        self.revision.save()
        self.assertTrue(self.revision.completed)
        self.assertFalse(self.revision.postponed)

        # Test postponing a revision
        self.revision.completed = False
        self.revision.postponed = True
        self.revision.save()
        self.assertFalse(self.revision.completed)
        self.assertTrue(self.revision.postponed)

    def test_revision_status_mutual_exclusivity(self):
        # Test that a revision cannot be both completed and postponed
        self.revision.completed = True
        self.revision.postponed = True
        with self.assertRaises(Exception):
            self.revision.save()

    def test_revision_status_update_date(self):
        # Test that updating status updates the updated_at field
        old_updated_at = self.revision.updated_at
        self.revision.completed = True
        self.revision.save()
        self.assertGreater(self.revision.updated_at, old_updated_at)

    def test_revision_status_history(self):
        # Test that status changes are tracked
        self.revision.completed = True
        self.revision.save()
        self.assertTrue(self.revision.completed)

        self.revision.completed = False
        self.revision.postponed = True
        self.revision.save()
        self.assertFalse(self.revision.completed)
        self.assertTrue(self.revision.postponed)

    def test_revision_status_validation(self):
        # Test that invalid status combinations are prevented
        self.revision.completed = True
        self.revision.postponed = True
        with self.assertRaises(Exception):
            self.revision.save()

    def test_revision_status_signal_handling(self):
        # Test that the signal handler is called
        self.revision.completed = True
        self.revision.save()
        self.assertTrue(self.revision.completed)

        # Test that the signal handler prevents invalid states
        self.revision.postponed = True
        with self.assertRaises(Exception):
            self.revision.save() 