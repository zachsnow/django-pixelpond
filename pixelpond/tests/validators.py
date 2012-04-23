import uuid

from django.forms import ValidationError

from pixelpond.tests.base import BaseTest
from pixelpond.validators import validate_genome, validate_uuid4

class GenomeValidatorTest(BaseTest):
    def test_valid(self):
        self.assertDoesNotRaise(lambda: validate_genome('0'))
        self.assertDoesNotRaise(lambda: validate_genome('01827af7162db7e7f09'))
    
    def test_invalid(self):
        self.assertRaises(ValidationError, lambda: validate_genome('xyz'))
        self.assertRaises(ValidationError, lambda: validate_genome('0 1 2'))
        self.assertRaises(ValidationError, lambda: validate_genome(''))

class UUID4ValidatorTest(BaseTest):
    def test_valid(self):
        self.assertDoesNotRaise(lambda: validate_uuid4(unicode(uuid.uuid4())))
        self.assertDoesNotRaise(lambda: validate_uuid4('00000000-0000-4000-8000-000000000000'))
        self.assertDoesNotRaise(lambda: validate_uuid4('00000000-0000-4000-9000-000000000000'))
        self.assertDoesNotRaise(lambda: validate_uuid4('00000000-0000-4000-a000-000000000000'))
        self.assertDoesNotRaise(lambda: validate_uuid4('00000000-0000-4000-b000-000000000000'))
        
    def test_invalid(self):
        self.assertRaises(ValidationError, lambda: validate_uuid4(''))
        self.assertRaises(ValidationError, lambda: validate_uuid4(unicode(uuid.uuid4()) + '-0000'))
        self.assertRaises(ValidationError, lambda: validate_uuid4('00000000-0000-0000-8000-000000000000'))
        self.assertRaises(ValidationError, lambda: validate_uuid4('00000000-0000-4000-0000-000000000000'))
        self.assertRaises(ValidationError, lambda: validate_uuid4('gggg0000-0000-4000-b000-000000000000'))
