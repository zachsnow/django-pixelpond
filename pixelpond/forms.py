from pixelpond import validators
from django.forms.fields import CharField

################################################################################
# Fields
################################################################################
class GenomeField(CharField):
    """
    A form field for genomes.
    """
    default_error_messages = {
        'invalid': 'enter a valid genome'
    }
    default_validators = [validators.validate_genome]

    def clean(self, value):
        value = self.to_python(value).strip()
        return super(GenomeField, self).clean(value)

class UUID4Field(CharField):
    """
    A form field for type 4 UUIDs.
    """
    default_error_messages = {
        'invalid': 'enter a valid type 4 UUID'
    }
    default_validators = [validators.validate_uuid4]

    def clean(self, value):
        value = self.to_python(value).strip()
        return super(UUID4Field, self).clean(value)
