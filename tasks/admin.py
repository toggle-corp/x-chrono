from django.contrib import admin
from tasks.models import *


admin.site.register(Project)
admin.site.register(Task)
admin.site.register(TaskEntry)
