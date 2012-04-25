from datetime import datetime
from pixelpond import settings
from pixelpond.management.base import BaseCommand
from pixelpond.models import Lock

class Command(BaseCommand):
    help = """Reclaims all expired locks.""" 
    
    def respond(self):
        expiration_date = datetime.now() - settings.PIXELPOND_LOCK_LIFETIME
        
        locks = Lock.objects.filter(created__lt=expiration_date)
        count = len(locks)
        locks.delete()
        self.stdout.write('reclaimed %i expired locks' % count)
        return
