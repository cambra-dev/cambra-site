---
title: "Free the Database"
description: "A gong-show talk arguing that the database contains the most useful code in the building, and that treating data as code is what lets you reach it."
venue: "Dagstuhl Seminar — Databases and Stream Processing"
pubDate: 2026-07-30
deck: dagstuhl
indexable: false
---

Databases contain some of the most carefully engineered code in computing —
buffer managers that know your access pattern, decades of index structures,
vectorizing JIT execution engines, transaction managers, workload management.
All of it reachable through one narrow opening.

The usual diagnosis is backwards. It isn't that databases can't talk to
compilers; plenty of them *are* compilers. It's that programming languages never
learned to talk about data.

This talk runs Lisp's slogan backwards. If code is data, then **data is code** —
a column is a function from key to value, a table is that function memoized, a
view is a composition, and an index is a strategy for evaluating one. Take it
literally and the rest follows: relational operators are ordinary operations on
functions, a filter is a refinement type, and mutable state is a function from
time to a value, which makes transactions a recurrence rather than a subsystem.

What you get for it is one program that both toolboxes can point at — inlining
and fusion and JIT from one side, join planning and index selection and
scheduling from the other — with no socket in the middle to stop at. Plus two
things that are currently very hard: constraints the compiler proves before the
program runs, and branching a running system the way you branch code.

Presented as a 10-minute gong show. Cambra is a research preview; the closing
slides are its actual failing-test list.
