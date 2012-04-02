#!/usr/bin/python

# Use setuptools if we can
try:
    from setuptools.core import setup
except ImportError:
    from distutils.core import setup
from pixelpond import __version__, __description__

setup(
    name='django-pixelpond',
    version=__version__,
    description=pixelpond.__doc__
    long_description="""django-pixelpond is a reusable Django application that lets you add a artificial life "pond" to your Django-powered website. It's just for fun.""",
    author='Zach Snow',
    author_email='z@zachsnow.com',
    url='http://zachsnow.com/pixelpond/',
    download_url='http://zachsnow.com/pixelpond/download',
    classifiers=[
        "Development Status :: 1 - Planning",
        "Framework :: Django",
        "Intended Audience :: Science/Research",
        "Intended Audience :: Developers",
        "License :: Public Domain",
        "License :: WTFPL+IPA",
        "Operating System :: OS Independent",
        "Topic :: Scientific/Engineering :: Artificial Life",
    ],
    packages=[
        'pixelpond',
    ],
)
