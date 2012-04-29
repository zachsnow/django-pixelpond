from unittest import skip
from django.core.management.color import no_style
from django.db import connection
from django.db.models import Model
from django.db.models.base import ModelBase

from pixelpond import settings
from pixelpond.models import (
    PositionMixin,
    ManagerQuerySet, QuerySet,
    
    Pond, Puddle, Pixel, Lock, LockError
)
from pixelpond.tests.base import BaseTest

class ModelTest(BaseTest):
    def __init__(self, *args, **kwargs):
        self._cursor = None
        self._models = []
        super(ModelTest, self).__init__(*args, **kwargs)
        
    def create_model(self, name, bases=None, module=None):
        if not bases:
            bases = (Model, )
        if not module:
            module = self.__module__
        
        # Create a dummy model which extends the mixin
        model = ModelBase(
            '__TestModel__' + name,
            bases,
            { '__module__': module }
        )
        
        # Create the schema for our test model
        sql, _ = connection.creation.sql_create_model(model, no_style())
 
        # Execute the schema.
        self._cursor = self._cursor or connection.cursor()
        for statement in sql:
            self._cursor.execute(statement)
        
        # Keep track so we can destroy it later.
        self._models.append(model)
            
        return model

    def teardown(self):
        for model in self._models:
            sql = connection.creation.sql_destroy_model(model, (), no_style())
            for statement in sql:
                self._cursor.execute(statement)
        
        super(ModelTest, self).teardown()

################################################################################
# Mixins
################################################################################
class MixinTest(ModelTest):
    """
    Base class for tests of model mixins. To use, subclass and specify
    the ``mixin`` class variable. A model using the specified mixin will be
    made available in ``self.model``.
    
    See: http://michael.mior.ca/2012/01/14/unit-testing-django-model-mixins/
    """
    def setup(self):
        self.model = self.create_model(
            name=self.mixin.__name__,
            bases=(self.mixin, ),
            module=self.mixin.__module__
        )

class PositionMixinTest(MixinTest):
    mixin = PositionMixin
    
    def test_position_getter(self):
        pos = self.model(x=0, y=0)
        pos.x = 2
        pos.y = 3
        pos.save()
        
        pos = self.model.objects.get(pk=pos.pk)
        self.assertEquals(pos.position, (2, 3), 'position getter')
    
    def test_position_setter(self):
        pos = self.model(x=0, y=0)
        pos.position = (3, 4)
        pos.save()
        
        pos = self.model.objects.get(pk=pos.pk)
        self.assertEquals(pos.x, 3, 'position setter (x)')
        self.assertEquals(pos.y, 4, 'position setter (y)')

################################################################################
# Managers and querysets.
################################################################################
class ManagerQuerySetTest(ModelTest):
    def setup(self):
        class TestQuerySet(QuerySet):
            def pk_equals(self, pk):
                return self.filter(pk=pk)
            
            @ManagerQuerySet.manager_only
            def manager_filter(self, *args, **kwargs):
                return self.filter(*args , **kwargs)
            
            @ManagerQuerySet.queryset_only
            def queryset_filter(self, *args, **kwargs):
                return self.filter(*args , **kwargs)
            
        self.model = self.create_model('ManagerQuerySetTest')
        self.model.objects = TestQuerySet().as_manager()
        self.model.objects.model = self.model
        
    def test_both(self):
        m = self.model.objects.create()
        self.assertEquals(m, self.model.objects.pk_equals(m.pk)[0])
        self.assertEquals(m, self.model.objects.all().pk_equals(m.pk)[0])
    
    def test_queryset_only(self):
        self.assertDoesNotRaise(lambda: self.model.objects.all().queryset_filter())
        self.assertRaises(AttributeError, lambda: self.model.objects.queryset_filter())
    
    @skip('ManagerQuerySet.manager_only is not yet implemented')
    def test_manager_only(self):
        self.assertDoesNotRaise(lambda: Lock.objects.create_exclusive)
        self.assertRaises(AttributeError, lambda: Lock.objects.all().create_exclusive)

class QuerySetTest(ModelTest):
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

class PuddleTest(ModelTest):
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
        
class LockTest(BaseTest):
    def test_lock_available(self):
        pond = Pond.objects.create(shortname='test_lock_available')
        lock = Lock.objects.create_exclusive(pond=pond)
        
        self.assertTrue(lock is not None)
        self.assertTrue(lock.puddle.position == (0, 0), 'first puddle is locked')
        
    def test_lock_not_available(self):
        pond = Pond.objects.create(shortname='test_lock_not_available')
        for puddle in pond.puddles.all():
            Lock.objects.create_exclusive(pond=pond)
        
        self.assertRaises(LockError, lambda: Lock.objects.create_exclusive(pond=pond))
