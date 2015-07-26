from django.contrib.auth import get_user_model

from rest_framework import serializers

from .models import Sprint, Task


'''
Accessing the User model this way ensures that
in case the AUTH_USER_MODEL has been swapped out
for another later on, we have a DRY way of doing it,
i.e. the change only affects the settings.py file 
'''
User = get_user_model()


class SprintSerializer(serializers.ModelSerializer):

    class Meta:
        model = Sprint
        fields = ('id', 'name', 'description', 'end',)


class TaskSerializer(serializers.ModelSerializer):

    '''
    status_display is a read-only field to be serialized,
    that returns the value of the get_status_display
    method on the serializer.
    This is to show the text associated with the status,
    and not the number
    '''
    status_display = serializers.SerializerMethodField('get_status_display')

    '''
    For the assigned, we'll need to display the user's
    username, not their pk
    ''' 
    assigned = serializers.SlugRelatedField(
        slug_field=User.USERNAME_FIELD, required=False)

    class Meta:
        model = Task
        fields = ('id', 'name', 'description', 'sprint',
              'status', 'status_display', 'order','assigned',
              'started', 'due', 'completed',)

    def get_status_display(self, obj):
        return obj.get_status_display()


class UserSerializer(serializers.ModelSerializer):
    '''
    This serializer assumes that if a custom User model is used,
    then it extends from django.contrib.auth.models.CustomUser,
    which will always have a USERNAME_FIELD attribute, get_full_name
    method, and is_active attribute. Also note that since get_full_name
    is a method, the field in the serializer is marked as read-only.
    '''
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = ('id', User.USERNAME_FIELD, 'full_name', 'is_active',)