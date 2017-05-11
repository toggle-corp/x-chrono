from django.db import models

from datetime import datetime

from users.models import *


class Project(models.Model):
    name = models.CharField(max_length=300)
    team = models.ForeignKey(Team)

    def __str__(self):
        return self.name


class Task(models.Model):
    name = models.CharField(max_length=300)
    project = models.ForeignKey(Project)

    plan_start = models.DateField(null=True, blank=True, default=None)
    plan_end = models.DateField(null=True, blank=True, default=None)

    def __str__(self):
        return self.name


class TaskEntry(models.Model):
    task = models.ForeignKey(Task)
    user = models.ForeignKey(User)
    start_time = models.DateTimeField(default=datetime.now)
    end_time = models.DateTimeField(null=True, blank=True, default=None)

    def get_hours(self):
        if not self.end_time:
            return 0
        df = self.end_time - self.start_time
        return df.seconds / 3600

    def __str__(self):
        return self.task.name + ' by ' + self.user.display_name

    class Meta:
        ordering = ['-start_time']
