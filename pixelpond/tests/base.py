import unittest

class BaseTest(unittest.TestCase):
    def setUp(self):
        """
        Don't override this ever.
        """
        self.presetup()
        self.setup()
    
    def presetup(self):
        pass
    
    def setup(self):
        pass

    def tearDown(self):
        """
        Don't override this ever.
        """
        self.teardown()
    
    def teardown(self):
        pass
    
    def assertIsInstance(self, obj, cls, msg=None):
        self.assertTrue(isinstance(obj, cls), msg=msg)

    def assertNotIsInstance(self, obj, cls, msg=None):
        self.assertFalse(isinstance(obj, cls), msg=msg)

    def assertDoesNotRaise(self, f):
        f()
