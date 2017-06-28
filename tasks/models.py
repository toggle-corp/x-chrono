from django.db import models
from django.template.defaultfilters import slugify

from datetime import datetime

from users.models import User, Team


class Project(models.Model):
    name = models.CharField(max_length=300)
    team = models.ForeignKey(Team)
    slug = models.SlugField(default=None, null=True, blank=True)

    # TODO: Probably make slug and team unique together

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super(Project, self).save(*args, **kwargs)


class Phase(models.Model):
    project = models.ForeignKey(Project)
    name = models.CharField(max_length=300)
    start_time = models.DateTimeField(default=datetime.now)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-start_time']


class Task(models.Model):
    name = models.CharField(max_length=300)
    phase = models.ForeignKey(Phase)

    def __str__(self):
        return self.name


class TaskEntry(models.Model):
    task = models.ForeignKey(Task, related_name='entries')
    user = models.ForeignKey(User)
    start_time = models.DateTimeField(default=datetime.now)
    end_time = models.DateTimeField(null=True, blank=True, default=None)

    def get_hours(self):
        if not self.end_time:
            return 0
        df = self.end_time - self.start_time
        return df.seconds / 3600

    def save(self, *args, **kwargs):
        if self.pk is None:
            self.task.active = True
            self.task.save()
        super(TaskEntry, self).save(*args, **kwargs)

    def __str__(self):
        return self.task.name + ' by ' + self.user.display_name

    class Meta:
        ordering = ['-start_time']
