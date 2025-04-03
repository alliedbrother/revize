from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from ..models import Topic, RevisionSchedule
from ..forms import TopicForm, RevisionScheduleForm

User = get_user_model()

class TopicFormTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_topic_form_valid(self):
        form_data = {
            'title': 'Test Topic',
            'content': 'Test Content'
        }
        form = TopicForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_topic_form_empty_title(self):
        form_data = {
            'title': '',
            'content': 'Test Content'
        }
        form = TopicForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('title', form.errors)

    def test_topic_form_empty_content(self):
        form_data = {
            'title': 'Test Topic',
            'content': ''
        }
        form = TopicForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('content', form.errors)

    def test_topic_form_long_title(self):
        form_data = {
            'title': 'A' * 201,  # Title field max length is 200
            'content': 'Test Content'
        }
        form = TopicForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('title', form.errors)

    def test_topic_form_save(self):
        form_data = {
            'title': 'Test Topic',
            'content': 'Test Content'
        }
        form = TopicForm(data=form_data)
        self.assertTrue(form.is_valid())
        topic = form.save(commit=False)
        topic.user = self.user
        topic.save()
        self.assertEqual(Topic.objects.count(), 1)
        self.assertEqual(Topic.objects.first().title, 'Test Topic')

class RevisionScheduleFormTest(TestCase):
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

    def test_revision_schedule_form_valid(self):
        form_data = {
            'topic': self.topic.id,
            'scheduled_date': timezone.now().date(),
            'completed': False,
            'postponed': False
        }
        form = RevisionScheduleForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_revision_schedule_form_missing_topic(self):
        form_data = {
            'scheduled_date': timezone.now().date(),
            'completed': False,
            'postponed': False
        }
        form = RevisionScheduleForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('topic', form.errors)

    def test_revision_schedule_form_missing_date(self):
        form_data = {
            'topic': self.topic.id,
            'completed': False,
            'postponed': False
        }
        form = RevisionScheduleForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('scheduled_date', form.errors)

    def test_revision_schedule_form_past_date(self):
        form_data = {
            'topic': self.topic.id,
            'scheduled_date': timezone.now().date() - timezone.timedelta(days=1),
            'completed': False,
            'postponed': False
        }
        form = RevisionScheduleForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('scheduled_date', form.errors)

    def test_revision_schedule_form_invalid_status(self):
        form_data = {
            'topic': self.topic.id,
            'scheduled_date': timezone.now().date(),
            'completed': True,
            'postponed': True  # Cannot be both completed and postponed
        }
        form = RevisionScheduleForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('__all__', form.errors)

    def test_revision_schedule_form_save(self):
        form_data = {
            'topic': self.topic.id,
            'scheduled_date': timezone.now().date(),
            'completed': False,
            'postponed': False
        }
        form = RevisionScheduleForm(data=form_data)
        self.assertTrue(form.is_valid())
        revision = form.save()
        self.assertEqual(RevisionSchedule.objects.count(), 1)
        self.assertEqual(RevisionSchedule.objects.first().topic, self.topic)

    def test_revision_schedule_form_update(self):
        revision = RevisionSchedule.objects.create(
            topic=self.topic,
            scheduled_date=timezone.now().date(),
            completed=False,
            postponed=False
        )
        form_data = {
            'topic': self.topic.id,
            'scheduled_date': timezone.now().date(),
            'completed': True,
            'postponed': False
        }
        form = RevisionScheduleForm(data=form_data, instance=revision)
        self.assertTrue(form.is_valid())
        updated_revision = form.save()
        self.assertTrue(updated_revision.completed)

    def test_revision_schedule_form_clean(self):
        # Test that clean method validates the form
        form_data = {
            'topic': self.topic.id,
            'scheduled_date': timezone.now().date(),
            'completed': True,
            'postponed': True
        }
        form = RevisionScheduleForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('A revision cannot be both completed and postponed.', form.errors['__all__'])

    def test_revision_schedule_form_widgets(self):
        form = RevisionScheduleForm()
        self.assertEqual(form.fields['scheduled_date'].widget.input_type, 'date')
        self.assertEqual(form.fields['completed'].widget.input_type, 'checkbox')
        self.assertEqual(form.fields['postponed'].widget.input_type, 'checkbox')

    def test_revision_schedule_form_help_text(self):
        form = RevisionScheduleForm()
        self.assertIn('Date when the revision is scheduled', form.fields['scheduled_date'].help_text)
        self.assertIn('Whether the revision has been completed', form.fields['completed'].help_text)
        self.assertIn('Whether the revision has been postponed', form.fields['postponed'].help_text) 