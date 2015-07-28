import django_filters
from django.contrib.auth import get_user_model

from .models import Task, Sprint


User = get_user_model()


'''
TaskFilter allows the client to filter on the sprint, status, or assigned user. However,
the sprint for a task isn’t required and this filter won’t allow for selecting tasks without
a sprint. 
In our current data model, a task that isn’t currently assigned a sprint would
be considered a backlog task. 
To handle this, we add a new field to the TaskFilter called backlog that uses the NullFilter
This will make http://localhost:8000/api/tasks/?backlog=True return all tasks that aren’t
assigned to a sprint.

Another issue with TaskFilter is that the users referenced by
assigned are referenced by the pk, while the rest of the API uses the username as a
unique identifier.
We can address this by changing the field used by the underlying
ModelChoiceField as done in the TaskFilter __init__ 
In the __init__, we update the assigned filter to use the 
User.USERNAME_FIELD as the field reference rather than the default pk.
With this change in place, the tasks assigned to a user can now be
retrived using http://localhost:8000/api/tasks/?assigned=demo rather than http://local
host:8000/api/tasks/?assigned=1.
'''
class NullFilter(django_filters.BooleanFilter):
    '''Filter on a field set as null or not'''

    def filter(self, qs, value):
        if value is not None:
            return qs.filter(**{'%s__isnull' % self.name: value})
        return qs

class TaskFilter(django_filters.FilterSet):
    '''
    To handle additional filtering of the Task,
    we can make use of the DjangoFilterBackend.
    '''

    backlog = NullFilter(name='sprint')

    class Meta:
        model = Task
        fields = ('sprint', 'status', 'assigned', 'backlog')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.filters['assigned'].extra.update(
            {'to_field_name': User.USERNAME_FIELD})



class SprintFilter(django_filters.FilterSet):
    '''
    Clients might be interested in sprints that haven’t ended yet
    or will end in some range. For this, we can create a
    SprintFilter

    http://localhost:8000/api/sprints/?end_min=2014-07-01 will show
    all sprints that ended after July 1, 2014, and 
    http://localhost:8000/api/sprints/?end_max=2014-08-01 will show
    all sprints that ended before August 1, 2014. These can be combined
    to limit sprints to a given date range.
    '''

    end_min = django_filters.DateFilter(name='end', lookup_type='gte')
    end_max = django_filters.DateFilter(name='end', lookup_type='lte')

    class Meta:
        model = Sprint
        fields = ('end_min', 'end_max',)