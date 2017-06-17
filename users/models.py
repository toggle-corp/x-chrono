from django.db import models


class User(models.Model):
    user_id = models.CharField(max_length=300, unique=True)
    display_name = models.CharField(max_length=300)
    email = models.CharField(max_length=300, default=None, null=True,
                             blank=True, unique=True)
    photo_url = models.TextField(default=None, null=True, blank=True)

    def __str__(self):
        return self.display_name


class Team(models.Model):
    name = models.CharField(max_length=300)
    members = models.ManyToManyField(User)

    def __str__(self):
        return self.name
