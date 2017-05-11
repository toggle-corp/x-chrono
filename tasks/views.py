from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.generic import View
from django.utils import dateformat

from chrono.json_utils import *
from users.models import *
from tasks.models import *

from time import sleep, strftime
import csv


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
            'project': {
                'projectId': project.pk,
                'name': project.name,
                'team': project.team.pk,
             } if project else None
        })

    def delete(self, request):
        data_in = get_json_request(request)
        if data_in is None:
            return INVALID_JSON_REQUEST

        if 'projectId' not in data_in:
            return INVALID_OBJECT_ID

        Project.objects.filter(pk=data_in['projectId']).delete()
        return JsonResult({'deleted': True})

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
            data.append({
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
                'project': Project.objects.get(pk=data_in['project']),
                'plan_start': datetime.fromtimestamp(int(data_in['planStart'])/1000) if data_in.get('planStart') else None,
                'plan_end': datetime.fromtimestamp(int(data_in['planEnd'])/1000) if data_in.get('planEnd') else None,
            }
        )

        return JsonResult({
            'created': created,
            'task': {
                'taskId': task.pk,
                'name': task.name,
                'project': task.project.pk,
                'planStart': int(dateformat.format(task.plan_start, 'U')) * 1000 if task.plan_start else None,
                'planEnd': int(dateformat.format(task.plan_end, 'U')) * 1000 if task.plan_end else None,
            } if task else None
        })

    def delete(self, request):
        data_in = get_json_request(request)
        if data_in is None:
            return INVALID_JSON_REQUEST

        if 'taskId' not in data_in:
            return INVALID_OBJECT_ID

        Task.objects.filter(pk=data_in['taskId']).delete()
        return JsonResult({'deleted': True})

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
                'project': task.project.pk,
                'planStart': int(dateformat.format(task.plan_start, 'U')) * 1000 if task.plan_start else None,
                'planEnd': int(dateformat.format(task.plan_end, 'U')) * 1000 if task.plan_end else None,
            }
            if user_id:
                obj['entries'] = [
                    {
                        'entryId': entry.pk,
                        'task': entry.task.pk,
                        'user': entry.user.user_id,
                        'startTime': int(dateformat.format(entry.start_time, 'U')) * 1000,
                        'endTime': (int(dateformat.format(entry.end_time, 'U')) * 1000) if entry.end_time else None
                    } for entry in TaskEntry.objects.filter(task__pk=task.pk, user__user_id=user_id)
                ]
            data.append(obj)
            taskPks.append(task.pk)

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
                'start_time': datetime.fromtimestamp(int(data_in['startTime'])/1000),
                'end_time': datetime.fromtimestamp(int(data_in['endTime'])/1000) if data_in.get('endTime') else None,
            }
        )

        return JsonResult({
            'created': created,
            'entry': {
                'entryId': entry.pk,
                'task': entry.task.pk,
                'user': entry.user.user_id,
                'startTime': int(dateformat.format(entry.start_time, 'U')) * 1000,
                'endTime': (int(dateformat.format(entry.end_time, 'U')) * 1000) if entry.end_time else None
            } if entry else None
        })

    def delete(self, request):
        data_in = get_json_request(request)
        if data_in is None:
            return INVALID_JSON_REQUEST

        if 'entryId' not in data_in:
            return INVALID_OBJECT_ID

        TaskEntry.objects.filter(pk=data_in['entryId']).delete()
        return JsonResult({'deleted': True})

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
            entries = entries.filter(user__user_id=user_id)

        data = []
        for entry in entries:
            data.append({
                'entryId': entry.pk,
                'task': entry.task.pk,
                'user': entry.user.user_id,
                'startTime': int(dateformat.format(entry.start_time, 'U')) * 1000,
                'endTime': (int(dateformat.format(entry.end_time, 'U')) * 1000) if entry.end_time else None
            })

        return JsonResult(data=data)


@method_decorator(csrf_exempt, name='dispatch')
class ExportProjectView(View):
    def get(self, request, project_id):
        project = Project.objects.get(id=project_id)
        users = project.team.members.all()
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] =\
                'attachment; filename="{} {}.csv"'\
                .format(strftime("%d%m%Y"), project.name)
        writer = csv.writer(response)

        # Start with header row
        header = ['Tasks']
        for user in users:
            header.append(user.display_name)
        header.append('Total')

        writer.writerow(header)


        # Now create row for each task
        for task in project.task_set.all():
            if task.taskentry_set.count() == 0:
                continue

            row = [task.name]
            total_hours = 0
            for user in users:

                hours = 0
                for entry in TaskEntry.objects.filter(task=task, user=user):
                    hours += entry.get_hours()

                row.append("{0:.1f}".format(hours))
                total_hours += hours

            row.append("{0:.1f}".format(total_hours))
            writer.writerow(row)

        # Final total row
        row = ['Total']
        total_hours = 0
        for user in users:
            hours = 0
            for entry in TaskEntry.objects.filter(task__project=project,
                                                  user=user):
                hours += entry.get_hours()

            row.append("{0:.1f}".format(hours))
            total_hours += hours

        row.append("{0:.1f}".format(total_hours))
        writer.writerow(row)

        return response
