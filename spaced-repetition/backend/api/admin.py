from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import Topic, Revision

class TokenInline(admin.TabularInline):
    model = Token
    readonly_fields = ['key', 'created']
    can_delete = False
    max_num = 1
    verbose_name_plural = 'Authentication Token'

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined', 'last_login')
    list_filter = ('is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email')
    ordering = ('-date_joined',)
    inlines = [TokenInline]
    actions = ['reset_password']
    
    def reset_password(self, request, queryset):
        for user in queryset:
            user.set_password('resetpassword123')
            user.save()
        self.message_user(request, f"Reset password to 'resetpassword123' for {queryset.count()} users.")
    reset_password.short_description = "Reset password to 'resetpassword123'"

# Unregister the default UserAdmin
admin.site.unregister(User)
# Register the CustomUserAdmin
admin.site.register(User, CustomUserAdmin)

@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'date_created')
    list_filter = ('date_created',)
    search_fields = ('title', 'description')
    readonly_fields = ('date_created',)

@admin.register(Revision)
class RevisionAdmin(admin.ModelAdmin):
    list_display = ('get_topic_title', 'scheduled_date', 'status', 'interval')
    list_filter = ('status', 'scheduled_date')
    search_fields = ('topic__title',)
    
    def get_topic_title(self, obj):
        return obj.topic.title
    get_topic_title.short_description = 'Topic'
    get_topic_title.admin_order_field = 'topic__title'
