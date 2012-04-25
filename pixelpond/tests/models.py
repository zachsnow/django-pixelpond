from pixelpond import settings
from pixelpond.models import Pond, Pixel, QuerySet
from pixelpond.tests.base import BaseTest

class QuerySetTest(BaseTest):
    def first_cases(self, q, type):
        pond = Pond.objects.create(shortname='test_first_cases_%s' % type)
        
        pixel = q().first(x=-1, y=-1)
        self.assertTrue(pixel is None, 'there are no matching pixels')
        
        pixel = q().first(puddle__pond=pond)
        self.assertTrue(pixel is not None, 'there are some pixels now')
        self.assertTrue(pixel.x == 0 and pixel.y == 0, 'and it is the first pixel')
        self.assertTrue(pixel.puddle.x == 0 and pixel.puddle.y == 0, 'from the first first')
        
        pixel = q().first(x=0, y=0, puddle__x=0, puddle__y=0)
        self.assertTrue(pixel is not None, 'there is exactly one puddle')

    def test_first(self):
        self.first_cases(lambda: Pixel.objects, 'manager')
        self.first_cases(lambda: Pixel.objects.all(), 'queryset')
        
    def get_or_none_cases(self, q, type):
        pond = Pond.objects.create(shortname='test_get_or_none_%s' % type)
        
        pixel = Pixel.objects.get_or_none(x=-1, y=-1)
        self.assertTrue(pixel is None, 'there is no matching pixel')
        
        self.assertRaises(
            Pixel.MultipleObjectsReturned,
            q().get_or_none,
            puddle__pond=pond
        )
                
        pixel = q().get_or_none(puddle__pond=pond, x=0, y=0, puddle__x=0, puddle__y=0)
        self.assertTrue(pixel is not None, 'there is exactly one puddle')
    
    def test_get_or_none(self):
        self.get_or_none_cases(lambda: Pixel.objects, 'manager')
        self.get_or_none_cases(lambda: Pixel.objects.all(), 'queryset')

class PuddleTest(BaseTest):
    def assertPositions(self, puddles, expected, msg=None):
        actual = [(p.x, p.y) for p in puddles]
        result = True
        
        # Expected and actual contain same positions.
        for position in actual:
            result = result and (position in expected)
        for position in expected:
            result = result and (position in actual)
        self.assertTrue(result, '%s (expected and actual should contain the same positions)' % msg)
        
        # No duplicates.
        self.assertEquals(len(expected), len(actual), 'expected and actual should have the same length (%s)' % msg)
        self.assertEquals(len(expected), len(set(expected)), 'expected positions should have no duplicates (%s)' % msg)
        self.assertEquals(len(actual), len(set(actual)), 'actual positions should have no duplicates (%s)' % msg)
        
    def test_neighborhood(self):
        pond = Pond.objects.create(shortname='test_neighborhood')
        
        puddle = pond.puddles.get(x=0, y=0)
        expected = [
            (pond.width - 1, pond.height - 1),
            (pond.width - 1, 0),
            (pond.width - 1, 1),
            (0, pond.height - 1),
            (0, 0),
            (0, 1),
            (1, pond.height - 1),
            (1, 0),
            (1, 1),
        ]
        self.assertPositions(puddle.neighborhood, expected, 'x and y edge')
        
        puddle = pond.puddles.get(x=0, y=1)
        expected = [
            (pond.width - 1, 0),
            (pond.width - 1, 1),
            (pond.width - 1, 2),
            (0, 0),
            (0, 1),
            (0, 2),
            (1, 0),
            (1, 1),
            (1, 2),
        ]
        self.assertPositions(puddle.neighborhood, expected, 'x edge')
        
        puddle = pond.puddles.get(x=0, y=1)
        expected = [
            (pond.width - 1, 0),
            (pond.width - 1, 1),
            (pond.width - 1, 2),
            (0, 0),
            (0, 1),
            (0, 2),
            (1, 0),
            (1, 1),
            (1, 2),
        ]
        self.assertPositions(puddle.neighborhood, expected, 'y edge')
        
        puddle = pond.puddles.get(x=2, y=2)
        expected = [
            (1, 1),
            (1, 2),
            (1, 3),
            (2, 1),
            (2, 2),
            (2, 3),
            (3, 1),
            (3, 2),
            (3, 3),
        ]
        self.assertPositions(puddle.neighborhood, expected, 'no edge')
