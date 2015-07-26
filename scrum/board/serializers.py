from django.contrib.auth import get_user_model

from rest_framework import serializers
from rest_framework.reverse import reverse

from .models import Sprint, Task


'''
Accessing the User model this way ensures that
in case the AUTH_USER_MODEL has been swapped out
for another later on, we have a DRY way of doing it,
i.e. the change only affects the settings.py file 
'''
User = get_user_model()


class SprintSerializer(serializers.ModelSerializer):

    # read-only links field for the response body
    links = serializers.SerializerMethodField()

    class Meta:
        model = Sprint
        fields = ('id', 'name', 'description', 'end', 'links')

    '''
    To populate the links value, we have a get_links
    method to build the related links.
    For now there is only a single key in the dictionary, called "self",
    which links to the details for that resource. get_links doesn’t use the
    standard reverse from Django, but rather a modification that is built
    into django-rest-framework. Unlike Django’s reverse, this will return
    the full URI, including the hostname and protocol, along with the path.
    For this, reverse needs the current request, which is passed into
    the serializer context by default when we’re using the standard ViewSets.
    '''
    def get_links(self, obj):
        request = self.context['request']
        return {
            'self': reverse('sprint-detail',
                kwargs={'pk':obj.pk}, request=request),
        }


class TaskSerializer(serializers.ModelSerializer):

    links = serializers.SerializerMethodField()

    '''
    status_display is a read-only field to be serialized,
    that returns the value of the get_status_display
    method on the serializer.
    This is to show the text associated with the status,
    and not the number
    '''
    status_display = serializers.SerializerMethodField()

    '''
    For the assigned, we'll need to display the user's
    username, not their pk
    ''' 
    assigned = serializers.SlugRelatedField(
        slug_field=User.USERNAME_FIELD, required=False,
        read_only=True)

    class Meta:
        model = Task
        fields = ('id', 'name', 'description', 'sprint',
              'status', 'status_display', 'order','assigned',
              'started', 'due', 'completed','links',)

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_links(self, obj):
        request = self.context['request']
        links = {
            'self': reverse('task-detail',
                kwargs={'pk':obj.pk}, request=request),
            'sprint': None,
            'assigned': None
        }
        if obj.sprint_id:
            links['sprint'] = reverse('sprint-detail', 
                kwargs={'pk': obj.sprint_id}, request=request)
        if obj.assigned:
            links['assigned'] = reverse('user-detail', 
                kwargs={User.USERNAME_FIELD: obj.assigned}, request=request)
        return links



class UserSerializer(serializers.ModelSerializer):
    '''
    This serializer assumes that if a custom User model is used,
    then it extends from django.contrib.auth.models.CustomUser,
    which will always have a USERNAME_FIELD attribute, get_full_name
    method, and is_active attribute. Also note that since get_full_name
    is a method, the field in the serializer is marked as read-only.
    '''

    links = serializers.SerializerMethodField()

    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = ('id', User.USERNAME_FIELD, 'full_name', 'is_active','links',)

    def get_links(self, obj):
        request = self.context['request']
        username = obj.get_username()
        return {
            'self': reverse('user-detail',
                kwargs={User.USERNAME_FIELD: username}, request=request),
        }