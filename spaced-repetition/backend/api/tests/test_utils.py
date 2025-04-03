from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from ..models import Topic, RevisionSchedule
from ..utils import (
    calculate_revision_intervals,
    get_todays_revisions,
    get_revision_schedule,
    calculate_statistics,
    format_date,
    validate_revision_date
)

User = get_user_model()

class RevisionUtilsTest(TestCase):
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

    def test_calculate_revision_intervals(self):
        intervals = calculate_revision_intervals()
        expected_intervals = [1, 4, 9, 16, 25, 39, 60]
        self.assertEqual(intervals, expected_intervals)

    def test_get_todays_revisions(self):
        # Create a revision for today
        RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=timezone.now().date(),
            completed=False,
            postponed=False
        )

        # Create a revision for tomorrow
        RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=timezone.now().date() + timedelta(days=1),
            completed=False,
            postponed=False
        )

        today_revisions = get_todays_revisions(self.user)
        self.assertEqual(today_revisions.count(), 1)
        self.assertEqual(today_revisions[0].scheduled_date, timezone.now().date())

    def test_get_revision_schedule(self):
        # Create multiple revisions
        for i in range(3):
            RevisionSchedule.objects.create(
                topic=self.topic,
                scheduled_date=timezone.now().date() + timedelta(days=i),
                completed=False,
                postponed=False
            )

        schedule = get_revision_schedule(self.user)
        self.assertEqual(schedule.count(), 3)
        self.assertEqual(schedule[0].day_number, 1)
        self.assertEqual(schedule[1].day_number, 2)
        self.assertEqual(schedule[2].day_number, 3)

    def test_calculate_statistics(self):
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

        stats = calculate_statistics(self.user)
        self.assertEqual(stats['total_topics'], 3)
        self.assertEqual(stats['completed_revisions'], 2)
        self.assertEqual(stats['pending_revisions'], 1)
        self.assertEqual(stats['topics_this_week'], 3)
        self.assertEqual(stats['revisions_today'], 3)
        self.assertEqual(stats['average_daily_topics'], 0.43)  # 3/7
        self.assertEqual(stats['completion_rate'], 66.67)  # 2/3 * 100

    def test_format_date(self):
        date = timezone.now().date()
        formatted_date = format_date(date)
        self.assertEqual(formatted_date, date.strftime('%Y-%m-%d'))

    def test_validate_revision_date(self):
        # Test valid date
        valid_date = timezone.now().date()
        self.assertTrue(validate_revision_date(valid_date))

        # Test past date
        past_date = timezone.now().date() - timedelta(days=1)
        self.assertFalse(validate_revision_date(past_date))

        # Test future date
        future_date = timezone.now().date() + timedelta(days=1)
        self.assertTrue(validate_revision_date(future_date))

class DateUtilsTest(TestCase):
    def test_format_date(self):
        # Test with different date formats
        test_dates = [
            (timezone.now().date(), '%Y-%m-%d'),
            (timezone.now().date(), '%d/%m/%Y'),
            (timezone.now().date(), '%B %d, %Y')
        ]

        for date, format_str in test_dates:
            formatted = format_date(date, format_str)
            self.assertEqual(formatted, date.strftime(format_str))

    def test_validate_revision_date(self):
        # Test various date scenarios
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)
        next_week = today + timedelta(days=7)

        # Valid dates
        self.assertTrue(validate_revision_date(today))
        self.assertTrue(validate_revision_date(tomorrow))
        self.assertTrue(validate_revision_date(next_week))

        # Invalid dates
        self.assertFalse(validate_revision_date(yesterday))

class StatisticsUtilsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_calculate_statistics_empty(self):
        stats = calculate_statistics(self.user)
        self.assertEqual(stats['total_topics'], 0)
        self.assertEqual(stats['completed_revisions'], 0)
        self.assertEqual(stats['pending_revisions'], 0)
        self.assertEqual(stats['topics_this_week'], 0)
        self.assertEqual(stats['revisions_today'], 0)
        self.assertEqual(stats['average_daily_topics'], 0)
        self.assertEqual(stats['completion_rate'], 0)

    def test_calculate_statistics_with_data(self):
        # Create topics and revisions
        for i in range(5):
            topic = Topic.objects.create(
                user=self.user,
                title=f'Topic {i}',
                content=f'Content {i}'
            )
            RevisionSchedule.objects.create(
                topic=topic,
                scheduled_date=timezone.now().date(),
                completed=i < 3,  # First 3 are completed
                postponed=False
            )

        stats = calculate_statistics(self.user)
        self.assertEqual(stats['total_topics'], 5)
        self.assertEqual(stats['completed_revisions'], 3)
        self.assertEqual(stats['pending_revisions'], 2)
        self.assertEqual(stats['topics_this_week'], 5)
        self.assertEqual(stats['revisions_today'], 5)
        self.assertEqual(stats['average_daily_topics'], 0.71)  # 5/7
        self.assertEqual(stats['completion_rate'], 60)  # 3/5 * 100

    def test_calculate_statistics_with_postponed(self):
        topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )
        RevisionSchedule.objects.create(
            topic=topic,
            scheduled_date=timezone.now().date(),
            completed=False,
            postponed=True
        )

        stats = calculate_statistics(self.user)
        self.assertEqual(stats['pending_revisions'], 1)
        self.assertEqual(stats['completed_revisions'], 0)

class RevisionScheduleUtilsTest(TestCase):
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

    def test_get_todays_revisions_empty(self):
        revisions = get_todays_revisions(self.user)
        self.assertEqual(revisions.count(), 0)

    def test_get_todays_revisions_with_data(self):
        # Create revisions for different dates
        today = timezone.now().date()
        RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=today,
            completed=False,
            postponed=False
        )
        RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=today + timedelta(days=1),
            completed=False,
            postponed=False
        )

        today_revisions = get_todays_revisions(self.user)
        self.assertEqual(today_revisions.count(), 1)
        self.assertEqual(today_revisions[0].scheduled_date, today)

    def test_get_revision_schedule_ordering(self):
        # Create revisions with different dates
        for i in range(3):
            RevisionSchedule.objects.create(
                topic=self.topic,
                scheduled_date=timezone.now().date() + timedelta(days=i),
                completed=False,
                postponed=False
            )

        schedule = get_revision_schedule(self.user)
        for i in range(len(schedule) - 1):
            self.assertLess(schedule[i].scheduled_date, schedule[i + 1].scheduled_date) 