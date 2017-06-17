from rest_framework import viewsets
from users.api.serializers import UserSerializer, TeamSerializer

from users.models import User, Team


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_queryset(self):
        user_id = self.request.GET.get('user_id')
        if user_id:
            return User.objects.filter(user_id=user_id)
        return User.objects.all()


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

    def get_queryset(self):
        user_id = self.request.GET.get('user_id')
        if user_id:
            return Team.objects.filter(members__user_id=user_id)
        return Team.objects.all()
