from rest_framework import viewsets
from tasks.api.serializers import ProjectSerializer, TaskSerializer, \
    TaskEntrySerializer

from tasks.models import Project, Task, TaskEntry


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
