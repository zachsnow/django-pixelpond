from datetime import timedelta

try:
    from django.conf import settings
    getattr(settings, 'PIXELPOND_POND_DEPTH', None)
    TESTING = False
except ImportError:
    settings = object()
    TESTING = True

# The maximum depth of all `Pond`s. 
PIXELPOND_POND_DEPTH = getattr(settings, 'PIXELPOND_POND_DEPTH', 1024)

# The default size of one side of a (square) `Puddle`.
PIXELPOND_DEFAULT_PUDDLE_SIZE = getattr(settings, 'PIXELPOND_PUDDLE_SIZE', 16)
PIXELPOND_MIN_PUDDLE_SIZE = 1
PIXELPOND_MAX_PUDDLE_SIZE = 1024

# The "radius" of the neighborhood of puddles surrounding a single locked puddle.
# When a client requests a portion of the pond to simulate, it gets a puddle
# and those within `PIXELPOND_NEIGHBORHOOD_RADIUS` puddles vertically and
# horizontally.
PIXELPOND_NEIGHBORHOOD_RADIUS = getattr(settings, 'PIXELPOND_NEIGHBORHOOD_RADUIS', 1)

# The default size of a `Pond`, in `Puddle`s.
PIXELPOND_DEFAULT_POND_WIDTH = getattr(settings, 'PIXELPOND_DEFAULT_POND_WIDTH', 8)
PIXELPOND_MIN_POND_WIDTH = 2 * PIXELPOND_NEIGHBORHOOD_RADIUS + 1
PIXELPOND_MAX_POND_WIDTH = 1024

PIXELPOND_DEFAULT_POND_HEIGHT = getattr(settings, 'PIXELPOND_DEFAULT_POND_HEIGHT', 8)
PIXELPOND_MIN_POND_HEIGHT = 2 * PIXELPOND_NEIGHBORHOOD_RADIUS + 1
PIXELPOND_MAX_POND_HEIGHT = 1024

# The default shortname of a `Pond`.
PIXELPOND_DEFAULT_POND_SHORTNAME = getattr(settings, 'PIXELPOND_DEFAULT_POND_SHORTNAME', 'pond')

# The lifetime of a `Lock`.
PIXELPOND_LOCK_LIFETIME = getattr(settings, 'PIXELPOND_LOCK_LIFETIME', timedelta(minutes=1))
