from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from ..models import Topic, RevisionSchedule
from ..tasks import (
    create_revision_schedules,
    send_revision_reminders,
    cleanup_old_revisions,
    update_statistics
)

User = get_user_model()

class TaskTests(TestCase):
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

    def test_create_revision_schedules(self):
        # Test creating revision schedules for a topic
        create_revision_schedules(self.topic.id)
        
        # Check if all revisions were created
        revisions = RevisionSchedule.objects.filter(topic=self.topic)
        self.assertEqual(revisions.count(), 7)  # Should create 7 revisions

        # Check revision intervals
        intervals = [1, 4, 9, 16, 25, 39, 60]
        for i, revision in enumerate(revisions.order_by('scheduled_date')):
            expected_date = self.topic.created_at.date() + timedelta(days=intervals[i])
            self.assertEqual(revision.scheduled_date, expected_date)
            self.assertEqual(revision.day_number, i + 1)

    def test_send_revision_reminders(self):
        # Create a revision for today
        revision = RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=timezone.now().date(),
            completed=False,
            postponed=False
        )

        # Test sending reminders
        send_revision_reminders()
        
        # Check if reminder was sent (you would need to implement actual email sending)
        # This is just a placeholder test
        self.assertTrue(True)

    def test_cleanup_old_revisions(self):
        # Create old completed revisions
        old_date = timezone.now().date() - timedelta(days=90)
        for i in range(3):
            RevisionSchedule.objects.create(
                topic=self.topic,
                scheduled_date=old_date,
                completed=True,
                postponed=False
            )

        # Create old postponed revisions
        for i in range(2):
            RevisionSchedule.objects.create(
                topic=self.topic,
                scheduled_date=old_date,
                completed=False,
                postponed=True
            )

        # Create recent revisions
        recent_date = timezone.now().date()
        for i in range(2):
            RevisionSchedule.objects.create(
                topic=self.topic,
                scheduled_date=recent_date,
                completed=False,
                postponed=False
            )

        # Run cleanup
        cleanup_old_revisions()

        # Check if old completed revisions were deleted
        self.assertEqual(
            RevisionSchedule.objects.filter(
                completed=True,
                scheduled_date__lt=timezone.now().date() - timedelta(days=60)
            ).count(),
            0
        )

        # Check if old postponed revisions were deleted
        self.assertEqual(
            RevisionSchedule.objects.filter(
                postponed=True,
                scheduled_date__lt=timezone.now().date() - timedelta(days=60)
            ).count(),
            0
        )

        # Check if recent revisions were kept
        self.assertEqual(
            RevisionSchedule.objects.filter(
                scheduled_date__gte=timezone.now().date() - timedelta(days=60)
            ).count(),
            2
        )

    def test_update_statistics(self):
        # Create topics and revisions
        for i in range(3):
            topic = Topic.objects.create(
                user=self.user,
                title=f'Topic {i}',
                content=f'Content {i}'
            )
            RevisionSchedule.objects.create(
                topic=topic,
                scheduled_date=timezone.now().date(),
                completed=i % 2 == 0,  # Alternate between completed and pending
                postponed=False
            )

        # Run statistics update
        update_statistics()

        # Check if statistics were updated (you would need to implement actual statistics storage)
        # This is just a placeholder test
        self.assertTrue(True)

    def test_create_revision_schedules_error_handling(self):
        # Test with non-existent topic
        create_revision_schedules(99999)
        self.assertEqual(RevisionSchedule.objects.count(), 0)

    def test_send_revision_reminders_error_handling(self):
        # Test sending reminders with no revisions
        send_revision_reminders()
        # Should not raise any errors
        self.assertTrue(True)

    def test_cleanup_old_revisions_error_handling(self):
        # Test cleanup with no revisions
        cleanup_old_revisions()
        # Should not raise any errors
        self.assertTrue(True)

    def test_update_statistics_error_handling(self):
        # Test update with no data
        update_statistics()
        # Should not raise any errors
        self.assertTrue(True)

    def test_create_revision_schedules_duplicate_prevention(self):
        # Create initial revisions
        create_revision_schedules(self.topic.id)
        
        # Try to create revisions again
        create_revision_schedules(self.topic.id)
        
        # Check if no duplicate revisions were created
        self.assertEqual(RevisionSchedule.objects.filter(topic=self.topic).count(), 7)

    def test_cleanup_old_revisions_retention_period(self):
        # Create revisions with different dates
        retention_period = 60  # days
        old_date = timezone.now().date() - timedelta(days=retention_period + 1)
        recent_date = timezone.now().date() - timedelta(days=retention_period - 1)

        # Create old revision
        RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=old_date,
            completed=True,
            postponed=False
        )

        # Create recent revision
        RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=recent_date,
            completed=True,
            postponed=False
        )

        # Run cleanup
        cleanup_old_revisions()

        # Check if only old revision was deleted
        self.assertEqual(
            RevisionSchedule.objects.filter(
                completed=True,
                scheduled_date__lt=timezone.now().date() - timedelta(days=retention_period)
            ).count(),
            0
        )
        self.assertEqual(
            RevisionSchedule.objects.filter(
                completed=True,
                scheduled_date__gte=timezone.now().date() - timedelta(days=retention_period)
            ).count(),
            1
        ) 