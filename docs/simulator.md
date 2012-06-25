Simulator
=========
The django-pixelpond simulator is a simple register-based virtual machine.

The simulator, and in particular its instruction set, is strongly influenced by
the implementation of **nanopond** (http://adam.ierymenko.name/nanopond.shtml).

The simulator performs all arithmetic modulo the depth of the pond; numbers
in this range are referred to as `byte`s. Occasionally the execution of an
instruction will require converting a `byte` to an instruction (see, for
example, `XCHG`); in this case the instruction is taken to be the `byte` modulo
the maximum instruction value.    

Registers
---------
The simulator has just a few registers and pointers.

* `rx`:
  The value register.
* `dx`:
  The direction register; 0 indicates North, 1 indicates East, 2 indicates
  South, and 3 indicates West.
* `cx`:
  The communication register.
* `ex`:
  The energy register. This is never directly manipulated.
* `gp`:
  The general pointer.  
* `ip`:
  The instruction pointer.  This is never directly manipulated.

Memory
------
Each pixel maintains its own memory, an array of `byte`s, referred to
as `memory`.  The length of `memory` is equal to the depth of the pond.

Instructions
------------
A pixel's instructions are maintained as a simple list, referred to as
`genome`.  The length of the `genome` is equal to the depth of the pond

All instructions (save for `LOOP`, `REP`, and `XCHG`, as described below)
advance `ip` by `1` upon execution (modulo the depth of the pond, of course).
Furthermore, all instructions decrement `ex` by their cost (which is
currently 1 for all instructions) upon execution.

In the following, a "neighboring pixel" is the nearest pixel in the direction
indicated by `dx`.  Permission depends on the sense of the interaction and
various other factors; see `docs/permissions.md`.

* `ZERO`:
  Zero `rx`, `dx`, `cx`, and `gp`.
* `FWD`:
  Increment `gp`.
* `BACK`:
  Decrement `gp`.
* `INCR`:
  Increment `rx`.
* `DECR`:
  Decrement `rx`.
* `XCHG`:
  Skip the next instruction (advance `ip` by 2 instead of the usual 1) and
  instead exchange its value with with `rx`.  
* `READ`:
  Read the `genome[gp]` into `rx`.
* `WRITE`:
  Write `rx` into `genome[gp]`.
* `IN`:
  Read `mem[gp]` into `rx`.
* `OUT`:
  Write `rx` into `mem[gp]`.
* `POST`:
  Write `rx` into the neighboring pixel's communication register, if
  permitted.
* `RECV`:
  Read `cx` into `rx`.
* `SENSE`:
  Read the neighboring pixel's energy register into `rx`, if permitted.
* `LOOP`:
  Advance `ip` to the next `REP` instruction if `rx` is 0.
* `REP`:
  Rewind `ip` to the previous `LOOP` instruction is `rx` is not 0.
* `KILL`:
  Increase `ex` by the value of the neighboring pixel's energy register, and
  then set the neighboring pixel's energy register to 0, if permitted.
* `SHARE`:
  Equalize `ex` and the neighboring pixel's energy register, if permitted.
* `FORK`:
  Overwrite the neighboring pixel's instructions with `memory`, if
  permitted.
* `TURN`:
  Increment `dx`.
* `HALT`:
  Stop execution.

Permissions
-----------
A cell is permitted to perform an instruction involving a neighboring pixel
if the neighbor's energy register is 0 (that is, if the cell is dead), or if the
neighboring cell's logo is equal to the `rx`.  In addition, a cell is
occassionaly randomly granted permission.

If a cell attempts to execute an instruction that requires permission, but does
not receive permission, then `ex` is decreased above and beyond the usual
cost of the instruction.  This decrease is referred to as a *penalty*.

Execution
---------
Execution begins at the first instruction after the logo, `genome[1]`, with
all registers reset, and `memory` overwritten with the value of `HALT`.
It proceeds until either a `HALT` instruction is reached, or `ex` equals 0
(at which point the pixel is considered dead).

Mutation
--------
The simulator is not perfect; the *mutation rate* affects how often it makes
mistakes.  These mistakes take a few forms: incorrect reads and writes to
`memory` and `genome`, incorrect arithmetic (for instance, `INCR` may
increment `rx` by 2 instead of just 0), and incorrect comparisons (a `LOOP`
instruction may treat `rx` as non-zero even when is equal to 0). In addition,
registers and pointers may have their values randomly perturbed.

The probablities with which these errors occur are referred to collectively
as the *mutation rates* of the simulator.
 