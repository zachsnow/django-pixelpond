from pixelpond.management.base import BaseCommand
from pixelpond.models import Lock

class Command(BaseCommand):
    help = """Reclaims all expired locks.""" 
    
    def respond(self):
        locks = Lock.objects.expired()
        count = len(locks)
        locks.delete()
        self.stdout.write('reclaimed %i expired locks' % count)
        return
