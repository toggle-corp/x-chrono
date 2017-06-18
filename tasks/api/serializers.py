from rest_framework import serializers

from tasks.models import Project, Task, TaskEntry


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ('pk', 'name', 'team', 'slug')
        read_only_fields = ('slug', )


class TaskEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskEntry
        fields = ('pk', 'task', 'user', 'start_time',
                  'end_time')


class TaskSerializer(serializers.ModelSerializer):
    # entries = TaskEntrySerializer(many=True, read_only=True)
    entries = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ('pk', 'name', 'project', 'plan_start', 'plan_end',
                  'active', 'entries')

    def get_entries(self, task):
        entries = TaskEntry.objects.filter(task=task)
        user_id = self.context['request'].GET.get('user_id')
        if user_id:
            entries = entries.filter(user__user_id=user_id)
        return TaskEntrySerializer(entries, many=True).data
