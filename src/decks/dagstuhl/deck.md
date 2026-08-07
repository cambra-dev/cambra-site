<!--
  Cambra @ Dagstuhl — gong show, 10 minutes.
  Edit this file, then rebuild:   python3 build.py

  SYNTAX
    ---              start a new slide
    # ...            headline — the argument beat. Keep under ~10 words.
    ## ...           eyebrow (small label above the headline)
    %sub ...         one-line subtitle (title slide only)
    %punch ...       the single accent line. Keep under ~14 words.
    %wink ...        small grey aside at the bottom
    %chip design     status chip: "design" (hollow) or "running" (filled)
    %box LABEL       the box diagram; then "- item | gloss" rows
    %rows            label/value rows; then "- left | right" rows
    %rows2           same, laid out in two columns (half the height)
    %cols            two named columns; then "### Title" and "- bullet" rows
    %code            verbatim code lines follow. [[x]] highlights x.
    %diag            verbatim compiler-error lines follow
    %timeline        the commit-order diagram (fixed drawing)
    %fork            the branch diagram: one history, two futures
    %split           put the NEXT TWO blocks side by side
    %callouts        margin notes beside code; "- LABEL | text" rows
    %table           status table; "- program | what | status" rows
                     status starting with "runs" renders as running
    %pills           pill row; "- text" rows
    %byline          "- text" rows, small caps
    %notes           everything after this is speaker notes (never on screen)

  RULE OF THUMB: if a slide has more than ~25 visible words, cut it.
-->

---


# Free the database!
%sub Decades of the most useful code in computing is trapped in a box.

%byline
- Dan Sotolongo
- cambra.dev
- Dagstuhl gong show
%wink research preview · please hold the gong

%notes
Most of what I'm about to say is completely obvious
...and likely to be very contentious.
Most of it has already been done before, much of it by people in this room.
But this combination of things is novel. Or at least I think it is.
I want to know what you think.

---

## 01 · The box
# Better than my programming language!

%box SQL
- buffer manager | knows the access pattern
- index structures | decades of them
- execution engine | vectorized, JIT
- transaction manager | MVCC, recovery
- query optimizer | large-scale, semantic rewrites
- workload management | prioritization, isolation

