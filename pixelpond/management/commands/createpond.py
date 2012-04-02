from pondlife.management.base import BaseCommand
from pondlife.management.base import in_range

from optparse import make_option

class Command(BaseCommand):
    args = """<shortname> [width] [height] [depth]"""
    help = """Creates a new pond with the given name, width, height, and depth.""" 
    
    def handle(self, shortname,
        width=settings.PIXELPOND_DEFAULT_WIDTH,
        height=settings.PIXELPOND_DEFAULT_HEIGHT,
        depth=settings.PIXELPOND_DEFAULT_DEPTH
    ):
        if Pond.objects.filter(shortname=shortname).exists():
            raise CommandError('pond %s already exists' % shortname)
        
        width = self.int(width, 'width')
        height = self.int(height, 'height')
        depth = self.int(depth, 'depth')
        
        self.in_range(width, 0, settings.PIXELPOND_MAX_WIDTH, 'width')
        self.in_range(width, 0, settings.PIXELPOND_MAX_HEIGHT, 'height')
        self.in_range(width, 0, settings.PIXELPOND_MAX_DEPTH, 'depth')
        
        if not self.dry_run:
            pond = Pond.objects.create(
                shortname=shortname,
                width=width,
                height=height,
                depth=depth
            )

        self.stdout.write('created pond %s' % pond)
