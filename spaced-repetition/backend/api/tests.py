from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from .models import Topic, RevisionSchedule

class TopicTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.topic_data = {
            'title': 'Test Topic',
            'content': 'Test Content'
        }

    def test_create_topic(self):
        topic = Topic.objects.create(
            user=self.user,
            **self.topic_data
        )
        self.assertEqual(topic.title, self.topic_data['title'])
        self.assertEqual(topic.content, self.topic_data['content'])
        self.assertEqual(topic.user, self.user)

    def test_revision_schedule_creation(self):
        topic = Topic.objects.create(
            user=self.user,
            **self.topic_data
        )
        RevisionSchedule.create_schedule(topic)
        
        # Check if all revisions were created
        revisions = RevisionSchedule.objects.filter(topic=topic)
        self.assertEqual(revisions.count(), 7)  # Should have 7 revisions

        # Check revision intervals
        intervals = [1, 4, 9, 16, 25, 39, 60]
        for i, revision in enumerate(revisions):
            expected_date = timezone.now().date() + timedelta(days=intervals[i])
            self.assertEqual(revision.scheduled_date, expected_date)

class RevisionScheduleTests(TestCase):
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
            scheduled_date=timezone.now().date()
        )

    def test_complete_revision(self):
        self.assertFalse(self.revision.completed)
        self.revision.complete()
        self.revision.refresh_from_db()
        self.assertTrue(self.revision.completed)

    def test_postpone_revision(self):
        original_date = self.revision.scheduled_date
        self.assertFalse(self.revision.postponed)
        
        self.revision.postpone()
        self.revision.refresh_from_db()
        
        self.assertTrue(self.revision.postponed)
        self.assertEqual(
            self.revision.scheduled_date,
            original_date + timedelta(days=1)
        )

    def test_revision_schedule_ordering(self):
        # Create multiple revisions with different dates
        dates = [
            timezone.now().date() + timedelta(days=1),
            timezone.now().date(),
            timezone.now().date() + timedelta(days=2)
        ]
        
        for date in dates:
            RevisionSchedule.objects.create(
                topic=self.topic,
                scheduled_date=date
            )
        
        # Check if revisions are ordered by date
        revisions = RevisionSchedule.objects.filter(topic=self.topic)
        self.assertEqual(
            list(revisions.values_list('scheduled_date', flat=True)),
            sorted(dates)
        )
