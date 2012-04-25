from datetime import datetime
from cStringIO import StringIO

from django.core.management import call_command

from pixelpond import settings
from pixelpond.tests import base
from pixelpond.models import Pond, Lock
 
class ManagementTest(base.BaseTest):
    """
    A base class for testing management commands that provides access
    to both standard and error output (provided that derived tests always
    use ``self.stderr`` and ``self.stdout`` to perform IO).
    """
    def call_command(self, command, *args, **kwargs):
        stderr = StringIO()
        stdout = StringIO()
        
        kwargs.update({
            'stderr': stderr,
            'stdout': stdout,
        })

        call_command(command, *args, **kwargs)
        
        self.stderr = stderr.getvalue()
        self.stdout = stdout.getvalue()

class CreatePondTest(ManagementTest):
    def test_default(self):
        self.call_command('createpond', shortname='test_default')
        pond = Pond.objects.get_or_none(shortname='test_default')
        
        self.assertTrue(pond is not None)
        self.assertTrue(('pond %s created' % pond) in self.stdout)
    
    def test_arguments(self):
        self.call_command('createpond', shortname='test_arguments', width='4', height='4', puddle_size='1')
        pond = Pond.objects.get_or_none(shortname='test_arguments')
        
        self.assertEquals(pond.width, 4)
        self.assertEquals(pond.height, 4)
        self.assertEquals(pond.puddle_size, 1)
        self.assertTrue(('pond %s created' % pond) in self.stdout)
        
    def test_duplicate(self):
        pond = Pond.objects.create(shortname='test_duplicate')
        
        self.call_command('createpond', shortname='test_duplicate')
        
        self.assertTrue(('pond %s already exists' % pond) in self.stderr)

class ReclaimLocksTest(ManagementTest):
    def test_reclaim_none(self):
        self.call_command('reclaimlocks')
        self.assertTrue('reclaimed 0 expired locks' in self.stdout)
    
    def test_reclaim_some(self):
        old = datetime.now() - (2 * settings.PIXELPOND_LOCK_LIFETIME)
        pond = Pond.objects.create(shortname='test_reclaim_some')
        
        lock = Lock.objects.create(
            puddle=pond.puddles.first(),
            type=Lock.EXCLUSIVE_WRITE_TYPE,
        )
        lock.created = old
        lock.save()
        
        lock = Lock.objects.create(
            puddle=pond.puddles.first(),
            type=Lock.NON_EXCLUSIVE_WRITE_TYPE,
        )
        lock.created = old
        lock.save()
        
        self.call_command('reclaimlocks')
        self.assertTrue('reclaimed 2 expired locks' in self.stdout)
