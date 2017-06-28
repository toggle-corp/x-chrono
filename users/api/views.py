from django.db.models import Q

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

        queryset = User.objects.all()
        q = self.request.GET.get('q')
        if q:
            for term in q.split():
                queryset = User.objects.filter(
                    Q(display_name__icontains=term) |
                    Q(email__icontains=term))
        return queryset


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

    def get_queryset(self):
        teams = Team.objects.all()

        user_id = self.request.GET.get('user_id')
        if user_id:
            teams = teams.filter(members__user_id=user_id)

        team_id = self.request.GET.get('team_id')
        if team_id:
            teams = teams.filter(pk=team_id)

        return teams
