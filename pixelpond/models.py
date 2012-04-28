import inspect
import new
import uuid
from datetime import datetime

from django.db import models
from django.db.models import query, Q

from pixelpond import settings, forms, validators, instructions
from pixelpond.decorators import classproperty

################################################################################
# Fields
################################################################################
class SouthCharFieldMixin(object):
    """
    A mixin that adds South support to a custom field based on a Django
    CharField.
    """
    def south_field_triple(self):
        """
        Returns a suitable description of this field for South.
        """
        from south.modelsinspector import introspector
        field_class = "django.db.models.fields.CharField"
        args, kwargs = introspector(self)
        return (self.field_class, args, kwargs)

class GenomeField(models.CharField, SouthCharFieldMixin):
    """
    A field that validates a genome.
    """
    default_validators = [validators.validate_genome]
    description = "A pixel's genome"

    def __init__(self, *args, **kwargs):
        kwargs['max_length'] = kwargs.get('max_length', settings.PIXELPOND_POND_DEPTH)
        kwargs['default'] = instructions.NOP * kwargs['max_length']
        return super(GenomeField, self).__init__(*args, **kwargs)
    
    def formfield(self, **kwargs):
        defaults = {
            'form_class': forms.GenomeField,
        }
        defaults.update(kwargs)
        return super(GenomeField, self).formfield(**defaults)

class UUID4Field(models.CharField, SouthCharFieldMixin):
    """
    A field that validates UUID version 4.
    
    For more information see: https://github.com/django-extensions/django-extensions/
    """
    
    def __init__(self, verbose_name=None, name=None, auto=True, **kwargs):
        kwargs['max_length'] = 36
        if auto:
            kwargs['blank'] = True
            kwargs.setdefault('editable', False)
        self.auto = auto
        super(UUID4Field, self).__init__(verbose_name, name, **kwargs)
    
    def contribute_to_class(self, cls, name):
        if self.primary_key:
            assert not cls._meta.has_auto_field, \
              "A model can't have more than one AutoField: %s %s %s; have %s" % \
               (self, cls, name, cls._meta.auto_field)
            super(UUID4Field, self).contribute_to_class(cls, name)
            cls._meta.has_auto_field = True
            cls._meta.auto_field = self
        else:
            super(UUID4Field, self).contribute_to_class(cls, name)
    
    def create_uuid(self):
        return uuid.uuid4()
    
    def pre_save(self, instance, add):
        value = super(UUID4Field, self).pre_save(instance, add)
        if self.auto and add and value is None:
            value = unicode(self.create_uuid())
        elif self.auto and not value:
            value = unicode(self.create_uuid())
        
        value = value.lower()
        setattr(instance, self.attname, value)
        return value

    def formfield(self, **kwargs):
        defaults = {
            'form_class': forms.UUID4Field,
        }
        defaults.update(kwargs)
        return super(UUID4Field, self).formfield(**defaults)

################################################################################
# Managers and QuerySet base classes.
################################################################################
class ManagerQuerySet(query.QuerySet):
    """
    A base class for querysets that support being converted to managers
    (for use as a model's `objects` manager) via `ManagerQuerySet.as_manager`.
    """
    
    def as_manager(self, base=models.Manager):
        """
        Creates a manager from the current queryset by copying any methods not
        defined in the queryset class's parent classes (which must be
        `QuerySet` and `ManagerQuerySet`, and nothing else).
        """
        cls = self.__class__ # Nested class.
        
        class QuerySetManager(base):
            use_for_related_fields = True
            
            def get_query_set(self):
                return cls(self.model)
        
        base_classes = [ManagerQuerySet, query.QuerySet]
        base_methods = [inspect.getmembers(base, inspect.ismethod) for base in base_classes]
        
        def in_base_class(method_name):
            for methods in base_methods:
                for (name, _) in methods:
                    if name == method_name:
                        return True
            return False
        
        for (method_name, method) in inspect.getmembers(self, inspect.ismethod):
             if not in_base_class(method_name):
                 new_method = new.instancemethod(method.im_func, None, QuerySetManager)
                 setattr(QuerySetManager, method_name, new_method)
    
        return QuerySetManager()

class QuerySet(ManagerQuerySet):
    """
    A generic queryset (and manager, via `ManagerQuerySet.as_manager`), for
    use with all models; more specialized querysets should inherit from
    this class, as it assumed that all models' managers will support the
    methods defined herein. 
    """
    def get_or_none(self, **kwargs):
        """
        Wraps `QuerySet.get`, returning `None` instead of raising when
        the object doesn't exist.
        """
        try:
            return self.get(**kwargs)
        except self.model.DoesNotExist:
            return None

    def first(self, **kwargs):
        """
        Wraps `QuerySet.filter`, returning just the first matching object,
        or `None` if no objects match.
        """
        try:
            return self.filter(**kwargs)[0]
        except IndexError:
            return None
 
################################################################################
# Models
################################################################################
class PositionMixin(models.Model):
    """
    A mixin that adds 2D (Cartesian) position to a model.
    """
    x = models.PositiveIntegerField()
    y = models.PositiveIntegerField()

    class Meta:
        abstract = True


class Pond(models.Model):
    """
    A `Pond` is composed of a number of `Puddle`s arrayed in a 2D grid.
    """
    shortname = models.CharField(
        max_length=64,
        blank=False,
        unique=True,
        default=settings.PIXELPOND_DEFAULT_POND_SHORTNAME,
    )
    
    width = models.PositiveIntegerField(
        help_text='the width of the pond',
        default=settings.PIXELPOND_DEFAULT_POND_WIDTH,
    )
    
    height = models.PositiveIntegerField(
        help_text='the height of the pond',
        default=settings.PIXELPOND_DEFAULT_POND_HEIGHT,
    )
    
    puddle_size = models.PositiveIntegerField(
        help_text='the size of a (square) puddle',
        default=settings.PIXELPOND_DEFAULT_PUDDLE_SIZE,
    )
    
    def __unicode__(self):
        return '%s (%i x %i)' % (self.shortname, self.width, self.height)
    
    objects = QuerySet().as_manager()

