from datetime import date

from django.contrib.auth import get_user_model
from django.utils.translation import ugettext_lazy as _

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
                kwargs={'pk': obj.pk}, request=request),
            'tasks': reverse('task-list', request=request)
                + '?sprint={}'.format(obj.pk),
        }

    '''
    We need to prevent creation of sprints that have happened prior to the
    current date and time.
    To handle this, we need to check the value of the end date submitted
    by the client.
    Each serializer field has a validate_<field> hook that
    is called to perform additional validations on the field. This
    parallels the clean_<field> in Django’s forms.
    This method raises a HTTP 400 Bad Request when the constraint is violated
    '''

    def validate_end(self, value):
        new = self.instance is None
        updated = not new and self.initial_data['end'] != self.instance.end
        if(new or updated) and value < date.today():
            msg = _('End date cannot be in the past.')
            raise serializers.ValidationError(msg)
        return value


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
        queryset=User.objects.all())

    class Meta:
        model = Task
        fields = ('id', 'name', 'description', 'sprint',
              'status', 'status_display', 'order', 'assigned',
              'started', 'due', 'completed', 'links',)

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_links(self, obj):
        request = self.context['request']
        links = {
            'self': reverse('task-detail',
                kwargs={'pk': obj.pk}, request=request),
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

    '''
    getattr(object, name[, default])
        Return the value of the named attribute of object.
        name must be a string.
        If the string is the name of one of the object’s attributes, the result
        is the value of that attribute.
        For example, getattr(x, 'foobar') is equivalent to x.foobar.
        If the named attribute does not exist, default is returned if provided,
        otherwise AttributeError is raised.

    validate_sprint ensures that the sprint is not changed after the task is
    completed and that tasks are not assigned to sprints that have already been
    completed.
    '''

    def validate_sprint(self, value):
        orig_task = getattr(self, 'instance', None)
        orig_sprint = getattr(orig_task, 'sprint', None)
        sprint = value
        if (getattr(orig_sprint, 'id', None) != getattr(sprint,'id', None) and int(self.initial_data['status']) == Task.STATUS_DONE):
            raise serializers.ValidationError(
                _('Cannot change the sprint of a completed task.'))
        if getattr(sprint, 'end', date.today()) < date.today():
            raise serializers.ValidationError(
                _('Cannot assign tasks to past sprints.'))
        return value

    '''
    Validating conditions that require more than one
    field is handled in the validate method, which
    parallels the clean method for forms.

    validate ensures that the combination of fields makes
    sense for the task.
    '''

    def validate(self, data):
        sprint = data.get('sprint', None)
        status = data.get('status', None)
        started = data.get('started', None)
        completed = data.get('completed', None)
        if not sprint and status != Task.STATUS_TODO:
            raise serializers.ValidationError(
                _('Backlog tasks must have "Not started" status'))
        if started and status == Task.STATUS_TODO:
            raise serializers.ValidationError(
                _('"Not Started" tasks cannot have a start date'))
        if completed and status != Task.STATUS_DONE:
            raise serializers.ValidationError(
                _('Completed date cannot be set for incomplete tasks'))
        if status == Task.STATUS_DONE and not completed:
            raise serializers.ValidationError(
                _('Completed tasks must have a completed date'))
        return data


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
        fields = ('id', User.USERNAME_FIELD,
            'full_name', 'is_active', 'links',)

    def get_links(self, obj):
        request = self.context['request']
        username = obj.get_username()
        return {
            'self': reverse('user-detail',
                kwargs={User.USERNAME_FIELD: username},
                 request=request),
            'tasks': '{}?assigned={}'.format(
                reverse('task-list', request=request), username)
        }
