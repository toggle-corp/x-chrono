# -*- coding: utf-8 -*-
# Generated by Django 1.10.5 on 2017-06-28 16:25
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0013_auto_20170628_1521'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='task',
            name='active',
        ),
    ]
