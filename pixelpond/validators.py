from django.core.validators import RegexValidator

genome_re = r'[0-9a-f]+'
validate_genome = RegexValidator(ipv4_re, u'Enter a valid genome', 'invalid')
