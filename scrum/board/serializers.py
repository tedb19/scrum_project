from django.contrib.auth import get_user_model

from rest_framework import serializers

from .models import Sprint, Task


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