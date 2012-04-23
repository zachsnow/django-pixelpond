#!/usr/bin/env python
import os, sys
from django.conf import settings

PATH = os.path.dirname(__file__)
sys.path.append(os.path.abspath(os.path.join(PATH, '../')))

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


from django.test.simple import DjangoTestSuiteRunner

suite = DjangoTestSuiteRunner(interactive=True, failfast=False)
failures = suite.run_tests(['pixelpond'])
if failures:
    sys.exit(failures)