class Puddle(PositionMixin):
    """
    A `Puddle` is owned by a `Pond`, and is composed of a number of `Pixel`s
    arrayed in a 2D grid.
    """
    pond = models.ForeignKey(Pond, related_name='puddles')
    is_exclusive_write_locked = models.BooleanField(default=False, editable=False)
    
    def __unicode__(self):
        return '%s at (%i, %i)' % (self.pond, self.x, self.y)
    
    @property
    def neighborhood(self):
        min_x = self.x - settings.PIXELPOND_NEIGHBORHOOD_RADIUS
        min_y = self.y - settings.PIXELPOND_NEIGHBORHOOD_RADIUS
        max_x = self.x + settings.PIXELPOND_NEIGHBORHOOD_RADIUS
        max_y = self.y + settings.PIXELPOND_NEIGHBORHOOD_RADIUS
        
        normal_x = {}
        normal_y = {}
        x_query = {}
        y_query = {}
        needs_x = True
        needs_y = True
        
        if min_x <= 0:
            normal_x['x__lte'] = max_x
            normal_x['x__gte'] = 0
            x_query['x__gte'] = self.pond.width + min_x
            x_query['x__lt'] = self.pond.width
        elif max_x >= self.pond.width:
            normal_x['x__gte'] = min_x
            normal_x['x__lt'] = self.pond.width
            x_query['x__lte'] = max_x - self.pond.width
            x_query['x__gte'] = 0
        else:
            normal_x['x__gte'] = min_x
            normal_y['x__lte'] = max_x
            x_query['x__gte'] = min_x
            x_query['x__lte'] = max_x
            needs_x = False
        
        if min_y <= 0:
            normal_y['y__lte'] = max_y
            normal_y['y__gte'] = 0
            y_query['y__gte'] = self.pond.height + min_y
            y_query['y__lt'] = self.pond.height
        elif max_y >= self.pond.height:
            normal_y['y__gte'] = min_y
            normal_y['y__lt'] = self.pond.height
            y_query['y__lte'] = max_y - self.pond.height
            y_query['y__gt'] = 0
        else:
            normal_y['y__gte'] = min_y
            normal_y['y__lte'] = max_y
            y_query['y__gte'] = min_y
            y_query['y__lte'] = max_y
            needs_y = False
        
        q = Q(**normal_x) & Q(**normal_y) 
        
        if needs_x:
            q |= Q(**x_query) & Q(**normal_y)
        if needs_y:
            q |= Q(**y_query) & Q(**normal_x)
        if needs_x and needs_y:
            q |= Q(**x_query) & Q(**y_query)
        
        return self.pond.puddles.filter(q)
        
    objects = QuerySet().as_manager()

class Pixel(PositionMixin):
    """
    A `Pixel` is owned by a `Puddle`, and is composed of a genome and various
    heredity information and statistics.
    """
    puddle = models.ForeignKey(Puddle, related_name='pixels')
    genome = GenomeField(max_length=settings.PIXELPOND_POND_DEPTH)
    uuid = UUID4Field()
    parent_uuid = UUID4Field()
    
    def __unicode__(self):
        return '%s : (%i, %i) : %s' % (self.puddle, self.x, self.y, self.genome)

    objects = QuerySet().as_manager()

class LockError(Exception):
    """
    Raised when a locking invariant is violated.
    """
    pass

class LockQuerySet(QuerySet):
    def create_exclusive(self, pond):
        # First find an unlocked puddle.
        puddle = pond.puddles.get_or_none(is_exclusive_write_locked=False)
        if not puddle:
            raise LockError()
        
        # Lock the puddle exclusively.
        lock = self.create(puddle=puddle, type=Lock.EXCLUSIVE_WRITE_TYPE)
        
        return lock, puddles

    def expired(self):
        return self.filter(created__lt=Lock.expiration)
    
class Lock(models.Model):
    """
    A `Lock` represents a client's
    """
    
    NON_EXCLUSIVE_WRITE_TYPE = 10
    EXCLUSIVE_WRITE_TYPE = 20
    
    TYPE_CHOICES = [
        (NON_EXCLUSIVE_WRITE_TYPE, 'Non-exclusive Write'),
        (EXCLUSIVE_WRITE_TYPE, 'Exclusive Write'),
    ]
    
    key = UUID4Field(auto=True)
    type = models.IntegerField(choices=TYPE_CHOICES, default=EXCLUSIVE_WRITE_TYPE)
    created = models.DateTimeField(auto_now_add=True)

    puddle = models.ForeignKey(Puddle, related_name='locks')

    objects = LockQuerySet().as_manager()
    
    def unlock(self, key):
        """
        Unlocks the lock
        """
        if self.key != key:
            raise LockError('attempting to unlock a lock with the wrong key')
        
        from pixelpond.signals import post_unlock
        
        if self.type == Lock.NON_EXCLUSIVE_WRITE_TYPE and self.puddle.is_exclusive_write_locked:
            raise LockError('attempting to unlock a non-exclusive write lock on a locked puddle')
        
        if self.is_expired():
            raise LockError('attempting to unlock an expired lock')
        
        self.delete()
        
        post_unlock.send(sender=Lock, instance=self)

    @classproperty
    def expiration(cls):
        return datetime.now() - settings.PIXELPOND_LOCK_LIFETIME
    
    def is_expired(self):
        return self.created >= Lock.expiration
 
# Connect signals.
import pixelpond.signals
