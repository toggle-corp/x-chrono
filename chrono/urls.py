"""chrono URL Configuration
"""
from django.conf.urls import url
from django.contrib import admin

from chrono.views import *
from users.views import *
from tasks.views import *


urlpatterns = [
    url(r'^$', HomeView.as_view(), name='home'),

    url(r'^api/v1/user/$', UserApiView.as_view(), name='user_api'),
    url(r'^api/v1/team/$', TeamApiView.as_view(), name='team_api'),

    url(r'^api/v1/project/$', ProjectApiView.as_view(), name='project_api'),
    url(r'^api/v1/task/$', TaskApiView.as_view(), name='task_api'),
    url(r'^api/v1/entry/$', TaskEntryApiView.as_view(), name='entry_api'),

    url(r'^export_project/(?P<project_id>\d+)/$', ExportProjectView.as_view(), name='export_project'),

    url(r'^admin/', admin.site.urls),
]
