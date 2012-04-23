from pixelpond import settings
from pixelpond.models import Pond, Puddle
from pixelpond.tests.base import BaseTest

class PondTest(BaseTest):
    def test_pond_creation(self):
        pond = Pond()
        self.assertEquals(pond.width, settings.PIXELPOND_DEFAULT_POND_WIDTH)
        
        pond.save()
        
        puddles = pond.puddles.all()
        
        self.assertEquals(len(puddles), pond.width * pond.height)

class PuddleTest(BaseTest):
    def test_puddle_creation(self):
        pond = Pond()
        pond.save()
        
        puddle = pond.puddles.all().first()
        pixels = puddle.pixels.all()
        
        self.assertEquals(len(pixels), pond.width * pond.height)