%notes
"All this stuff lives in a box.
The box has a tiny window, and there's an attendant.
I have to ask the attendant for everything I need.
I have to yell at it for it to understand me.
(The attendant is SQL)
(Before you ask: no, I'm not just going to complain about SQL)"


---

## 02 · Prior art
# Databases are already programmable?

%cols
### Good
- • Logic alongside data
- • Declarative queries
- • Transactions

### Bad
- • Syntax *(least important)*
- • Poor compositionality (modules, functions, types)
- • Poor resource isolation
- • Poor development workflow


%notes
"Ok, so this is just SQL + SPs, right?
Don't get me wrong, I think SQL + SPs are fantastic ideas.
They just have one problem: *nobody uses them*!
And it's well-understood why: no modules, no types, no tests, a dialect per
vendor, and your domain logic ends up fractured across two languages.
But those are all *tooling* complaints. So why don't we just fix them??"

---

## 03 · The turn
# Lisp said "Code is Data". I say "Data is Code"!

%rows
- column | `c : PrimaryKey => ColType`
- table | `t : PrimaryKey => {c1: Col1Type, c2: Col2Type, ...}`
- row | `t(pk)`
- view | `f ∘ t`
- index | _a way to evaluate the function_

%punch A table is a memoized function whose source code we **deleted**.

%notes
"Here's how I think we can fix it."

"Our field has collectively bought into an illusion: that data and code are
different kinds of thing, living in different systems, reached through a
protocol. That split is a choice, not a law — and it is why the box exists."

---

## 04 · Consequence one
# Relational operators work just fine on functions.

%code
product : Sku => {price: Num, cost: Num}
# Filter — narrow the domain
cheap : {s: Sku | product(s).price < 10} => {price: Num, cost: Num} = product
# Join on the shared key, then Aggregate
holding_cost = sum(\s -> cheap(s).cost * inventory(s).count)


%rows2
- filter | restrict to a smaller domain
- project | compose with a scalar function
- join | a record type with a refinement
- aggregate | fold over a family of sub-domains

%punch We just need a more powerful type system.

%notes


---

## 05 · Consequence two
# Mutable state is a function from time to a value.

%split
%code
inventory : {Txn, Sku} => {count: Int, ...}
  = # some expression involving `get_prev(inventory, txn)`

begin  : {Site, Index} => Txn # oracle assigns commit order
commit : Txn => Option(Time)  # oracle checks for conflicts

%timeline

%punch Transactional state is a recursive function with some help from the runtime.

%notes
"The heading says time, the code says Txn. The commit order *is* the time axis here — a total order the runtime hands out, not a wall clock."

"A Site is one place in the program that writes; an Index is which iteration of it — which request. Together they name one attempt, and the oracle tells you where it landed in the commit order."

"So begin and commit are just functions. Not a subsystem you call into. The commit order is a domain, which is what puts transactions in the same algebra as everything else."

"Every read reaches strictly earlier, so the recurrence is well-founded."

"And to be clear: the IR is pure — that's what buys reordering and fusion. The runtime is not. It's a real storage engine with real mutable state. Purity is a claim about the language, not the machine."


---

## 06 · The payoff
# On the shoulders of giants

If we can think of a database + application as term in a pure-functional programming language, we get to apply all of the tools of both fields in one place.

%cols
### Programming Languages
- Syntax
- Types
- Ergonomics

### Databases
- Optimizations
- Indexing data structures
- Workload management

%punch All in the **same** layer, with a single programming model.

%notes
"We stand on the shoulders of giants.
This unified model lets us stand atop titans of *both* DBs and PLs."

---

## 07 · What it looks like
# A Teaser

%code
Dollars = Real
Qty = [[{q: Int | q >= 0}]]
ItemPricing = {price: Dollars, cost: Dollars | price >= cost}
catalog: Map(String, ItemPricing) = ["poster" -> (price=10, cost=9), ...]
SKU = {sku: String | [[sku in catalog.keys()]]}

inventory: Mut([[FullMap(SKU, Qty)]], Txn) := ["poster" -> 1000, ...]
orders: Feed({sku: SKU, price: Dollars, time: Time})

def reserve(sku: SKU, qty: Qty) => Bool [[requires Transaction]]:
    stock = inventory[sku]
    if [[stock >= qty]]:
        inventory[sku] := stock - qty
        true
    else: false

[[for req in order_reqs:]]
    with txn = begin():
        if reserve(req.body.sku, req.body.qty):
            orders << (sku=..., price=..., time=txn.current_time())

[[for req in stats_reqs:]]
    with txn = begin():
        paid = orders.filter(\o -> o.time < txn.current_time())
        revenue = [k -> sum([o.price for o in g]) for k -> g in groupby(paid, \o -> o.sku)]

%callouts
- Qty | negative stock is a type error
- SKU | the keys actually in the catalog
- FullMap | total, so lookups cannot miss
- requires | a type error outside a transaction
- the guard | delete it, the decrement won't compile
- for | loops run in parallel, when they can

%notes
"Here's a condensed version of our north-star program."

"SKU is the type of keys *actually in the catalog*. That's what lets inventory be a FullMap — an entry for every element of its domain. So this lookup is statically guaranteed to hit. There's no Option here, and no null check, because the type made the miss impossible."

"Qty says stock is never negative. So the decrement only typechecks under this guard. Delete the guard and the program stops compiling — the proof obligation and the runtime check are the same line of code."

"And ItemPricing rejects a below-cost catalog entry at the literal, before anything runs."

"reserve demands a SKU and a Qty, so the HTTP library derives its request validation from those. A bad quantity or an unknown SKU is rejected at the edge, not deep in a handler."

---

## 08 · Verification
# Constraints are formally verified at compile time.

%diag
error: postcondition may not hold
  --> storefront/v1.cambra:64
   |  sale = item.price / 2
   |  assert sale >= item.cost * qty
   |         ^^^^^^^^^^^^^^^^^^^^^^^
   = 5 >= 9 does not hold for "poster" -> (price = 10, cost = 9)

%punch The ill-considered flash sale doesn't compile.

%notes
"We put a flash sale on: fifty percent off. Fine for hoodies. But one poster costs us 9 and would have sold for 5."

"In a normal stack that's a Monday incident. Here it doesn't compile."

"And notice the postcondition was written once, in the previous version. No future implementation of quote can escape it. That's the difference between a test and a refinement."

---

## 09 · Validation
# Branch the running system. Aim real traffic at both.

%fork

%rows2
- branched | logic & data
- inherited | all state before t_new
- duplicated | just the differences
- eliminated | staging environments

%punch See the real impact of changes, with no risk, no setup.

%notes
Git branches your code. Neon branches your database. Neither branches your program — the code and the state it produced, together, as one thing.

That's program branching: fork a running application, evolve the logic and the data on the branch, then merge back. And merge is the hard part. Merging state row-by-row is meaningless when each branch ran a different program — the rows only mean something under the code that wrote them. The only sensible answer is: merge the source, then derive the state the merged program would have produced.

Nothing at the database layer can do that, because it doesn't have the logic. Nothing at the code layer can do it, because it doesn't have the state. You need one model that holds both — which is what Cambra is.

That's the storefront's v0/v1: inventory and the order feed persist across the branch point, because they're state of the *program*, not of a version.

Land it: "verification catches what you can state. Validation catches what you didn't think to state."

---

## 10 · Where it is
# Research preview

%table
- inner_join | hash join from an equality over a product | runs
- filter_and_aggregate | filter + aggregate through planning | runs
- http_greeter | real HTTP roundtrip, three routes | runs
- streaming_echo | stdin through a comprehension | runs
- for_accumulator | loop-carried state as a recurrence | runs
- groupby_rollup | keyed aggregate, inner projection | curry unimplemented
- txn_kv | transactional KV + stream aggregate | lexer, then a stack
- discount_contract | the contract two slides ago | assert surface
- nonneg_inventory | the oversell refinement | map literals
- storefront | all of it, composed, two versions | all of the above

%punch Eight of seventeen run. Please don't deploy this.

%notes
"Everything marked design back there doesn't compile yet. Here's the real list."

"Cambra is quite assertive about its failures."

"Each blocked row is a committed test asserting the *current broken behaviour*, so it goes red the day it starts working."

"Please don't deploy this."

---

# A platform for data intensive applications.
%sub (To make agentic coding scale)
%pills
- Apache-2.0
- github.com/cambra-dev/cambra
- cambra.dev
- dan@cambra.dev
%punch Tell me why it won't work.

%notes
"Don't tell investors I put that in the subtitle."

"We hope this can be a platform for research. Not trying to build a product with a paper attached."
