from pixelpond import validators
from django.forms.fields import CharField

class GenomeField(CharField):
    default_error_messages = {
        'invalid': 'enter a valid genome'
    }
    default_validators = [validators.validate_genome]

    def clean(self, value):
        value = self.to_python(value).strip()
        return super(EmailField, self).clean(value)
