# -*- coding: utf-8 -*-
# Generated by Django 1.10.5 on 2017-06-28 10:11
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0009_auto_20170628_1004'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='task',
            name='project',
        ),
        migrations.AlterField(
            model_name='task',
            name='phase',
            field=models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, to='tasks.Phase'),
            preserve_default=False,
        ),
    ]