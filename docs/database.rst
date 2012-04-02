Pond Structure
==============

The ``Pixel`` is the unit of "life", and corresponds to a ``cell`` in nanopond.
A ``Pixel`` consists of a genome of instructions, a memory (of the same length
as its genome), and several registers. 

The django-pixelpond database consists of several ``Pond``s, each of which
has a shortname for identification purposes, as well as a width, a height,
and a depth.  Whereas depth corresponds directly to genome length, width
and height are not in terms of ``Pixel``s, but instead are in terms of
``Puddle``s, which are themselves 2D collections of ``Pixel``s.
