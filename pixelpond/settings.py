from django.conf import settings

# The maximum depth of all ``Pond``s. 
PIXELPOND_POND_DEPTH = getattr(settings, 'PIXELPOND_POND_DEPTH', 1024)

# The default size of one side of a (square) ``Puddle``.
PIXELPOND_DEFAULT_PUDDLE_SIZE = getattr(settings, 'PIXELPOND_PUDDLE_SIZE', 64)

# The default size of a ``Pond``, in ``Puddle``s.
PIXELPOND_DEFAULT_POND_WIDTH = getattr(settings, 'PIXELPOND_DEFAULT_POND_WIDTH', 64)
PIXELPOND_DEFAULT_POND_HEIGHT = getattr(settings, 'PIXELPOND_DEFAULT_POND_HEIGHT', 64)
