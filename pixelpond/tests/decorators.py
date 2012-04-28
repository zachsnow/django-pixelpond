from pixelpond import settings
from pixelpond.tests.base import BaseTest
from pixelpond.decorators import classproperty

class ClassPropertyTest(BaseTest):
    def setup(self):
        class C(object):
            @classproperty
            def forty_two(cls):
                return 42
            
            @classproperty
            def cls(c):
                return c
        self.C = C
    
    def test_class(self):
        self.assertEquals(self.C.forty_two, 42, 'the getter should return the correct value')
        self.assertEquals(self.C.cls, self.C, 'the getter should have access to the class')
        self.C.forty_two = 43
    
    def test_instance(self):
        self.assertRaises(AttributeError, lambda: self.C().forty_two)
        
        try:
            self.C().forty_two
        except AttributeError as e:
            self.assertEquals("'C' object has no attribute 'forty_two'", e.args[0])
        
        def assign_instance():
            self.C().forty_two = 43
        
        self.assertRaises(AttributeError, assign_instance)
        
        def assign_class():
            self.C.forty_two = 43
        
        # NOTE: while it would be nice if this raised, Python won't let it.     
        # self.assertRaises(AttributeError, assign_class)
