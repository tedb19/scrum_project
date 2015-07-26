from django.contrib.auth import get_user_model

from rest_framework import viewsets

from .models import Sprint, Task
from .serializers import SprintSerializer, TaskSerializer, UserSerializer


User = get_user_model()


class SprintViewSet(viewsets.ModelViewSet):
    '''
    API endpoint for listing and creating sprints.
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions.
    '''

    queryset = Sprint.objects.order_by('end')
    serializer_class = SprintSerializer


class TaskViewSet(viewsets.ModelViewSet):
    '''API endpoint for listing and creating tasks'''

    queryset = Task.objects.all()
    serializer_class = TaskSerializer


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    '''
    API endpoint for listing users.
    The ReadOnlyModelViewSet viewset automatically
    provides `list` and `detail` actions.
    It does not provide 'delete' and 'create' actions
    '''

    # here we change the lookup from using the ID
    # of the user to the username
    lookup_field = User.USERNAME_FIELD
    lookup_url_kwarg = User.USERNAME_FIELD
    queryset = User.objects.order_by(User.USERNAME_FIELD)
    serializer_class = UserSerializer