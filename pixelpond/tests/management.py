from cStringIO import StringIO

from pixelpond.tests import base
 
class ManagementTest(base.BaseTest):
    """
    A base class for testing management commands that provides access
    to both standard and error output (provided that derived tests always
    use ``self.stderr`` and ``self.stdout`` to perform IO).
    """
    def __init__(self, *args, **kwargs):
        super(TestCase, self).__init__(*args, **kwargs)
        
    def call_command(self, command):
        stderr = StringIO()
        stdout = StringIO()
         
        call_command(command, stdout=stdout, stderr=stderr)
        self.stderr = unicode(stderr)
        self.stdout = unicode(stdout)
