from pixelpond import settings
from pixelpond.models import Pond, Puddle
from pixelpond.tests.base import BaseTest

class PondTest(BaseTest):
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
