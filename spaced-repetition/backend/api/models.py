from django.db import models
from django.contrib.auth.models import User
import datetime

# Create your models here.

class Topic(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='topics')
    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-date_created']

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
