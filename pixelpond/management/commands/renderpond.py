from pixelpond import settings
from pondlife.management import BaseCommand, CommandError

from optparse import make_option

class Command(BaseCommand):
    args = '<shortname>'
    help = """Render the specified pond to a PNG."""
    
    def handle(self, shortname):
        pond = Pond.objects.get_or_none(shortname=shortname)
        if not pond:
            raise CommandError('pond %s does not exist' % shortname)
        
        # TODO.
        
        self.stdout.write('rendered pond %s' % pond)
