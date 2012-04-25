from django.db.models.signals import pre_save, post_save, pre_delete, post_delete
from django.core.signals import request_started, request_finished
from django.dispatch import receiver, Signal

from pixelpond import settings
from pixelpond.models import Pond, Puddle, Lock

################################################################################
# Custom signals.
################################################################################
pre_unlock = Signal(providing_args=['instance'])
post_unlock = Signal(providing_args=['instance'])

################################################################################
# Signal handlers.
################################################################################
@receiver(post_save, sender=Pond)
def pond_post_save(sender, instance, created, **kwargs):
    if created:
        pond_post_create(sender, instance, **kwargs)

def pond_post_create(sender, instance, **kwargs):
    """
    Creates all nested `Puddle`s that belong to the newly created `Pond`.
    """
    pond = instance
    for y in range(0, pond.height):
        for x in range(0, pond.width):
            pond.puddles.create(x=x, y=y)

@receiver(post_save, sender=Puddle)
def puddle_post_save(sender, instance, created, **kwargs):
    if created:
        puddle_post_create(sender, instance, **kwargs)

def puddle_post_create(sender, instance, **kwargs):
    """
    Creates all nested `Pixel`s that belong to the newly created `Puddle`.
    """
    puddle = instance
    
    size = puddle.pond.puddle_size
    for y in range(0, size):
        for x in range(0, size):
            puddle.pixels.create(x=x, y=y)

@receiver(post_save, sender=Lock)
def lock_post_save(sender, instance, created, **kwargs):
    if created:
        lock_post_create(sender, instance, **kwargs)

def lock_post_create(sender, instance, **kwargs):
    """
    For exclusive write locks:
        * Marks the locked puddle as locked for easier querying.
        * Creates non-exclusive write locks on neighboring puddles that
          aren't themselves write-locked.
    """
    lock = instance
    if lock.type == Lock.EXCLUSIVE_WRITE_TYPE:
        # Mark the puddle as locked for easier querying.
        lock.puddle.is_exclusive_write_locked = True
        lock.puddle.save()

        # Create non-exclusive locks on neighboring puddles.
        for p in lock.puddle.neighborhood.filter(is_exclusive_write_locked=False):
            Lock.objects.create(
                puddle=p,
                type=Lock.NON_EXCLUSIVE_WRITE_TYPE,
                key=lock.key
            )

@receiver(post_unlock, sender=Lock)
def lock_post_unlock(sender, instance, **kwargs):
    """
    Exclusive locks can always be unlocked; non-exclusive ones can only
    be unlocked if there's not an outstanding exclusive lock on the same puddle.
    This invariant is not considered here, however; see `LockManager.unlock`.
        
    Whenever a lock is unlocked all other outstanding locks on the locked puddle
    are deleted. 
    """
    lock = instance
    
    lock.puddle.locks.delete()
