from django.utils.dateparse import parse_date

from rest_framework import viewsets, views, response
from tasks.api.serializers import ProjectSerializer, TaskSerializer, \
    TaskEntrySerializer

from tasks.models import Project, Task, TaskEntry
from users.models import User

from datetime import timedelta


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_queryset(self):
        user_id = self.request.GET.get('user_id')
        if user_id:
            return Project.objects.filter(team__members__user_id=user_id)
        return Project.objects.all()


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        user_id = self.request.GET.get('user_id')
        if user_id:
            return Task.objects.filter(project__team__members__user_id=user_id)
        return Task.objects.all()


class TaskEntryViewSet(viewsets.ModelViewSet):
    queryset = TaskEntry.objects.all()
    serializer_class = TaskEntrySerializer


class SummaryApi(views.APIView):
    def get(self, request, project_id):
        project = Project.objects.get(pk=project_id)
        tasks = Task.objects.filter(project=project)
        users = User.objects.filter(team__project=project)

        task_filter = request.GET.get('tasks')
        if task_filter:
            filter_by = [int(x) for x in task_filter.split(',')]
            tasks = tasks.filter(pk__in=filter_by)

        user_filter = request.GET.get('users')
        if user_filter:
            filter_by = [int(x) for x in user_filter.split(',')]
            users = users.filter(pk__in=filter_by)

        start_date = request.GET.get('start_date')
        if start_date:
            start_date = parse_date(start_date)

        end_date = request.GET.get('end_date')
        if end_date:
            end_date = parse_date(end_date) + timedelta(days=1)

        entries = []
        for task in tasks:
            es = TaskEntry.objects.filter(task=task, user__in=users)
            if start_date:
                es = es.filter(start_time__gte=start_date)
            if end_date:
                es = es.filter(end_time__lte=end_date)

            entries.extend([{
                'pk': e.pk,
                'task': e.task.pk,
                'user': e.user.pk,
                'start_time': e.start_time.isoformat(),
                'end_time': e.end_time.isoformat(),
                'hours': e.get_hours(),
            } for e in es])

        data = {
            'entries': entries,
        }

        return response.Response(data)
