from django.core.management import base, CommandError

class BaseCommand(base.BaseCommand):
    option_list = base.BaseCommand.option_list + (
        make_option('--dry-run',
            action='store_true',
            dest='dry_run',
            default=False,
            help="""Perform a dry-run; don't affect the database"""),
        )
     
    def int(self, value, field=None, message='must be an integer'):
        field = field or value
        
        try:
            return int(value)
        except ValueError:
            raise CommandError('%s %s' % (field, message))
        
    def validate(self, value, fn, field=None, message='is invalid'):
        field = field or value
        
        if not fn(value):
            raise CommandError('%s %s' % (field, message))

    def in_range(self, value, min, max, field=None, message=None):
        message = message or ('must be between %s and %s' % (min, max))
        
        return self.validate(value, lambda x: x > 0 and x <= max, field, message)
