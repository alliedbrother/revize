from rest_framework import serializers
from .models import Topic, Revision
from django.contrib.auth.models import User
import datetime

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class RevisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Revision
        fields = (
            'id', 'topic', 'scheduled_date', 'status', 
            'completion_date', 'postponed_to', 'interval', 
            'date_created', 'date_modified'
        )
        read_only_fields = ('date_created', 'date_modified')

class TopicSerializer(serializers.ModelSerializer):
    revisions = RevisionSerializer(many=True, read_only=True)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Topic
        fields = (
            'id', 'title', 'description', 'user', 
            'revisions', 'date_created', 'date_modified'
        )
        read_only_fields = ('date_created', 'date_modified')

class TopicCreateSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    initial_revision_date = serializers.DateField(write_only=True, required=False)

    class Meta:
        model = Topic
        fields = ('id', 'title', 'description', 'user', 'initial_revision_date')

    def create(self, validated_data):
        # Use provided initial_revision_date if available, otherwise default to tomorrow
        initial_revision_date = None
        if 'initial_revision_date' in validated_data:
            initial_revision_date = validated_data.pop('initial_revision_date')
            print(f"USING PROVIDED DATE: {initial_revision_date}")
        
        # If no date was provided, default to next day (tomorrow)
        if not initial_revision_date:
            today = datetime.date.today()
            initial_revision_date = today + datetime.timedelta(days=1)
            print(f"CALCULATED TOMORROW'S DATE: {today} + 1 day = {initial_revision_date}")
        
        topic = Topic.objects.create(**validated_data)
        
        # Create the first revision with the chosen date
        Revision.objects.create(
            topic=topic,
            scheduled_date=initial_revision_date,
            interval=1,
        )
        return topic 