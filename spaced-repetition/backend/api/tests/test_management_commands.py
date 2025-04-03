from django.test import TestCase
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from ..models import Topic, RevisionSchedule

User = get_user_model()

class ManagementCommandsTest(TestCase):
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

    def test_create_revision_schedules_command(self):
        # Test creating revision schedules for all topics
        call_command('create_revision_schedules')
        
        # Check if revisions were created
        revisions = RevisionSchedule.objects.filter(topic=self.topic)
        self.assertEqual(revisions.count(), 7)  # Should create 7 revisions

        # Check revision intervals
        intervals = [1, 4, 9, 16, 25, 39, 60]
        for i, revision in enumerate(revisions.order_by('scheduled_date')):
            expected_date = self.topic.created_at.date() + timedelta(days=intervals[i])
            self.assertEqual(revision.scheduled_date, expected_date)
            self.assertEqual(revision.day_number, i + 1)

    def test_send_revision_reminders_command(self):
        # Create a revision for today
        RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=timezone.now().date(),
            completed=False,
            postponed=False
        )

        # Test sending reminders
        call_command('send_revision_reminders')
        
        # Check if reminder was sent (you would need to implement actual email sending)
        # This is just a placeholder test
        self.assertTrue(True)

    def test_cleanup_old_revisions_command(self):
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
        call_command('cleanup_old_revisions')

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

    def test_update_statistics_command(self):
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
        call_command('update_statistics')

        # Check if statistics were updated (you would need to implement actual statistics storage)
        # This is just a placeholder test
        self.assertTrue(True)

    def test_create_revision_schedules_command_error_handling(self):
        # Test with no topics
        Topic.objects.all().delete()
        call_command('create_revision_schedules')
        self.assertEqual(RevisionSchedule.objects.count(), 0)

    def test_send_revision_reminders_command_error_handling(self):
        # Test with no revisions
        RevisionSchedule.objects.all().delete()
        call_command('send_revision_reminders')
        # Should not raise any errors
        self.assertTrue(True)

    def test_cleanup_old_revisions_command_error_handling(self):
        # Test with no revisions
        RevisionSchedule.objects.all().delete()
        call_command('cleanup_old_revisions')
        # Should not raise any errors
        self.assertTrue(True)

    def test_update_statistics_command_error_handling(self):
        # Test with no data
        Topic.objects.all().delete()
        call_command('update_statistics')
        # Should not raise any errors
        self.assertTrue(True)

    def test_create_revision_schedules_command_duplicate_prevention(self):
        # Create initial revisions
        call_command('create_revision_schedules')
        
        # Try to create revisions again
        call_command('create_revision_schedules')
        
        # Check if no duplicate revisions were created
        self.assertEqual(RevisionSchedule.objects.filter(topic=self.topic).count(), 7)

    def test_cleanup_old_revisions_command_retention_period(self):
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
        call_command('cleanup_old_revisions')

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

    def test_command_output(self):
        # Test command output for create_revision_schedules
        with self.captureOutput() as output:
            call_command('create_revision_schedules')
        self.assertIn('Created revision schedules', output.getvalue())

        # Test command output for cleanup_old_revisions
        with self.captureOutput() as output:
            call_command('cleanup_old_revisions')
        self.assertIn('Cleaned up old revisions', output.getvalue())

    def captureOutput(self):
        from io import StringIO
        from django.core.management.base import OutputWrapper
        from django.core.management.color import Style

        class CapturingOutput:
            def __init__(self):
                self.output = StringIO()
                self.style = Style()
                self.stdout = OutputWrapper(self.output)

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                pass

            def getvalue(self):
                return self.output.getvalue()

        return CapturingOutput() 