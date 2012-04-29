from pixelpond import settings
from pixelpond.models import Pond, Puddle, Pixel, Lock, LockError
from pixelpond.tests.base import BaseTest

class PondSignalsTest(BaseTest):
    def test_pond_creation(self):
        pond = Pond.objects.create()
        
        puddles = pond.puddles.all()
        pixels = puddles.first().pixels.all()
        
        self.assertEquals(
            len(puddles),
            settings.PIXELPOND_DEFAULT_POND_WIDTH * settings.PIXELPOND_DEFAULT_POND_HEIGHT,
            'creating a pond creates all owned puddles',
        )
        self.assertEquals(
            len(pixels),
            settings.PIXELPOND_DEFAULT_PUDDLE_SIZE ** 2,
            'creating a pond adds the correct number of pixels to each puddle',
        )

class LockSignalsTest(BaseTest):
    def test_lock_neighbors(self):
        pond = Pond.objects.create(shortname='test_lock_neighbors')
        lock = Lock.objects.create_exclusive(pond=pond)
        for puddle in lock.puddle.neighborhood:
            if puddle != lock.puddle:
                non_exclusive_write_lock = Lock.objects.get_or_none(puddle=puddle)
                self.assertTrue(non_exclusive_write_lock is not None, 'neighbors are locked')
                self.assertTrue(non_exclusive_write_lock.type == Lock.NON_EXCLUSIVE_WRITE_TYPE, 'neighbors are non-exclusive write locked')
        
    def test_unlock(self):
        pond = Pond.objects.create(shortname='test_unlock')
        lock = Lock.objects.create_exclusive(pond=pond)
        lock.unlock(lock.key)
        
        lock = Lock.objects.get_or_none(pk=lock.pk)
        self.assertTrue(lock is None, 'the lock is deleted')
    
    def test_lock_overlapping(self):
        pond = Pond.objects.create(shortname='test_lock_overlapping')
        lock_1 = Lock.objects.create_exclusive(pond)
        lock_2 = Lock.objects.create_exclusive(pond, x=0, y=1)
        
        self.assertTrue(lock_2 is not None, 'we can lock a neighbor')
        self.assertEquals(2, len(lock_1.puddle.locks.all()), 'puddles are locked twice')
        self.assertEquals(2, len(lock_2.puddle.locks.all()), 'puddles are locked twice')
        
    def test_unlock_overlapping_exclusive(self):
        pond = Pond.objects.create(shortname='test_unlock_overlapping_exclusive')
        lock_1 = Lock.objects.create_exclusive(pond)
        lock_2 = Lock.objects.create_exclusive(pond, x=0, y=1)
        
        lock_2.unlock(key=lock_2.key)
        self.assertEquals(0, len(lock_2.puddle.locks.all()), 'all locks are removed')
        
    def test_unlock_overlapping_nonexclusive(self):
        pond = Pond.objects.create(shortname='test_unlock_overlapping_nonexclusive')
        lock_1 = Lock.objects.create_exclusive(pond)
        lock_2 = Lock.objects.create_exclusive(pond, x=0, y=1)
        
        lock_2_non = lock_2.puddle.locks.non_exclusive().first()
        self.assertTrue(lock_2_non is not None, 'the second puddle has a non-exclusive lock')
        
        self.assertRaises(LockError, lambda: lock_2_non.unlock(key=lock_2_non.key))

    def test_unlock_exclusive(self):
        pass

    def test_unlock_non_exclusive(self):
        pass
    