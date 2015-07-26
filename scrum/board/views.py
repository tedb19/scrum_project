from rest_framework import viewsets

from .models import Sprint
from .serializers import SprintSerializer


class SprintViewSet(viewsets.ModelViewSet):
    '''API endpoint for listing and creating sprints'''

    queryset = Sprint.objects.order_by('end')
    serializer_class = SprintSerializer
