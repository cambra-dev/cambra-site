---
title: "Show, Don't Tell"
description: "Cambra's source is now public: the compiler, the runtime, the design docs, and an honest ledger of what runs today. Read it, study it, argue with it."
pubDate: 2026-07-23
author: "Dan Sotolongo"
draft: true
---

[Last time](/blog/the-system-as-a-program), we ended with a promise: we'd rather show you than tell you. Today we can. [Cambra's source is public](https://github.com/cambra-dev/cambra), under Apache 2.0.

What's there is a working compiler and runtime for the architecture that post described: a Python-like surface language that lowers to a pure, typed core, which in turn compiles to streaming dataflow. Alongside the code are the documents we actually build from — a [guided tour](https://github.com/cambra-dev/cambra/blob/main/docs/design.md) of the language and architecture, the [surface-language spec](https://github.com/cambra-dev/cambra/blob/main/docs/chl-spec.md), a [formal operational semantics](https://github.com/cambra-dev/cambra/blob/main/docs/operational-semantics/summary.md), and per-module design docs down to the individual compiler passes.

To be clear about what this release is: a research preview, not a product. There are no binaries and no stability promises, and we aren't accepting pull requests yet — though issues and discussions are open, and we want them. We're publishing because the previous two posts made an argument, and code is the precise form of an argument. We'd rather be judged on specifics than on promises.

## What showing looks like

Here is a complete Cambra program, from the README: a tiny storefront that ingests orders over HTTP and serves a rolling revenue figure.

```python
products = [
    {sku: "espresso", price: 3},
    {sku: "latte",    price: 5},
]

# Orders arrive over HTTP: each POST body is an order record.
orders, order_acks = http_serve("8080", "POST", "/order")
for o in orders:
    order_acks << "ok\n"

# Rolling revenue, served: the order stream joined to the catalog,
# summed up to each reading transaction's time.
revenue_reqs, revenue_resps = http_serve("8080", "GET", "/revenue")
for req in revenue_reqs:
    with txn = begin():
        so_far = orders.restrict(lambda o: o.time < txn.current_time())
        revenue = sum([p.price * o.qty for p in products for o in so_far if p.sku == o.sku])
        revenue_resps[req.id] = str(revenue) + "\n"
```

Three things to notice.

**The comprehension is not a query DSL.** `orders` is not a list — it's the live stream of requests hitting `/order` — and yet it joins against the catalog with ordinary language constructs. The planner notices the equality predicate and lowers the cross product to a keyed hash join. There is no boundary where the "program" ends and the "query" begins, which means there is no boundary where analysis has to stop.

**"Revenue so far" is a well-defined value.** A bare `sum` over a live stream denotes *total* revenue — a value that exists only when the stream closes, which is never. So the handler pins its read to the reading transaction's time, and "revenue as of now" becomes an ordinary, materializable view the runtime is free to maintain incrementally.

**Nothing is ever overwritten.** That time-pinned read works because of how Cambra models state — a discipline we call **temporal functional mutation**. A mutable variable *is* a total function from a time axis to values; a write reveals one more position of it, and the compiler eliminates every mutation into pure, causally-well-founded recursion. Mutation becomes something the compiler can reason about rather than something it must fear — and state at a moment in time is just function application. The [mutability design doc](https://github.com/cambra-dev/cambra/blob/main/src/ccl/design/mutability.md) develops this in full.

## An honest ledger

A research preview earns trust by being precise about its edges. Every feature in the docs is marked: implemented, decided-but-unimplemented, or sketched. The [spec](https://github.com/cambra-dev/cambra/blob/main/docs/chl-spec.md) separates behaviour you can run today from direction we've committed to; [demo-programs.md](https://github.com/cambra-dev/cambra/blob/main/docs/demo-programs.md) is a ledger of runnable programs and exactly what blocks the ones that don't run yet. Parts of the example above are on that ledger — the ingest half runs today; the time-pinned handler is decided and landing. You will not have to guess where the edge of the implementation is; we drew it for you.

The two loops from the last post are on that ledger too. The verification loop — refinement types, constraint solving, inference — is machinery in the type checker today, with whole-application contracts as the driving direction. The validation loop — branching the running system — is the design's north star, and the purity and boundary discipline it requires are load-bearing in the codebase now.

## Come argue with it

The repo's [reading map](https://github.com/cambra-dev/cambra#reading-map) is ordered for a newcomer: the guided tour, then the spec, then the formal semantics. If you read one thing, read the tour.

If something looks wrong, unclear, or interesting, [open an issue or a discussion](https://github.com/cambra-dev/cambra/issues) — design argument is exactly what we published for. And if you work in language semantics or formal verification and this is your kind of problem, we're actively looking for collaborators: [public@cambra.dev](mailto:public@cambra.dev).

We said we'd rather show you than tell you. It's all there now — go look.
