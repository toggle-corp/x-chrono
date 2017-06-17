from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.generic import View

from tasks.models import Project, TaskEntry

from time import strftime
import csv


@method_decorator(csrf_exempt, name='dispatch')
class ExportProjectView(View):
    def get(self, request, project_id):
        project = Project.objects.get(id=project_id)
        users = project.team.members.all()

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = \
            'attachment; filename="{} {}.csv"' \
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
