from pixelpond import settings
from pondlife.management import BaseCommand, CommandError

class Command(BaseCommand):
    args = '<shortname>'
    help = """Delete the specified pond."""
    
    def handle(self, shortname):
        pond = Pond.objects.get_or_none(shortname=shortname)
        if not pond:
            raise CommandError('pond %s does not exist' % shortname)
        
        pond.delete()
        
        self.stdout.write('deleted pond %s' % pond)
