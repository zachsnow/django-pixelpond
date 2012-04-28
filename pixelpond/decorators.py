class classproperty(object):
    """
    Adds something like a read-only getter to a class (as opposed to instances
    of a class).  Unfortunately we can't force it to be read-only because
    `__set__` isn't invoked when accessing a descriptor through a class. 
    
    See: http://zachsnow.com/blog/2012/descriptors_annoyance/
    
    """
    def __init__(self, fn):
        self.fn = fn

    def __get__(self, instance, owner):
        if instance:
            raise AttributeError("'%s' object has no attribute '%s'" % (owner.__name__, self.fn.__name__))
        
        return self.fn(owner)

    def __set__(self, instance, value):
        if instance:
            raise AttributeError("'%s' object has no attribute '%s'" % (instance.__class__.__name__, self.fn.__name__))
        raise AttributeError("'%s' is read-only" % self.fn.__name__)
