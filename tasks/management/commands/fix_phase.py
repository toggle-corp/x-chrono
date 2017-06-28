from django.core.management.base import BaseCommand
from django.db.models import Min

from tasks.models import Phase, TaskEntry


class Command(BaseCommand):
    def handle(self, *args, **options):
        for phase in Phase.objects.all():
            min_time = TaskEntry.objects.filter(task__phase=phase)\
                .aggregate(Min('start_time'))['start_time__min']

            if min_time < phase.start_time:
                phase.start_time = min_time
                phase.save()
