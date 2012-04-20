from pixelpond.tests.base import BaseTest

import uuid4

class GenomeValidatorTest(BaseTest):
    def test_valid(self):
        self.assertDoesNotRaise(lambda _: '0')
        self.assertDoesNotRaise(lambda _: '01827af7162db7e7f09')
    
    def test_invalid(self):
        self.assertRaises(ValidationError, 'xyz')
        self.assertRaises(ValidationError, '0 1 2')
        self.assertRaises(ValidationError, '')

class UUID4ValidatorTest(BaseTest):
    def test_valid(self):
        self.assertDoesNotRaise(lambda _: validate_uuid4(uuid.uuid4()))
        self.assertDoesNotRaise(lambda _: '00000000-0000-4000-8000-000000000000')
        self.assertDoesNotRaise(lambda _: '00000000-0000-4000-9000-000000000000')
        self.assertDoesNotRaise(lambda _: '00000000-0000-4000-a000-000000000000')
        self.assertDoesNotRaise(lambda _: '00000000-0000-4000-b000-000000000000')
        
    def test_invalid(self):
        self.assertRaises(ValidationError, lambda _: validate_uuid4(''))
        self.assertRaises(ValidationError, lambda _: validate_uuid4(uuid.uuid4() + '-0000'))
        self.assertRaises(ValidationError, lambda _: validate_uuid4('00000000-0000-0000-8000-000000000000'))
        self.assertRaises(ValidationError, lambda _: validate_uuid4('00000000-0000-4000-0000-000000000000'))
