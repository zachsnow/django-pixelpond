from django.conf import settings
from django.conf.urls import *

from pixelpond.views import index, pond

pixelpond_urlpatterns = patterns('',
    url(r'^$', index, name='index'),
    url(r'^pond/$', pond, name='pond'),
)

urlpatterns = patterns('',
    url(r'^pixelpond/', include(pixelpond_patterns, namespace='pixelpond')),
)
