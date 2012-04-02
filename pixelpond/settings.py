from django.conf import settings

# The maximum depth of all ``Pond``s. 
PIXELPOND_MAX_DEPTH = getattr(settings, 'PIXELPOND_LENGTH', 1024)
