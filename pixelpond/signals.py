from django.core.signals import pre_save, post_save, pre_delete, post_delete
from django.dispatch import receiver

from pixelpond import settings

@receiver(post_save, sender=Pond)
def pond_post_save(sender, instance, created, **kwargs):
    if created:
        pond_post_create(sender, instance, **kwargs)

def pond_post_create(sender, instance, **kwargs):
    """
    Creates all nested `Puddle`s that belong to the newly created `Pond`.
    """
    for y in range(0, pond.height):
        for x in range(0, pond.width):
            pond.puddles.create(x=x, y=y, depth=pond.depth)

@receiver(post_save, sender=Puddle)
def puddle_post_save(sender, instance, created, **kwargs):
    if created:
        puddle_post_create(sender, instance, **kwargs)

def puddle_post_create(sender, instance, **kwargs):
    """
    Creates all nested `Pixel`s that belong to the newly created `Puddle`.
    """
    size = instance.pond.puddle_size
    for y in range(0, size):
        for x in range(0, size):
            puddle.pixels.create(x=x, y=y)

@receiver(post_save, sender=Lock)
def lock_post_save(sender, instance, **kwargs):
    if created:
        lock_post_create(sender, instance, **kwargs)

def lock_post_create(sender, instance, **kwargs):
    """
    For exclusive write locks:
        * Marks the locked puddle as locked for easier querying.
        * Destroys any overridden non-exclusive write locks.
        * Creates non-exclusive write locks on neighboring puddles that
          aren't themselves write-locked.
    
    For non-exclusive write locks:
        * TODO
    """
    if instance.type == Lock.EXCLUSIVE_WRITE_TYPE:
        # Mark the puddle as locked for easier querying.
        instance.puddle.is_exclusive_write_locked = True
        instance.puddle.save()

        # Destroy the non-exclusive locks on this puddle.
        instance.puddle.locks.filter(type=Lock.NON_EXCLUSIVE_WRITE_TYPE).delete()

        # Create non-exclusive locks on neighboring puddles.
        for p in instance.puddle.neighboring_puddles.fiter(is_exclusive_write_locked=False):
            self.create(
                puddle=p,
                type=Lock.NON_EXCLUSIVE_WRITE_TYPE,
                key=instance.key
            )
        