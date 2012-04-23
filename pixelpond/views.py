from django.http import HttpResponse
from django.views.generic import View, TemplateView

class HttpResponseServiceUnavailable(HttpResponse):
    status_code = 503

class JSONResponseMixin(object):
    """
    A view mixin that returns the context as JSON; the encoding of the context
    into JSON is incredibly naive.
    """
    def render_to_response(self, context):
        "Returns a JSON response containing 'context' as payload"
        return HttpResponse(json.dumps(context), content_type='application/json', **kwargs)

def IndexView(TemplateView):
    template_name = 'index.html'

def APIView(View, JSONResponseMixin):
    """
    Implements the (ridiculously simple) API:
    
        `GET` returns a set of puddles for the client to simulate. 
    
        `POST` receives an updates set of puddles and writes them to the
        database.

    """
    
    def get(self, request):
        """
        Locks a single puddle in the pond, returning information about the
        pond, the locked puddle, the surrounding puddles, and the lock itself.
        """
        pond = self.pond
        
        lock, puddles = Lock.objects.create_exclusive(pond=pond)
        
        if not lock:
            # No unlocked puddles available.
            return HttpResponseServiceUnavailable()
        
        return {
            'lock': lock,
            'pond': pond,
            'puddles': puddles
        }
    
    def post(self, request):
        """
        Unlocks a previously locked puddle after updating it (and the
        surrounding puddles when possible).
        """
        data = json.loads(request.body)
        
        lock_json = data['lock']
        lock = Lock.objects.get_or_none(lock['uuid'])
        if not lock:
            return HttpResponseBadRequest()
        
        
        for puddle_json in data['puddles']:
             puddle = Puddle.objects.get_or_none(puddle['id'])
             if not puddle:
                 return HttpResponseBadRequest()
             puddles.append(puddle)
        
        
        Lock.objects.unlock(lock, puddles)
