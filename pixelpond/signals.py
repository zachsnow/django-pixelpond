def pond_post_save(sender, instance, **kwargs):
    if created:
        pond_post_create(sender, instance, **kwargs)

def pond_post_create(sender, instance, **kwargs):
    """
    Creates all nested ``Puddle``s that belong to the newly created ``Pond``.
    """
    for y in range(0, pond.height):
        for x in range(0, pond.width):
            pond.puddles.create(x=x, y=y, depth=pond.depth)

def puddle_post_save(sender, instance, **kwargs):
    if created:
        puddle_post_create(sender, instance, **kwargs)

def puddle_post_create(sender, instance, **kwargs):
    """
    Creates all nested ``Pixel``s that belong to the newly created ``Puddle``.
    """
    for y in range(0, settings.PIXELPOND_PUDDLE_SIZE):
        for x in range(0, settings.PIXELPOND_PUDDLE_SIZE):
            puddle.pixels.create(x=x, y=y, depth=puddle.depth)
