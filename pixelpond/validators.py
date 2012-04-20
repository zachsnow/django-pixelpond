from django.core.validators import RegexValidator

genome_re = r'[0-9a-f]+'
validate_genome = RegexValidator(genome_re, u'Enter a valid genome', 'invalid')

uuid4_re = r'[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
validate_uuid4 = RegexValidator(uuid4_re, u'Enter a valid type 4 UUID', 'invalid')
