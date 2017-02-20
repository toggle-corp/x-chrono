from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.generic import View

from chrono.json_utils import *
from users.models import *


class UserApiView(View):

    def post(self, request):
        data_in = get_json_request(request)
        if data_in is None:
            return INVALID_JSON_REQUEST

        user, created = User.objects.update_or_create(
            user_id=data_in['userId'],
            defaults={
                'user_id': data_in['userId'],
                'display_name': data_in['displayName'],
                'email': data_in['email'],
                'photo_url': data_in['photoUrl'],
            }
        )

        return JsonResult({
            'created': created,
            'userId': user.pk if created else None
        })

    def get(self, request):
        users = User.objects.all()

        user_id = request.GET.get('userId')
        if user_id:
            users = users.filter(user_id=user_id)

        data = []
        for user in users:
            data.append({
                'userId': user.user_id,
                'displayName': user.displayName,
                'email': user.email,
                'photoUrl': user.photo_url,
            })

        return JsonResult(data=data)


class TeamApiView(View):

    def post(self, request):
        data_in = get_json_request(request)
        if data_in is None:
            return INVALID_JSON_REQUEST

        team, created = Team.objects.update_or_create(
            pk=data_in['teamId'],
            defaults={
                'pk': data_in['teamId'],
                'name': data_in['name'],
            }
        )

        if created:
            for userId in data_in['members']:
                team.members.add(User.objects.get(user_id=userId))

        return JsonResult({
            'created': created,
            'userId': user.pk if created else None
        })

    def get(self, request):
        teams = Team.objects.all()

        team_id = request.GET.get('teamId')
        if team_id:
            teams = teams.filter(pk=team_id)

        user_id = request.GET.get('userId')
        if user_id:
            teams = teams.filter(members__user_id=user_id)

        data = []
        for team in teams:
            data.append({
                'teamId': team.pk,
                'name': team.name,
                'members': [
                    user.pk for user in team.members.all()
                ]
            })

        return JsonResult(data=data)
