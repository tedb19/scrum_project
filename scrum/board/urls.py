from rest_framework.routers import DefaultRouter

from . import views


'''
Will set trailing_slash=False since the
default Backbone.Model.url constucts URLs
without trailing slashes.
However, django-rest-framework includes
the trailing slash by default.
'''
router = DefaultRouter(trailing_slash=False)
router.register(r'sprints', views.SprintViewSet)
router.register(r'tasks', views.TaskViewSet)
router.register(r'users', views.UserViewSet)
