from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import datetime

# Create your models here.

class Topic(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField(default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class RevisionSchedule(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    scheduled_date = models.DateField()
    completed = models.BooleanField(default=False)
    postponed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_date']

    def __str__(self):
        return f"{self.topic.title} - {self.scheduled_date}"

    def postpone(self):
        """Postpone the revision by one day"""
        self.scheduled_date = self.scheduled_date + timezone.timedelta(days=1)
        self.postponed = True
        self.save()

    def complete(self):
        """Mark the revision as completed"""
        self.completed = True
        self.save()

    @staticmethod
    def create_schedule(topic, base_date=None):
        """Create a complete revision schedule for a new topic
        
        Args:
            topic: The Topic model instance
            base_date: The date from which to calculate revision dates (defaults to today)
        """
        # Spaced repetition intervals in days
        intervals = [1, 4, 9, 16, 25, 39, 60]
        
        # Use provided base_date or default to today
        if base_date is None:
            base_date = timezone.now().date()
        
        print(f"Creating revision schedule starting from: {base_date}")
        
        for interval in intervals:
            scheduled_date = base_date + timezone.timedelta(days=interval)
            RevisionSchedule.objects.create(
                topic=topic,
                scheduled_date=scheduled_date
            )

class Revision(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('postponed', 'Postponed'),
    )

    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='revisions')
    scheduled_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    completion_date = models.DateField(null=True, blank=True)
    postponed_to = models.DateField(null=True, blank=True)
    interval = models.IntegerField(default=1)  # Days until next revision
    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.topic.title} - {self.scheduled_date}"

    class Meta:
        ordering = ['scheduled_date']

    def mark_completed(self):
        """Mark revision as completed and calculate next revision date."""
        today = datetime.date.today()
        self.status = 'completed'
        self.completion_date = today
        self.save()
        
        # Calculate next revision date based on spaced repetition algorithm
        # Simple implementation: double the interval each time
        next_interval = self.interval * 2
        next_date = today + datetime.timedelta(days=next_interval)
        
        print(f"TODAY: {today}, NEXT DATE: {next_date}, INTERVAL: {next_interval}")
        
        # Create next revision
        Revision.objects.create(
            topic=self.topic,
            scheduled_date=next_date,
            interval=next_interval,
        )
    
    def postpone(self, days=1):
        """Postpone the revision by specified number of days."""
        today = datetime.date.today()
        postponed_date = today + datetime.timedelta(days=days)
        
        self.status = 'postponed'
        self.postponed_to = postponed_date
        self.save()
        
        print(f"POSTPONING: Today: {today}, Postponed to: {postponed_date}, Days: {days}")
        
        # Create new revision for the postponed date
        Revision.objects.create(
            topic=self.topic,
            scheduled_date=postponed_date,
            interval=self.interval,  # Keep the same interval
        )
