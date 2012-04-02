from pixelpond import settings, forms

from django.db import models

################################################################################
# Fields
################################################################################
class GenomeField(models.CharField):
    default_validators = [validators.validate_genome]
    description = "A pixel's genome"

    def formfield(self, **kwargs):
        defaults = {
            'form_class': forms.GenomeField,
        }
        defaults.update(kwargs)
        return super(GenomeField, self).formfield(**defaults)


################################################################################
# Models
################################################################################
class PositionMixin(models.Model):
    x = models.PositiveIntegerField()
    y = models.PositiveIntegerField()

    class Meta:
        abstract = True

class Pond(models.Model):
    """
    A ``Pond`` is composed of a number of ``Puddle``s arrayed in a 2D grid.
    """
    shortname = models.CharField()
    
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()
    max_depth = models.PositiveIntegerField(max_value=settings.PIXELPOND_MAX_DEPTH)
    
    def __unicode__(self):
        return '%s (%i x %i)' % (self.shortname, self.width, self.height)
    
class Puddle(PositionMixin):
    """
    A ``Puddle`` is owned by a ``Pond``, and is composed of a number of
    ``Pixel``s arrayed in a 2D grid.
    """
    pond = models.ForeignKey(Pond, related_name='puddles')
    
class Pixel(PositionMixin):
    """
    A ``Pixel`` is owned by a ``Pond``, and is composed of a genome and an
    instruction pointer.
    """
    puddle = models.ForeignKey(Puddle, related_name='pixels')
    genome = fields.GenomeField(max_length=settings.PIXELPOND_MAX_DEPTH)
    ip = fields.PositiveIntegerField()
