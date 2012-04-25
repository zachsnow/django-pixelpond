from pixelpond import settings
from pixelpond.management.base import BaseCommand, CommandError
from pixelpond.models import Pond

class Command(BaseCommand):
    args = """<shortname> [width] [height] [puddle size]"""
    help = """Creates a new pond with the given shortname, width, height, and puddle size.""" 
    
    def respond(self, shortname, width=None, height=None, puddle_size=None):
        pond = Pond.objects.get_or_none(shortname=shortname)
        if pond:
            raise CommandError('pond %s already exists' % pond)
        
        kwargs = {
            'shortname': shortname
        }
        
        if width is not None:
            width = self.int(width, 'width')
            self.in_range(
                width,
                settings.PIXELPOND_MIN_POND_WIDTH,
                settings.PIXELPOND_MAX_POND_WIDTH,
                'width'
            )
            kwargs['width'] = width
        
        if height is not None:
            height = self.int(height, 'height')
            self.in_range(
                height,
                settings.PIXELPOND_MIN_POND_HEIGHT,
                settings.PIXELPOND_MAX_POND_HEIGHT,
                'height'
            )
            kwargs['height'] = height

        if puddle_size is not None:
            puddle_size = self.int(puddle_size, 'puddle size')
            self.in_range(
                puddle_size,
                settings.PIXELPOND_MIN_PUDDLE_SIZE,
                settings.PIXELPOND_MAX_PUDDLE_SIZE,
                'puddle size'
            )
            kwargs['puddle_size'] = puddle_size
            
        if not self.dry_run:
            pond = Pond.objects.create(**kwargs)

        self.stdout.write('pond %s created' % pond)
