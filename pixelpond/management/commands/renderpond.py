from pondlife.management import BaseCommand

from optparse import make_option

class Command(BaseCommand):
    args = '<shortname> [width] [height] [depth]'
    
    def handle(self, shortname,
        width=settings.PIXELPOND_DEFAULT_WIDTH,
        height=settings.PIXELPOND_DEFAULT_HEIGHT,
        depth=settings.PIXELPOND_DEFAULT_DEPTH
    ):
        if Pond.objects.filter(shortname=shortname).exists():
            raise CommandError('pond %s already exists' % shortname)
        
        width = self.int(width)
        height = self.int(height)
        depth = self.int(depth)
        
        self.validate(width, lambda x: x > 0 and x <= settings.PIXELPOND_MAX_WIDTH)
        self.validate(height, lambda x: x > 0 and x <= settings.PIXELPOND_MAX_HEIGHT)
        self.validate(depth, lambda x: x > 0 and x <= settings.PIXELPOND_MAX_DEPTH)
        
        pond = Pond.objects.create(
            shortname=shortname,
            width=width,
            height=height,
            depth=depth
        )

        self.stdout.write('created pond %s' % pond)
