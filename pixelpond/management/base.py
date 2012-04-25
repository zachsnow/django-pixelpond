from optparse import make_option

from django.core import management
from django.core.management import base
from django.utils.encoding import smart_str

from pixelpond import settings

if not settings.TESTING: 
    class CommandError(management.CommandError):
        pass
else:
    class CommandError(Exception):
        pass

class BaseCommand(base.BaseCommand):
    option_list = base.BaseCommand.option_list + (
        make_option('--dry-run',
            action='store_true',
            dest='dry_run',
            default=False,
            help="""Perform a dry-run; don't affect the database"""),
        )
    
    def handle(self, *args, **kwargs):
        self.dry_run = kwargs['dry_run']
        
        for k in ['stderr', 'stdout', 'verbosity', 'traceback', 'settings', 'pythonpath', 'dry_run']:
            if k in kwargs:
                del kwargs[k]
        
        try:
            return self.respond(*args, **kwargs)
        except CommandError as e:
            self.stderr.write(smart_str(self.style.ERROR('Error: %s\n' % e)))
    
    def int(self, value, field=None, message='must be an integer'):
        field = field or value
        
        try:
            return int(value)
        except ValueError:
            raise CommandError('%s %s' % (field, message))
        
    def is_valid(self, value, fn, field=None, message='is invalid'):
        field = field or value
        
        if not fn(value):
            raise CommandError('%s %s' % (field, message))

    def in_range(self, value, min, max, field=None, message=None):
        message = message or ('must be between %s and %s' % (min, max))
        
        return self.is_valid(value, lambda x: x > 0 and x <= max, field, message)

