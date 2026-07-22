---
title: "Rebundling the Database — into a Language"
description:
  "It's trendy to decompose monoliths, unbundle the database, and separate
  storage from compute. Cambra openly re-fuses."
pubDate: 2026-07-23
author: "Dan Sotolongo"
draft: true
---

For over a decade, the fashionable direction in software has been _apart_. We
split applications into microservices. We unbundled the database into logs,
stream processors, and derived views. We separated storage from compute. Each
move solved a real problem, but each also created problems of its own. People
have noticed those problems: advocates for monoliths and consolidated stacks get
louder every year. Unfortunately, apart and together represent two ends of a
tradeoff, so neither of these positions is objectively _better_.

To break out of this unfortunate tradeoff, we need to take the database out of
its box, and rearchitect it as a programming language. Today,
[Cambra](https://github.com/cambra-dev/cambra) — a programming language that
rebundles the database — is open source, under Apache 2.0, and being developed
in the open.

## Apart, for better and worse

Some tradeoffs are fundamental, implied by the laws of physics. However,
software is currently caught in a _false_ tradeoff, which arises from the
artificial coupling between _physical_ resources and _logical_ concerns.
Physical things need to be separated: people need to be divided into teams,
systems need to be modularized into components, and the demands on compute
resources scale independently. Unfortunately, logical concerns often span 
teams, components, and scaling laws. We have seen this tension play out
repeatedly over the last decade: microservices vs monoliths, databases vs
unbundled data infra, colocated vs separated storage and compute.

Microservices are a response to a real problem: a hundred engineers cannot ship
one binary without trampling each other. Giving each team a service, with an
interface it owns, lets teams move independently. Unfortunately, that's when
[Conway's law](https://en.wikipedia.org/wiki/Conway%27s_law) kicks in: service
boundaries align with the org chart, not the logic. Logic gets artificially
split into services to match an architecture diagram that struggles to evolve
with business needs. Every cross-cutting change becomes a multi-team
negotiation, and the system as a whole grows harder to evolve even as each piece
gets easier to ship.

Unbundling the monolithic database addressed another problem. Database machinery
— indexes, materialized views, replication, a query planner — is some of the
most broadly useful software ever written, and all of it sat locked behind a
wire protocol and a query language that was never designed for what it does
today. Jay Kreps's _The Log_ and Martin Kleppmann's
[Turning the database inside-out](https://martin.kleppmann.com/2015/03/04/turning-the-database-inside-out.html)
pointed out something beautifully obvious: modularizing the components of a
database is extremely powerful. Unbundling let a generation of systems put the
database's machinery to work outside the database's box. But it also
[fragmented](/blog/announcement) one box into a fleet of distributed systems
wired together by hand. Every wire is an interface that no compiler checks, no
type system spans, and no debugger crosses. Even worse, the coordination the box
used to do quietly — atomicity, isolation, fault tolerance — became application
code.

Coupling storage capacity to processing capacity is also problematic: state and
processing have different lifecycles and different economics. Elastic compute
over durable, cheap, shared storage is operationally wonderful. We say this from
experience — we spent the last decade building these exact systems at Google and
at Snowflake (
[who popularized "separation of storage and compute"](https://doi.org/10.1145/2882903.2903741)).
But storage/compute separation tries to ignore a fundamental fact of physics:
[smaller things](https://motherduck.com/blog/big-data-is-dead/) are faster than
bigger things. Smearing your durable state across a fleet of storage nodes will
never be as fast as a well-designed, colocated system: separation buys
elasticity and economics, never speed. You can recover some of this performance
with caching, but that hauls in one of the
[two hard things](https://martinfowler.com/bliki/TwoHardThings.html). In the
meantime, you have to rearchitect your whole system to take advantage of the
improved economics.

Each of the above trends found a real problem — in the shape of organizations,
in the database's implementation, in the economics of computation — and solved
it by modularizing software in a novel way. Unfortunately, this resulted in
software being pulled apart at _logical_ seams. The benefits were organizational
and operational. The cost was an explosion of complexity in the application
layer.

## Rebundling at the right layer

How do we pull these seams back together? How do we get organizational
decoupling without slowing development to a crawl? How can we take advantage of
modular database components without having to re-implement the database? How can
we decouple resources without crystallizing a specific architecture into our
application?

The answer won't surprise you:

1. Decouple the logical structure of an application from its physical
   representation, so that you can make the tradeoffs demanded by physics
   _without_ rewriting your whole application.
2. Model this logical structure in a way that _composes_ cleanly, so that you
   can modularize your application without giving up on cohesiveness.

These are maxims of databases and programming languages. The idea of data
independence is among the
[core tenets](https://en.wikipedia.org/wiki/Codd%27s_12_rules) of the relational
model, and it, not the relational model itself, is arguably what makes databases
so peerlessly useful. The
[idea of compositionality](https://en.wikipedia.org/wiki/Principle_of_compositionality)
is what lies at the heart of most programming language theory, and it, not
purity or abstraction or elegance, is arguably what makes programming languages
so peerlessly flexible. The opportunity that's never quite materialized is a
synthesis of the two: a programming language that is also a database, at once
incredibly useful _and_ flexible.

That's Cambra. The database's concepts are language concepts: a transaction is a
control structure. Mutation is a sequence of changes, presented as a function of
time. A collection is a function. A view is an expression. They all compose
together. And the physical tradeoffs are separate decisions that the programmer,
the compiler, or the runtime can make, independent of application logic.

**Separate resources, compose concerns.** Let teams collaborate on a single
codebase and deploy independently. Let storage and compute scale independently,
if you need them to. What must never come apart is the model, because the model
is where your tools live: the type checker that proves an invariant holds, the
planner that maintains a view incrementally, the agent reading your system end
to end. Every seam in the model puts complexity beyond the reach of your tools,
complexity which compounds faster than you do.

## What rebundling looks like

Here is the kind of program you'll be able to write in Cambra, adapted from the
[north-star program](https://github.com/cambra-dev/cambra/blob/main/tests/programs/storefront/v0.cambra)
in the repo's demo gallery: a storefront with transactional order intake,
contract-checked pricing, and a time-indexed revenue view. Transactions,
streaming, serving, and analytics — the layers a conventional stack splits
across systems are a few paragraphs here.

Note that this program doesn't run yet. The foundation exists to support it all
(otherwise we wouldn't be comfortable sharing it), but this is a demonstration
of the development experience we're targeting, not a working program.

```python
# Type aliases, not new types.
Dollars = Real
Qty = {q: Int | q >= 0}
ItemPricing = {price: Dollars, cost: Dollars | price >= cost}

catalog: Map(String, ItemPricing) = [
    "tee-black" -> (price=25, cost=11),
    "hoodie"    -> (price=60, cost=34),
    "poster"    -> (price=10, cost=9),
]

# The type of catalog keys.
SKU = {sku: String | sku in catalog.keys()}

# A mutable, transactional map, like a column in a database.
# A full map has an entry for every element of its domain,
# so lookups are statically guaranteed to never miss.
# Negative stock is prevented by the type checker on `Qty`.
inventory: Mut(FullMap(SKU, Qty), Txn) := [
    "tee-black" -> 500,
    "hoodie"    -> 200,
    "poster"    -> 1000,
]

import http

order_reqs,   order_resps   = http.serve("8080", "POST", "/order")
restock_reqs, restock_resps = http.serve("8080", "POST", "/restock")
stats_reqs,   stats_resps   = http.serve("8080", "GET", "/stats")

def quote(item: ItemPricing, qty: Qty) => Dollars:
    p = item.price * qty
    # Checked at compile time to ensure sales are never below cost.
    static assert p >= item.cost * qty
    p

def reserve(sku: SKU, qty: Qty) => Bool requires Transaction:
    stock = inventory[sku] # Always present because of the `SKU` type.
    if stock >= qty:
        inventory[sku] := stock - qty # Typechecks only under the check above.
        true
    else:
        false

# The loops below run concurrently, as requests come in for each endpoint.

for req in restock_reqs:
    result = with begin():
        # `req.body.sku` is inferred to be in the catalog, checked by HTTP lib.
        stock = inventory[req.body.sku]
        # `qty` is inferred to be a non-neg int, checked by HTTP lib.
        inventory[req.body.sku] := stock + req.body.qty
        http.ok("restocked")

    restock_resps[req.id] = result

# Committed order lines; each carries its transaction's commit time.
orders: Feed({sku: SKU, qty: Qty, price: Dollars, discount: Dollars, time: Time})

for req in order_reqs:
    # The HTTP lib uses inferred type constraints to validate and parse requests,
    # rejecting malformed requests.
    result = match catalog[req.body.sku]:
        case none:
            http.not_found("no such sku")
        case some(item):
            with txn = begin():
                # `req.body.sku` is refined to the SKU type by the enclosing conditional.
                if reserve(req.body.sku, req.body.qty):
                    price = quote(item, req.body.qty)
                    # Feed the collection of orders.
                    orders << (
                        sku = req.body.sku,
                        qty = req.body.qty,
                        price = price,
                        discount = item.price * req.body.qty - price,
                        time = txn.current_time(),
                    )
                    http.ok(str(price))
                else:
                    http.conflict("out of stock")

    order_resps[req.id] = result

# Revenue per SKU, as of this request's own transaction time.
for req in stats_reqs:
    with txn = begin():
        paid = orders.filter(\o -> o.time < txn.current_time())
        revenue = [key -> sum([o.price for o in g])
            for key -> g in groupby(paid, \o -> o.sku)]

    stats_resps[req.id] = revenue
```

No glue services, no dual writes, no wires. Five things to notice.

**The rollup is not a query DSL.** `orders` is not a list — it's the feed of
committed order lines — and `/stats` rolls it up with an ordinary comprehension.
The compiler recognises the shape and emits a keyed aggregate, the same way it
lowers an equality guard between two comprehension clauses to a hash join. There
is no boundary where the "program" ends and the "query" begins, which means
there is no boundary where analysis has to stop.

**"Revenue so far" is a well-defined value.** A bare rollup over a live feed
denotes _total_ revenue — a value that exists only when the stream closes, which
is potentially never. So `/stats` pins its read to its own transaction's time,
and "revenue as of now" becomes an ordinary, materializable view the runtime is
free to maintain incrementally.

**Nothing is ever overwritten.** The `inventory` writes work because of how
Cambra models state — a discipline we call **temporal functional mutation**. A
mutable variable _is_ a total function from a time axis to values; a write
reveals one more position of it, and the compiler eliminates every mutation into
pure, causally-well-founded recursion. Mutation becomes something the compiler
can reason about rather than something it must fear — and state at a moment in
time is just function application, which is all `/stats` is doing.

To be clear, this is a claim about the model, not the machine: the compiled
program still mutates memory in place and discards history no reader can reach.
But those become the runtime's decisions, made below the semantics, where they
cannot be observed.

Note also how shared state is handled: `inventory` is touched by two concurrent
handlers, and that commitment must be spelled in its type — the `Txn`. Non-
transactional state cannot be shared. The
[mutability design doc](https://github.com/cambra-dev/cambra/blob/main/src/ccl/design/mutability.md)
develops this in full.

**Violating integrity is a type error.** The domain rules live in the types.
`Qty` says stock never goes negative: the decrement in `reserve` typechecks only
under the `stock >= qty` check, and deleting the check stops the program from
compiling. `ItemPricing` says no item lists below cost, so a bad catalog entry
is rejected at the literal. `SKU` is the type of keys actually in the catalog,
which is what lets `inventory` be a `FullMap` — a map with an entry for every
element of its domain, whose lookups are statically guaranteed to hit. And
`quote`'s `static assert` lifts into its return type, so no future
implementation of `quote` can sell below cost. These are the database's
constraints, relocated into the type system — checked before the program runs
rather than enforced while it does.

**The trust boundary is typed.** `reserve` demands a `SKU` and a `Qty`, so the
compiler knows exactly what each endpoint can accept, and the HTTP library
derives its request validation from those inferred constraints — a negative
quantity or an unknown SKU is rejected at the boundary, not deep inside a
handler. And where the program wants to own a failure case, it just handles it:
the `/order` handler matches the catalog lookup itself so it can answer with its
own 404.

## Caveat Programmator

To be clear, this release is a **research preview**, not a product. There are no
binaries, no stability promises, and it's not yet ready to run real workloads.
We aren't accepting pull requests yet — though issues and discussions are open,
and we want them. We're publishing because the first two posts made an argument,
and code is the precise form of an argument. We'd rather be judged on specifics
than on promises.

A research preview earns trust by being precise about its edges, so every
feature in the docs is marked: implemented, decided-but-unimplemented, or
sketched. The
[spec](https://github.com/cambra-dev/cambra/blob/main/docs/chl-spec.md)
separates behaviour you can run today from direction we've committed to;
[demo-programs.md](https://github.com/cambra-dev/cambra/blob/main/docs/demo-programs.md)
is a ledger of runnable programs and exactly what blocks the ones that don't run
yet. The storefront above is that ledger's north-star, and it does not run yet:
its row pins the exact blocker list, while its simpler ancestors run end to end today.

The two loops from [the last post](/blog/the-system-as-a-program) are on that
ledger too. The verification loop — refinement types, constraint solving,
inference — is machinery in the type checker today, with whole-application
contracts as the next major step. The validation loop — branching the running
system — is Cambra's headliner feature, and the purity and boundary discipline it
requires are load-bearing in the codebase now.

## Come dig in

The repo's [reading map](https://github.com/cambra-dev/cambra#reading-map) is
ordered for a newcomer: a
[guided tour](https://github.com/cambra-dev/cambra/blob/main/docs/design.md) of
the language and architecture, then the spec, then the
[formal semantics](https://github.com/cambra-dev/cambra/blob/main/docs/operational-semantics/summary.md).
If you read one thing, read the tour.

If something looks wrong, unclear, or interesting,
[open an issue or a discussion](https://github.com/cambra-dev/cambra/issues) —
informed discussion is why we're publishing. And if you work in
language semantics or formal verification and this is your kind of problem,
we're actively looking for collaborators:
[public@cambra.dev](mailto:public@cambra.dev).

The industry spent ten years taking the database apart. We're putting it back
together not as a bigger box, but as a language for you to play with. Come
watch. Better yet, come tell us what we're missing.
