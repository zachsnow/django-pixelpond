django-pixelpond
================

`django-pixelpond` is a Django application to grow artificial life in your
browser.

A demo built on the development version of this project can be seen at
http://pixelpond.zachsnow.com/

Concept
=======

Pixel Pond is distributed corewars-style artificial life simulator strongly
influenced by **nanopond** (http://adam.ierymenko.name/nanopond.shtml) and
**PondLife** (http://github.com/zachsnow/pondlife/).

In order to pull off the *distributed* part a single large artificial life
environment (a *pond*) is maintained by a centralized server.  Clients request
portions of that environment and simulate them for a period of time, and then
reflect the updated environment back to the server.

In order to get *really* distributed, clients can communicate with several
different central servers at once, allowing organisms from one server to
"migrate" to another.

Client
======

The django-pixelpond client is Javascript application, intended primarily
to be run in the browser, that is responsible for actually simulating the
artificial life environment.

For more information about the client-side components of django-pixelpond,
see ``docs/client.rst``.

Server
======

The django-pixelpond server is very simple: its only job is to maintain the
structure of the pond, and pass chunks of the pond ("puddles") to clients.

For more information about the server-side components of django-pixelpond,
see ``docs/server.rst``.
