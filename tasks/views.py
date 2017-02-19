from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.generic import View
from django.utils import dateformat

from chrono.json_utils import *
from users.models import *
from tasks.models import *


@method_decorator(csrf_exempt, name='dispatch')
class ProjectApiView(View):

    def post(self, request):
        data_in = get_json_request(request)
        if data_in is None:
            return INVALID_JSON_REQUEST

        project, created = Project.objects.update_or_create(
            pk=data_in['projectId'],
            defaults={
                'pk': data_in['projectId'],
                'name': data_in['name'],
                'team': Team.objects.get(pk=data_in['team'])
            }
        )

        return JsonResult({
            'created': created,
            'projectId': project.pk if created else None
        })

    def get(self, request):
        projects = Project.objects.all()

        project_id = request.GET.get('projectId')
        if project_id:
            projects = projects.filter(pk=project_id)

        team_id = request.GET.get('teamId')
        if team_id:
            projects = projects.filter(team__pk=team_id)

        user_id = request.GET.get('userId')
        if user_id:
            projects = projects.filter(team__members__user_id=user_id)

        data = []
        for project in projects:
            data.push({
                'projectId': project.pk,
                'name': project.name,
                'team': project.team.pk,
            })

        return JsonResult(data=data)


@method_decorator(csrf_exempt, name='dispatch')
class TaskApiView(View):

    def post(self, request):
        data_in = get_json_request(request)
        if data_in is None:
            return INVALID_JSON_REQUEST

        task, created = Task.objects.update_or_create(
            pk=data_in['taskId'],
            defaults={
                'pk': data_in['taskId'],
                'name': data_in['name'],
                'project': Project.objects.get(pk=data_in['project'])
            }
        )

        return JsonResult({
            'created': created,
            'taskid': task.pk if created else None
        })

    def get(self, request):
        tasks = Task.objects.all()

        task_id = request.GET.get('taskId')
        if task_id:
            tasks = tasks.filter(pk=task_id)

        project_id = request.GET.get('projectId')
        if project_id:
            tasks = tasks.filter(project__pk=project_id)

        user_id = request.GET.get('userId')

        data = []
        taskPks = []
        for task in tasks:
            obj = {
                'taskId': task.pk,
                'name': task.name,
                'project': task.project.pk
            }
            if user_id:
                obj['entries'] = [
                    {
                        'entryId': entry.pk,
                        'task': entry.task.pk,
                        'user': entry.user.user_id,
                        'startTime': dateformat.format(entry.start_time, 'U'),
                        'endTime': dateformat.format(entry.end_time, 'U') if entry.end_time else None
                    } for entry in TaskEntry.objects.filter(task__pk=task.pk, user__user_id=user_id)
                ]
            data.push(obj)
            taskPks.push(task.pk)

        return JsonResult(data=data)


@method_decorator(csrf_exempt, name='dispatch')
class TaskEntryApiView(View):

    def post(self, request):
        data_in = get_json_request(request)
        if data_in is None:
            return INVALID_JSON_REQUEST

        entry, created = TaskEntry.objects.update_or_create(
            pk=data_in['entryId'],
            defaults={
                'pk': data_in['entryId'],
                'task': Task.objects.get(pk=data_in['task']),
                'user': User.objects.get(user_id=data_in['user']),
                'start_time': datetime.fromtimestamp(data_in['startTime']),
                'end_time': datetime.fromtimestamp(data_in['endTime']) if 'endTime' in data_in else None,
            }
        )

        return JsonResult({
            'created': created,
            'entryId': entry.pk if created else None
        })

    def get(self, request):
        entries = TaskEntry.objects.all()

        entry_id = request.GET.get('entryId')
        if entry_id:
            entries = entries.filter(pk=entry_id)

        task_id = request.GET.get('taskId')
        if task_id:
            entries = entries.filter(task__pk=task_id)

        user_id = request.GET.get('userId')
        if user_id:
            entries = entries.filter(team__user__user_id=user_id)

        data = []
        for entry in entries:
            data.push({
                'entryId': entry.pk,
                'task': entry.task.pk,
                'user': entry.user.user_id,
                'startTime': dateformat.format(entry.start_time, 'U'),
                'endTime': dateformat.format(entry.end_time, 'U') if entry.end_time else None
            })

        return JsonResult(data=data)
