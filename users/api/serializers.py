from rest_framework import serializers

from users.models import User, Team


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('pk', 'user_id', 'display_name', 'email',
                  'photo_url')


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ('pk', 'name', 'members')
