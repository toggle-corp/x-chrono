from django.http import HttpResponse
from django.shortcuts import render
from django.views.generic import View

from tasks.models import Team, Project, TaskEntry
from time import strftime
import csv


class HomeView(View):
    def get(self, request):
        return render(request, 'chrono/landing.html')


class TeamView(View):
    def get(self, request, team_slug):
        team = Team.objects.get(slug=team_slug)
        context = {
            'team': team,
        }
        return render(request, 'chrono/home.html', context)


class DashboardView(View):
    def get(self, request, team_slug, project_slug):
        team = Team.objects.get(slug=team_slug)
        project = Project.objects.get(team=team, slug=project_slug)

        context = {
            'team': team,
            'project': project,
        }
        return render(request, 'chrono/dashboard.html', context)
