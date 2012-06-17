Server
======

The django-pixelpond server is 

For more information about how the actual pond and pixels are represented in
the database, see ``docs/database.rst``.

Access Control
--------------

Beyond simply storing the state of the pond, the server also manages client
access to it.  Whenever a client requests a portion of the pond to simulate,
the server finds an unused portion, marks it as in-use, and gives it to the
client.  When the client has simulated that portion of the pond for a period
of time it returns its result to the server, which updates the pond.

In order to ensure that different parts of the pond can interact, the portions
of the pond that are returned to the server overlap.  Specifically, when a
client requests a portion of the pond, several neighboring ``Puddle``s are
returned.  A later request might return some of those ``Puddle``s, and others
that were not previously returned.
 