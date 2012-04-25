#!/usr/bin/env python
import os, sys
from django.conf import settings

################################################################################
# Pixelpond assumes that it is on the path.
################################################################################
PATH = os.path.dirname(__file__)
sys.path.append(os.path.abspath(os.path.join(PATH, '../')))

################################################################################
# Override the various sizes to be much smaller so that testing is faster.
################################################################################
from pixelpond import settings as test_settings

test_settings.PIXELPOND_POND_DEPTH = 32
test_settings.PIXELPOND_DEFAULT_POND_WIDTH = 4
test_settings.PIXELPOND_DEFAULT_POND_HEIGHT = 4
test_settings.PIXELPOND_DEFAULT_PUDDLE_SIZE = 2

################################################################################
# Configure Django.
################################################################################
settings.configure(
    DEBUG=True,
    DATABASES={
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(PATH, 'pixelpond.test.db'),
        }
    },
    INSTALLED_APPS=(
        'pixelpond',
    )
)

################################################################################
# Just run tests for the pixelpond project.
################################################################################
from django.test.simple import DjangoTestSuiteRunner
suite = DjangoTestSuiteRunner(interactive=True, failfast=False)
failures = suite.run_tests(['pixelpond'])
if failures:
    sys.exit(failures)
