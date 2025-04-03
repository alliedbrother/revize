from rest_framework import serializers
from .models import Topic, Revision, RevisionSchedule
from django.contrib.auth.models import User
import datetime

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password_confirm')
        extra_kwargs = {
            'email': {'required': True},
            'password': {'write_only': True, 'required': False},
            'password_confirm': {'write_only': True, 'required': False}
        }

    def validate(self, attrs):
        # Only validate passwords if this is a creation operation
        if 'password' in attrs and 'password_confirm' in attrs:
            if attrs['password'] != attrs['password_confirm']:
                raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        # Remove password_confirm as it's not needed for user creation
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password', None)
        
        # Create the user without password first
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', '')
        )
        
        # Set the password if provided
        if password:
            user.set_password(password)
            user.save()
            
        return user
        
    def update(self, instance, validated_data):
        # Remove password fields from update operation
        validated_data.pop('password', None)
        validated_data.pop('password_confirm', None)
        
        # Update other fields
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.save()
        
        return instance

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
            'id', 'title', 'content', 'user', 
            'revisions', 'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at')

class TopicCreateSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    initial_revision_date = serializers.DateField(write_only=True, required=False)

    class Meta:
        model = Topic
        fields = ('id', 'title', 'content', 'user', 'initial_revision_date')

    def create(self, validated_data):
        # Extract initial_revision_date from validated_data if provided
        initial_revision_date = None
        if 'initial_revision_date' in validated_data:
            initial_revision_date = validated_data.pop('initial_revision_date')
            print(f"USING PROVIDED DATE: {initial_revision_date}")
        
        # Create the topic
        topic = Topic.objects.create(**validated_data)
        
        # Create revision schedule for the new topic using the schedule utility
        RevisionSchedule.create_schedule(topic, base_date=initial_revision_date)
        
        return topic

class RevisionScheduleSerializer(serializers.ModelSerializer):
    topic = TopicSerializer(read_only=True)
    day_number = serializers.SerializerMethodField()

    class Meta:
        model = RevisionSchedule
        fields = ['id', 'topic', 'scheduled_date', 'completed', 'postponed', 'day_number']
        read_only_fields = ['completed', 'postponed']

    def get_day_number(self, obj):
        # Get all revisions for this topic, ordered by scheduled date
        revisions = RevisionSchedule.objects.filter(
            topic=obj.topic
        ).order_by('scheduled_date')
        
        # Find the position of the current revision in the ordered list
        for i, revision in enumerate(revisions):
            if revision.id == obj.id:
                return i + 1  # Add 1 to make it 1-indexed instead of 0-indexed
        
        return None 