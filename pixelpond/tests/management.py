from pixelpond.tests import base
 
class Output(cStringIO):
    def value(self):
        return str(self)

class ManagementTest(base.BaseTest):
    def __init__(self, *args, **kwargs):
        super(TestCase, self).__init__(*args, **kwargs)
        
    def call_command(self):
        stderr = Output()
        stdout = Output()
         
        call_command(, stdout=stdout, stderr=stderr)
        self.stderr = stderr.value()
        self.stdout = stdout.value()
