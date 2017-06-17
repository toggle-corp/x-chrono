from django.http import JsonResponse
import json


class JsonError(JsonResponse):
    def __init__(self, message, status=500):
        super().__init__({
            'status': False, 'message': message
        }, status=status)


class JsonResult(JsonResponse):
    def __init__(self, data, extra=None, status=200):
        super().__init__({
            'status': True, 'data': data, 'extra': extra
        }, status=status)


def get_json_request(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except:
        return None


# Standard responses
JSON_METHOD_NOT_ALLOWED = JsonError('Method not allowed', status=405)
INVALID_JSON_REQUEST = JsonError('Not a valid json data')
INVALID_OBJECT_ID = JsonError('Object with given ID not found')
