"""chrono URL Configuration
"""
from django.conf.urls import url, include
from django.contrib import admin

from rest_framework import routers

from chrono.views import HomeView
from tasks.views import ExportProjectView

from users.api.views import UserViewSet, TeamViewSet
from tasks.api.views import ProjectViewSet, TaskViewSet, TaskEntryViewSet


router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'teams', TeamViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'entries', TaskEntryViewSet)


urlpatterns = [
    url(r'^$', HomeView.as_view(), name='home'),

    url(r'^api/v1/', include(router.urls)),
    url(r'^export_project/(?P<project_id>\d+)/$', ExportProjectView.as_view(),
        name='export_project'),

    url(r'^admin/', admin.site.urls),
]
