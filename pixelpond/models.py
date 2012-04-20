from django.db import models

from pixelpond import settings, forms, validators

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

class GenomeField(models.CharField):
    """
    A field that validates a genome.
    """
    default_validators = [validators.validate_genome]
    description = "A pixel's genome"

    def formfield(self, **kwargs):
        defaults = {
            'form_class': forms.GenomeField,
        }
        defaults.update(kwargs)
        return super(GenomeField, self).formfield(**defaults)

class UUID4Field(models.CharField):
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
    
    def get_internal_type(self):
        return CharField.__name__
    
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
        import uuid
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
    A ``Pond`` is composed of a number of ``Puddle``s arrayed in a 2D grid.
    """
    shortname = models.CharField()
    
    width = models.PositiveIntegerField(help_text='the width of the pond')
    height = models.PositiveIntegerField(help_text='the height of the pond')
    max_depth = models.PositiveIntegerField(
        max_value=settings.PIXELPOND_MAX_DEPTH,
        help_text='the maximum depth of the pond'
    )
    
    def __unicode__(self):
        return '%s (%i x %i)' % (self.shortname, self.width, self.height)
    
class Puddle(PositionMixin):
    """
    A ``Puddle`` is owned by a ``Pond``, and is composed of a number of
    ``Pixel``s arrayed in a 2D grid.
    """
    pond = models.ForeignKey(Pond, related_name='puddles')
    
    def __unicode__(self):
        return '%s at (%i, %i)' % (self.pond, self.x, self.y)
    
class Pixel(PositionMixin):
    """
    A ``Pixel`` is owned by a ``Pond``, and is composed of a genome
    """
    puddle = models.ForeignKey(Puddle, related_name='pixels')
    genome = fields.GenomeField(max_length=settings.PIXELPOND_MAX_DEPTH)
    uuid = fields.CharField(max_length)
    parent_uuid = fields.Char
    
    def __unicode__(self):
        return '%s : (%i, %i) : %s'

class Lock(models.Model):
    """
    A ``Lock`` represents a client's
    """
    
    NON_EXCLUSIVE_WRITE_TYPE = 10
    EXCLUSIVE_WRITE_TYPE = 20
    
    TYPE_CHOICES = [
        (NON_EXCLUSIVE_WRITE_TYPE, 'Non-exclusive Write'),
        (EXCLUSIVE_WRITE_TYPE, 'Exclusive Write'),
    ]
    
    key = models.CharField()
    type = models.CharField(choices=TYPE_CHOICES)
    date = models.DateTimeField()
