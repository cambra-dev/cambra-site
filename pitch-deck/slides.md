---
theme: default
title: Cambra — Seed Round
colorSchema: dark
---

<div class="frame" style="justify-content:flex-start;padding-top:4.5rem">
  <img class="title-wordmark" src="/brand/logo-horizontal-negative.svg" alt="Cambra">
  <h1 style="font-size:3.4rem;margin:0">Ship fast. Break nothing.</h1>
  <p class="punch" style="margin-top:.6rem">
      Replace your stack with one program on one engine: 
      <br>proven before it runs, tested against a branch of production.
  </p>
  <div class="byline">
    <span><div>Dan Sotolongo<br>
        Daniel Mills<br>
        Skylar Cook</div></span>
    <span><a href="cambra.dev">cambra.dev</a></span>
    <span>Seed</span>
    <span>2026</span>
  </div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">01 · The Problem</div>
    <h2>Your stack unravels in 1 week.</h2>
  </div>
  <div class="grow">
    <div class="grow split">
        <div class="diagram-stack">
          <!-- The clock names the protagonist and the pace: an engineer with a
               coding agent, six weeks, not six years. -->
          <div class="when">
            <span v-click="1"><b>Day 1</b> the app</span>
            <span v-click="2"><b>Week 2</b> jobs</span>
            <span v-click="3"><b>Week 4</b> analytics</span>
            <span v-click="4"><b>Week 6</b> observability</span>
          </div>
          <div class="diagram-canvas">
            <SystemDiagram :stage="$clicks" />
          </div>
          <div class="flow-note" v-click="5">Each arrow is unchecked</div>
        </div>
        <div class="beats arc" v-click="6">
            <div>More systems, more arrows.</div>
            <div>More places things can go wrong.</div>
            <div class="hot">You can't be sure until production.</div>
        </div>
    </div>
    <p class="closer center" v-click="7">
        <span>AI builds faster. <span class="hot">It doesn't build simpler.</span></span></p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
0. Here's the problem we're solving. Say you're a software developer building an application.

1. You start with the 3-tier architecture: a database, a server, and a client. You get up and running in a day, and iterate with your agent to get the MVP done in under a week.

2. Then, you realize you need to handle long-lived background tasks. So you add a workflow system.

3. Then, you notice that you need to understand how customers are using your app. So you add an analytics system.

4. Then something breaks, and you remember that you need observability across the whole system. So you add a telemetry system.

And this is just a basic app.

5. The big problem is that all of the connections between these systems are unchecked. 

6. As you add systems, the number of places things can go wrong grows faster. And often, the only way to know when something breaks is to see it in production.

7. AI builds the stack faster. It doesn't make it smaller. Building faster just gets you into this mess sooner.

-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">02 · The Solution</div>
    <h2>One program on one engine.</h2>
  </div>
  <div class="grow">
    <div class="scopes">
      <figure class="scope" v-click="1">
        <figcaption>Today's Stack</figcaption>
        <div class="scope-canvas"><ScopeDiagram variant="today" /></div>
      </figure>
      <figure class="scope" v-click="2">
        <figcaption>Cambra</figcaption>
        <div class="scope-canvas"><ScopeDiagram variant="system" /></div>
      </figure>
    </div>
    <!-- The three pillars, and the only place all three sub-lines appear. The
         multipliers moved to Why It Wins, where the charts can carry them. -->
    <div class="pillars">
      <div v-click="3"><b>One program on one engine.</b> Not dozens of separate components.</div>
      <div v-click="4"><b>Proven before it runs.</b> The compiler checks your integrity and security rules end to end.</div>
      <div v-click="5"><b>Tested against a branch of production.</b> See the actual effect of deploying, without risking production.</div>
    </div>
    <p class="closer center" v-click="6">Ship fast. <span class="hot">Break nothing.</span></p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
0. Solving this problem requires rethinking the software stack we take for granted.

1. In the traditional stack, a program runs as a process inside of the operating system. The OS handles storage and communication, and we can plug in components to add capabilities.
The thing that checks whether or not our program makes sense is the compiler.
So this architecture makes it **impossible** for the compiler to check properties that reach outside of an OS process. That's the root cause of the problem.

2. So the solution is to take the program out of the box. In Cambra, a program is a *logical* description of the relationships between the different parts of your application. Cambra's runtime takes care of distributing it across machines, how data is stored, and how the various parts communicate.

3. With Cambra, you write your entire application as a single program, and it runs on a single engine. You don't have to wire together endless components.

4. The compiler checks the integrity and security of your program end-to-end.

5. The runtime lets you test new versions of your program against a branch of production, letting you get 100% fidelity without endangering live traffic.

6. So you get to ship with complete confidence.

-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">03 · The Insight</div>
    <h2>Agents converge on feedback.</h2>
  </div>
  <div class="grow">
    <div class="sdlc-canvas"><SdlcDiagram :stage="$clicks + 1" /></div>
    <div class="pillars compact">
      <div v-click="2"><b>Today</b> — types and unit tests early. All the important stuff late, with a human in the loop.</div>
      <div v-click="3"><b>Cambra</b> — end-to-end properties checked before deployment, no human required. 
        <div class="bm-tags" style="margin-left:9em">
            <span>Static Assertions</span>
            <span>Program Branching</span>
            <span>Transactional Hot Reload</span>
        </div>
      </div>
    </div>
    <div class="closer center" v-click="4">You can't bolt this on. <span class="warm">You have to design it in.</span></div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
0. The real impact of this shift manifests when agents are building your application. Consider the software development lifecycle.

1. The programmer writes some code, and compiles it. The compiler tells them if they did something that doesn't make sense. They write and run tests, which tells when the test cases have bugs.

2. But feedback on the most important properties — reliability, integrity, security, performance — is very limited until we deploy to a production-like environment: staging, load tests, audit logging, etc.
This feedback is slow and expensive. It often needs a human in the loop to ensure the tests are realistic and don't endanger production.

3. Cambra automates these feedback signals with groundbreaking features: static assertions, program branching, and transactional hot reload. That gets the human out of the loop, letting AI iterate unimpeded.

4. These features aren't something you can bolt on to an existing application platform. It's something you have to design in. Cambra is the only system built for it.

-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">04 · Why Now</div>
    <h2>Converging trends</h2>
  </div>
  <div class="grow">
    <div class="cols n3 trends">
      <div class="trend" v-click="1">
        <div class="metaphor cool"><div class="i-ph-users-three-fill"></div></div>
        <div class="col">
          <h3>Market opportunity</h3>
          AI coding is bottlenecked.
          <div class="col-body">
            <div align=center class="cool" style="padding: .6em">only <span style="font-size: 28pt; font-weight: bold;">24% </span> gains</div>
            <div class="stat-src"><i class="i-simple-icons-microsoft"></i> Microsoft</div>
            <QuoteCard
              class="mt-auto"
              reveal-on-expand
              expand-at="2"
              initials="PP"
              quote="&quot;…it was very, very brittle…&quot;"
              full-quote="&quot;There was this point at which the code [AI] had written had gotten to a complexity tipping point, and then suddenly everything past that felt like it was very, very brittle…&quot;"
              name="Polita Paulus"
              title="Sr. Principal Eng., Snowflake → Golden"
            />
          </div>
        </div>
      </div>
      <div class="trend" v-click="3">
        <div class="metaphor hot"><div class="i-ph-wall-fill"></div></div>
        <div class="col warm">
          <h3>Adoption barriers</h3>
          PL adoption is easy.
          <div class="col-body">
            <div class="flex" style="color: var(--amber); align-items: center"><div align=center style="font-weight: bold; line-height: 1; padding: 1em">535,000 lines<br>
                ———————<br>
                11 days</div> migrated</div>
            <div class="xlate">
              <span class="xlate-lang"><i class="i-simple-icons-zig"></i>Zig</span>
              <span class="xlate-arrow">&rarr;</span>
              <span class="xlate-lang"><i class="i-simple-icons-rust"></i>Rust</span>
            </div>
            <QuoteCard
              class="mt-auto"
              reveal-on-expand
              expand-at="4"
              initials="DS"
              quote="&quot;…the barrier to entry has substantially reduced.&quot;"
              full-quote="&quot;I don't know Go. I still write Go code, and […] it just doesn't matter what language it is. So the barrier to entry has substantially reduced.&quot;"
              name="David Schultz"
              title="Distinguished Eng., Snowflake → Anthropic"
            />
          </div>
        </div>
      </div>
      <div class="trend" v-click=5>
        <div class="metaphor"><img src="/brand/symbol.svg" alt="" /></div>
        <div class="col">
          <h3>Technical feasibility</h3>
            Research is pent up.
          <div class="col-body">
            <div class="converge-canvas"><ConvergeDiagram /></div>
          </div>
        </div>
      </div>
    </div>
    <div v-click="2"></div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
0. 3 trends make this the perfect moment for this kind of innovation.

1. First, the potential of AI has not yet been realized. A recent Microsoft study showed that adopting coding agents only increased productivity by 24%.

2. I recently had a conversation with a former colleague. She joined an analytics startup as its founding engineer. She found that their codebase reached a tipping point in complexity past which it was brittle and everything slowed down.

3. Second, historically, there were huge barriers to adopting new programming languages. Agents have completely demolished that barrier. A powerful example is the rewrite of Bun. They ported 500k lines of Zig to Rust, and it took less than 2 weeks. That would have been unthinkable a year ago. Now, they did it for the sake of agent productivity: Rust's compiler gives better feedback than Zig. My takeaway is that better languages make agents better, and agents let you adopt better languages easily.

4. I spoke with another colleague who is now at Anthropic, who said essentially the same thing: the barrier to entry has substantially reduced.

5. Third, brilliant research has been locked out of the market. AI has made it possible to synthesize this research into a product faster than ever before, from discovery, to understanding, to implementation. There's going to be a tidal wave of research going mainstream. We're just riding that wave.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">05 · Team</div>
    <h2>Passionate, clear-eyed experts</h2>
  </div>
  <div class="grow">
      <p>We're passionate about this problem. 
      <br>We have the right expertise. 
      <br>We're clear-eyed about the solution.</p>
      <br>
    <div class="cols" style="grid-template-columns:1fr 1fr 1fr">
      <TeamCard photo="/team/dan.jpg" name="Dan Sotolongo" role="Founder/CEO"
        :companies="['i-simple-icons-snowflake', 'i-simple-icons-google', 'i-simple-icons-twitter', 'Caltech']">
        <p>Co-created Dynamic Tables (w/o PM) — <strong>$100M+ ARR in 4 years</strong>. Worked on this problem his whole career.</p>
      </TeamCard>
      <TeamCard photo="/team/daniel.jpg" name="Daniel Mills" role="Co-founder"
        :companies="['i-simple-icons-snowflake', 'i-simple-icons-google', 'UW']">
        <p>Co-created Dynamic Tables &amp; Google Dataflow Streaming.</p>
      </TeamCard>
      <TeamCard photo="/team/skylar.jpg" name="Skylar Cook" role="Co-founder"
        :companies="['Datadog', 'Noom', 'Verily', 'Caltech']">
            <p><strong>Expert generalist.</strong> Distributed systems, developer infra, biotech at scale. </p>
      </TeamCard>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
Our team is world class. We each have over a decade of experience working on this problem from above and below.

I've organized my whole career around solving this problem. 

Daniel and I co-created Dynamic Tables at Snowflake, which grew into a $100M business over 4 years. Daniel co-created Google Dataflow Streaming. Skylar is our expert generalist, who has hit this problem from many different angles and knows developer infrastructure at scale.

We're the team you'd bet can solve this problem.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">06 · Market</div>
    <h2>&ldquo;Complex&rdquo; Applications</h2>
  </div>
  <div class="grow">
    <div class="cols n2 venn-row">
      <div class="venn-col">
        <div class="venn-head">Categories</div>
        <div class="venn-stage">
      <div class="venn">
        <div class="venn-note">Combined<br>valuations</div>
        <div class="venn-circle analytics" v-click="1"></div>
        <div class="venn-label analytics" v-click="1">
          <span class="vl-name">Analytics</span>
          <span class="vl-logos">
            <span class="vl-co"><i class="i-simple-icons-snowflake"></i>Snowflake</span>
            <span class="vl-co"><i class="i-simple-icons-databricks"></i>Databricks</span>
            <span class="vl-co"><i class="i-simple-icons-clickhouse"></i>ClickHouse</span>
          </span>
          <span class="vl-val">$300B</span>
          <span class="vl-growth">1.3&ndash;2&times; / yr</span>
        </div>
        <div class="venn-circle serving" v-click="2"></div>
        <div class="venn-label serving" v-click="2">
            <span class="vl-name">Serving<span class="vl-star">*</span></span>
          <span class="vl-logos">
            <span class="vl-co"><i class="i-simple-icons-vercel"></i>Vercel</span>
            <span class="vl-co"><i class="i-simple-icons-supabase"></i>Supabase</span>
            <span class="vl-co"><i class="vl-dot"></i>Render</span>
          </span>
          <span class="vl-val">$20B</span>
          <span class="vl-growth">2&ndash;3&times; / yr</span>
        </div>
        <div class="venn-circle durable" v-click="3"></div>
        <div class="venn-label durable" v-click="3">
          <span class="vl-name">Durable execution</span>
          <span class="vl-logos">
            <span class="vl-co"><i class="i-simple-icons-temporal"></i>Temporal</span>
            <span class="vl-co"><i class="vl-dot"></i>Inngest</span>
            <span class="vl-co"><i class="vl-dot"></i>Restate</span>
          </span>
          <span class="vl-val">$5B</span>
          <span class="vl-growth">5&times; / yr</span>
        </div>
        <svg class="venn-region convex" v-click="4" viewBox="0 0 315 299.59" aria-hidden="true">
          <path d="M157.50 18.18A100 100 0 0 1 199.60 108.89A100 100 0 0 0 115.40 108.88A100 100 0 0 1 157.50 18.18Z" />
        </svg>
        <div class="venn-lens serving-durable" v-click="4">
          <span class="vl-co"><i class="vl-dot"></i>Convex</span>
          <span class="vl-val">$110M <span class="vl-qual">raised</span></span>
        </div>
        <svg class="venn-region cambra" v-click="5" viewBox="0 0 315 299.59" aria-hidden="true">
          <path class="for-cat" d="M115.40 108.88A100 100 0 0 1 199.60 108.89A100 100 0 0 1 157.50 181.82A100 100 0 0 1 115.40 108.88Z" />
        </svg>
        <div class="venn-core" v-click="5"><img src="/brand/symbol.svg" alt="Cambra"></div>
      </div>
      </div>
      </div>
      <div class="beats">
        <p v-click="4"><span class="hot">Convex</span> unifies 2 categories.</p>
        <p class="closer" v-click="5">Only <span class="warm">Cambra</span> does all 3.</p>
      </div>
    </div>
  </div>
  <div class="venn-src">
      Last-priced valuations &middot; YoY revenue growth, rounded, Aug 2026. 
      <span v-click="1">Snowflake is a live market cap. Analytics growth covers Snowflake and Databricks.</span>
      <br>
      <span v-click="2"><span style="font-family: var(--f-logo)">*</span> Select independents only. Hyperscalers dominate the category. <br><span class="vl-dot vl-dot-inline"></span> do not disclose revenue.</span>
      
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
0. Cambra works at the intersection of 3 market categories.

1. Analytics is a behemoth with major incumbents like Snowflake, Databricks, and Clickhouse, cumulative valuations in the hundreds of billions, and annual growth between 30 and 80 percent.

2. Serving backend APIs is a huge business. We picked a few examples with a lot of momentum as representative of the use cases we would target. Their combined valuations is $20B, with a yearly growth rate of 2-3x.

3. Durable execution is a new category, but it's seeing explosive growth. Temporal is the dominant player, with a valuation of $5B 6 months ago, but rumored to be raising at $12B and growing at 5x.

4. Convex blends serving with durable execution. They're growth stage, so numbers aren't public, but they've raised $110M. They are positioning themselves as a new category: "Backend Application Platform".

5. Cambra is the only product that unifies all 3 categories. I would argue you're not a true backend application platform unless you do that.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">07 · Market</div>
    <h2>3 Categories, 1 market.</h2>
  </div>
  <div class="grow">
    <div class="cols n2 venn-row">
      <!-- The same three sets over a different population, so the figure is the
           same figure — only stripped. The companies and the valuations were
           facts about products; here the circles are drawn over customers, and
           .venn-col.segments moves them to k = 0.26. -->
      <div class="venn-col segments">
        <div class="venn-head">Segments</div>
        <div class="venn-stage" v-click="1">
          <div class="venn">
            <div class="venn-circle serving"></div>
            <div class="venn-label serving"><span class="vl-name">Serving</span></div>
            <div class="venn-circle durable"></div>
            <div class="venn-label durable"><span class="vl-name">Durable execution</span></div>
            <div class="venn-circle analytics"></div>
            <div class="venn-label analytics"><span class="vl-name">Analytics</span></div>
            <svg class="venn-region cambra" v-click="2" viewBox="0 0 315 299.59" aria-hidden="true">
              <path class="for-seg" d="M91.78 111.85A82.80 82.80 0 0 1 223.22 111.85A82.80 82.80 0 0 1 157.50 225.68A82.80 82.80 0 0 1 91.78 111.85Z" />
            </svg>
            <div class="venn-core" v-click="2"><img src="/brand/symbol.svg" alt="Cambra"></div>
          </div>
        </div>
      </div>
      <div class="beats">
        <p class="lead-p">Instead of counting <strong>products</strong>, <br>let's count <strong>customers</strong>.</p>
        <p v-click="1">Almost every app needs all three.</p>
        <p class="closer" v-click="2">Cambra's TAM is <span class="warm">software applications</span>.</p>
        <p v-click="3"><strong>Wedge ICP</strong>: teams <span class="hot">outgrowing their PaaS.</span></p>
      </div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
0. Those are the product categories, but the market segmentation looks very different.

1. In fact, most applications need to buy all 3 categories. But they've been kept separate because people think unifying them is impossible.

2. We disagree. Cambra unifies all 3 categories, and this market structure means our addressable market is something like "all software applications"— a gigantic market full of incumbents with structural limitations. A unified product stands to take the whole market—it's the iPhone to the cameras, GPSes, and dumb phones of software.

3. Of course, we're not chasing that right out of the gate. Our wedge hypothesis is to focus on teams who have outgrown their PaaS, and are about to adopt a durable execution framework or analytics stack.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">08 · Why It Wins</div>
    <h2>Unprecedented productivity</h2>
  </div>
  <div class="grow">
    <p class="lead-p">Cambra gives developers confidence and simplicity.</p>
    <div class="cols n2">
      <div class="col" v-click="1">
        <h3 class="disp">Confidence begets velocity</h3>
        <GhostBar
          title="Time to production"
          :segments="[
            { label: 'Code', value: 4, keep: 1, accent: 'warm' },
            { label: 'Review', value: 8, keep: 0.33 },
            { label: 'Test', value: 4, keep: 0.75, accent: 'warm' },
            { label: 'Deploy', value: 26, keep: 1 },
            { label: 'Operate', value: 3, keep: 1 },
          ]"
        />
        <p>
          <ul style="row-gap:0">
              <li><span class="cool"><strong>Review</strong></span> ⟸ static assertions, program branching</li>
              <li><span class="cool"><strong>Deploy</strong></span> ⟸ transactional hot reload</li>
              <li><span class="cool"><strong>Operations</strong></span> ⟸ native observability</li>
              <li><span class="warm"><strong>Code, Test</strong></span>  ⟸  time ~ LoC</li>
          </ul>
        </p>
      </div>
      <div class="col" v-click="2">
        <h3 class="disp">Less code, less mess</h3>
        <!-- TODO: tiers are too close. -->
        <GhostBar
          title="Lines of code"
          accent="warm"
          :tiers="3"
          :segments="[
            { label: 'Domain', value: 131, keep: 92 },
            { label: 'Serialization', value: 276, keep: 14 },
            { label: 'Schema', value: 110, keep: 22 },
            { label: 'Fault tolerance', value: 211, keep: 68 },
            { label: 'ETL', value: 167, keep: 8 },
            { label: 'Config &amp; infra', value: 490, keep: 48 },
          ]"
        />
        <p>Agent-built example app built on a conventional stack vs Cambra.</p>
      </div>
    </div>
    <p v-click="3" class="closer">Only with <span style="color:var(--coral)">Cambra</span> &mdash; <span style="color:var(--lagoon)">inaccessible</span> to frameworks.</p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
0. Why do we think we can win? It comes down to 2 things: programmer productivity and application performance. The productivity comes from confidence and simplicity.

1. Let's think through how long it takes to get a new feature into production. If have any experience with the development lifecycle, you'll know that most of that time is spent waiting. Waiting for review, waiting for release.
We spend all of that time because we don't have confidence in what was built.
Cambra's features give you the confidence to ship without waiting.
That gets you velocity.

2. The other piece is simplicity. The best way to save time is to do less work. When your work is coding, that means writing less code.
We had agents build an example application that incorporates serving, durable execution, and analytics on a conventional stack, and with Cambra. We categorized the lines of code, and compared the two codebases.
The result was a 5x reduction in total code. But what's interesting is where the savings happened: everything _except_ the domain logic, ranging from 3x savings to 20x.
Of course, this is just a random example. The numbers may change in the real world. But it provides early validation of our thesis.

3. The thing to realize is that these gains are only possible with Cambra's architecture. The conventional architecture is fundamentally unable to do it.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">09 · Why It Wins</div>
    <h2>Transformative performance</h2>
  </div>
  <div class="grow">
    <p v-click="2" class="lead-p">Deep abstractions fuse layers of the stack. Each layer fused nets major gains.</p>
    <div v-click="1" class="perf-col">
      <div class="stackint">
        <div class="si-axis">Layer</div>
        <div class="si-head" v-click="2">Depth of Abstraction</div>
        <div class="si-layers">
          <div class="si-layer">Application (Distributed)</div>
          <div class="si-layer">Database</div>
          <div class="si-layer">Operating System</div>
          <div class="si-layer">Hardware</div>
        </div>
        <div class="si-int viaduct" v-click="3"><span class="si-mult">10&times;</span><span class="si-name">Viaduct</span></div>
        <div class="si-int weld" v-click="4"><span class="si-mult">30&times;</span><span class="si-name">Weld</span></div>
        <div class="si-int hyper" v-click="5"><span class="si-mult">10&times;</span><span class="si-name">HyPer<br>Halide</span></div>
        <div class="si-int mojo" v-click="6"><span class="si-mult">50&times;</span><span class="si-name">Mojo</span></div>
        <div class="si-int cambra" v-click="7"><span class="si-mult">100&times;</span><span class="si-name">Cambra</span></div>
      </div>
    </div>
    <p v-click="8" class="closer">Only with <span style="color:var(--coral)">Cambra</span> &mdash; <span style="color:var(--lagoon)">inaccessible</span> to frameworks.</p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
0. Now let's talk about performance. We haven't tried optimizing the performance of our prototype yet, so I don't have real figures to show you. But we are very confident that Cambra will have shockingly good performance. That's because it's well known how to get good performance, and we've built Cambra in a way that we can apply _all_ of those techniques.

1. I'm going to get a bit philosophical. Please bear with me. Consider the computing stack we all know and love. You can think of tools as sitting on different layers of this stack. Users of the tool interact with the top surface of the tool, but the tools also have depth.

2. When a tool is deep, it fuses layers of the stack. When you get it right, fusing those layers net major performance gains.

3-5. I chose some specific examples that demonstrate pretty clearly what I mean: orders of magnitude of performance. Depending on the specific tool and the layers it fused, you get different gains. But generally, going deeper makes more gains available.

6. We learned from those other systems, building on their insights, and taking it further. By fusing the application layer into the rest of the stack, we believe we have the opportunity to yield multiple orders of magnitude of performance gains compared to conventional applications. These gains come from not doing work: skip the network by colocating related logic, skip the disk by caching aggressively, skip interpretation overhead by JIT compiling, skip unnecessary lookups by reordering joins. They're all well-known optimizations, but without a unified abstraction like Cambra, they've hit boundaries at the edge of an OS process.

##

-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">10 · Demo</div>
    <h2>The system as a program</h2>
  </div>
  <div class="grow">
    <div class="cols n2">
      <WasmDemo />
      <div style="display:flex;flex-direction:column;gap:.9rem">
        <h3 style="font-family:var(--f-mono);font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--fg-3)">A multi-domain app, wired by hand today</h3>
        <ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:.6rem">
          <li style="font-size:.85rem;color:var(--fg-2);display:flex;gap:.5rem"><span>—</span>Otherwise built from several off-the-shelf components</li>
          <li style="font-size:.85rem;color:var(--fg-2);display:flex;gap:.5rem"><span>—</span>Contract mismatches, across the seams</li>
          <li style="font-size:.85rem;color:var(--fg-2);display:flex;gap:.5rem"><span>—</span>Cross-component optimizations, left on the table</li>
          <li style="font-size:.85rem;color:var(--fg-2);display:flex;gap:.5rem"><span>—</span>Deployment risk — DB migrations, workflow versioning</li>
        </ul>
        <p class="punch" style="font-size:.9rem;margin-top:auto">Changed live, while it runs: <strong>code, data and in-flight work</strong> move in one transaction.</p>
      </div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
Purpose:
1. Demonstrate that we've implemented something real.
2. Give a concrete sense of the UX
3. Gesture at the opportunities available to tooling

Idea: Stock trading app with live ticker
- program selects a few symbols
- gets live ticker info from public APIs
- shopping cart of symbol purchases with **live** updating totals
- program is updated to add new symbols
- shopping cart state survives

Showcase:
- concise code
- fast app
- inspector features
- transparent program upgrade
- verification
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">11 · Traction</div>
    <h2>The thesis resonates.</h2>
  </div>
  <div class="grow">
    <div class="cols tl-split">
      <div class="tl-side">
        <h3>Timeline</h3>
        <div class="timeline-v">
        <div class="tlv-row cool"><span class="tlv-date">Feb</span><span class="tlv-dot"></span><span class="tlv-label">Cofounders join full-time</span></div>
        <div class="tlv-row cool"><span class="tlv-date">Apr</span><span class="tlv-dot"></span><span class="tlv-label"><strong>Announcement</strong> &middot; HN front page</span></div>
        <div class="tlv-row cool"><span class="tlv-date">Jun</span><span class="tlv-dot"></span><span class="tlv-label">CU PL/V group collaboration</span></div>
        <div class="tlv-row cool"><span class="tlv-date">Jul</span><span class="tlv-dot"></span><span class="tlv-label">Founding engineer accepts</span></div>
        <div class="tlv-row hot"><span class="tlv-date">Aug 10</span><span class="tlv-dot"></span><span class="tlv-label"><strong>OSS announcement</strong> &middot; Unsolicited contributor interest</span></div>
        <div class="tlv-row hot"><span class="tlv-date">Aug 17</span><span class="tlv-dot"></span><span class="tlv-label">Verification consultant starts</span></div>
      </div>
      </div>
      <div class="tl-stack">
        <div class="col">
            <h3>Votes of confidence</h3>
            <div class="col-body">
                Angels
                <ul>
                    <li>Snowflake co-founder</li>
                    <li>Redpanda CTO</li>
                </ul>
                Hiring
                <ul>
                    <li>100% offer acceptance (of 4)</li>
                    <li>Unsolicited talent inbound</li>
                </ul>
            </div>
        </div>
      </div>
    </div>
    <div class="col">
            <h3>Customer Validation</h3>
            <!-- TODO: add photos -->
            <div class="tl-quotes cols n2">
            <div class="col-body">
                <QuoteCard
                    initials="BJ"
                expand-at="0"
                    quote="&quot;That would be amazing.&quot;"
                    full-quote="&quot;I think that would be amazing. [...] My ideal model would be like, here's old. This is new. Do it. [...] If you're taking over hosting our backends, probably hundreds of thousands a year.&quot;"
                    name="Bryan Jadot"
                    title="Tech Lead, Nuvo"
                />
            </div>
            <div class="col-body">
                <QuoteCard
                    initials="AM"
                expand-at="0"
                    quote="&quot;...unify[ing] the logic for all this stuff would simplify it a ton.&quot"
                    full-quote="&quot;Unify[ing] the logic for all this stuff would simplify it a ton. [...] If I had one more engineer, it would give me less value than just being able to pay for this.&quot;"
                    name="Alan Menezes"
                    title="Director, Nvidia"
                />
            </div>
          </div>
        </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
We've been working at this full time for 7 months. In that time, we've made tremendous progress on our prototype, and are approaching our MVP faster than expected.

The reception of our thesis has also exceeded our expectations.
- Our announcement blog post made it to the front page of HN completely organically.
- The programming languages research group here at CU Boulder was eager to collaborate
- We've brought on 2 key engineers, and received unsolicited inbound. BTW, our acceptance rate is 100% (including cofounders).
- After our OSS announcement, we got unsolicited contributor inbound, eager to work for free (we said no for now).
- Our angels include a Snowflake co-founder and the Redpanda CTO.
- In our customer conversations, our product positioning has resonated. A tech lead at the growth-stage startup Nuvo said it would be amazing. A director at Nvidia said it would greatly simplify his stack, and be easy to justify the cost.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">12 · Business Model</div>
    <h2>OSS ⇒ Cloud Service ⇒ AI Services</h2>
  </div>
  <div class="grow">
    <div class="bm">
      <TierStack />
      <div class="bm-notes">
        <div class="bm-note tier-2" v-click="3">
          <div class="bm-tier">Value Added Services</div>
          <h3 class="bm-h">AI Development Platform</h3>
          <p>Only Cambra has the full context for AI to automate development.</p>
          <div class="bm-tags">
              <span>Experimentation</span>
              <span>User simulation</span>
              <span>Feature development</span>
          </div>
        </div>
        <div class="bm-note tier-1" v-click="2">
          <div class="bm-tier">Core revenue</div>
          <h3 class="bm-h">Hosted, distributed runtime</h3>
          <p>The easiest, cheapest way to run Cambra, from hobbyist to enterprise.</p>
        </div>
        <div class="bm-note tier-0" v-click="1">
          <div class="bm-tier">Open Source</div>
          <h3 class="bm-h">Compiler + runtime</h3>
          <p>Useful standalone. Builds trust, community, and sales pipeline.</p>
        </div>
      </div>
    </div>
    <p class="closer" v-click=4>G2M: Bottom-up for early viral growth. Later stages invert to top-down.</p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">13 · The Ask</div>
    <h2 style="font-family:var(--f-logo);font-size:2.6rem">$4M seed</h2>
    <div class="ask-sub">24 months to the Series A</div>
  </div>
  <div class="grow">
    <div class="ask-phases">
      <div class="ask-phase" style="--h:48%">
        <div class="ph"><span>OSS Core</span><span>months 0–6</span></div>
        <div class="amt">$0.6M<small>team of 6</small></div>
        <div class="deliv">Teams outgrowing their PaaS/BaaS reach for Cambra instead of a workflow engine and analytics stack.</div>
      </div>
      <div class="ask-phase" style="--h:69%">
        <div class="ph"><span>Cloud</span><span>months 6–18</span></div>
        <div class="amt">$1.8M<small>team of 8</small></div>
        <div class="deliv">The hosted runtime is <b class="cool">in production</b> with 3–5 paying design partners. Grow OSS community to prime sales funnel for launch.</div>
      </div>
      <div class="ask-phase warm" style="--h:100%">
        <div class="ph"><span>Grow</span><span>months 18–24</span></div>
        <div class="amt">$1.3M<small>team of 11</small></div>
        <div class="deliv">Raise the Series A on production usage, leaving six months of runway. Launch public Beta, freemium tier. Ramp up marketing.</div>
      </div>
    </div>
    <div class="ask-footer">
      <div><strong>Where it goes</strong> &middot; people 87% &middot; cloud + inference 7% &middot; legal, accounting, travel 6% &middot; plan $3.8M + reserve</div>
      <div><strong>Already in</strong> &middot; Snowflake co-founder &middot; Redpanda CTO &middot; SAFEs at a $20M cap</div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
One number, one sentence, three phases, one line of percentages. The spreadsheet is the
answer to the follow-up question, not the slide.

Back pocket (Seed Worksheet rev 2, 2026-09-03; vault: projects/seed-round/round-size.md):
- Monthly burn: $107K (months 0–6) → $153K (6–18) → $222K (18–24). Exit burn $222K/mo, 11 people.
- Headcount at 24 months: 3 founders, 7 engineers (Leon + Nick + 5 hires), 1 devrel (0.3 FTE from
  month 6). No recruiters — network hiring, extremely selective.
- Where it goes (post-close $3.81M): people $3.30M (87%), cloud + inference $0.27M (7%),
  legal/accounting/insurance $0.15M (4%), travel/misc $0.09M (2%). Founders at benchmark seed
  salaries; engineers priced senior.
- Reserve: ~$0.2M on top of the plan, plus the option to hold headcount flat at the month-18
  level during the raise (~$300K). Cloud credits (AWS Activate / Google for Startups) cover most
  of year-one infra.
- The month-18 milestone is what a Series A investor will argue about; the phase wording here
  is a draft for Dan to put in his own words.
- Nnamdi (08-19) asked for the headcount and runway math behind the ask — this is it.
-->

---

<div class="frame center">
  <div class="bg-glow" style="bottom:-16rem;left:-12rem;width:36rem;height:36rem;background:radial-gradient(circle,rgba(28,136,167,.2),transparent 70%)"></div>
  <div class="eyebrow">14 · Vision</div>
  <h2 style="font-size:2.6rem;max-width:22ch;margin-top:.6rem">The <strong class="hot">development</strong> platform.</h2>

  <p class="lead-p" style="font-size:1.05rem">Our platform accumulates the context AI needs to take over not just operations, but <strong>application development</strong>.</p>
  <div style="font-family:var(--f-mono);font-size:.7rem;color:var(--fg-3);margin-top:.6rem">cambra.dev · dan@cambra.dev</div>
</div>

<!--
When you extrapolate, Cambra's capabilities uniquely position it to take over application devolopment, in the same way that cloud platforms absorbed datacenter operations and application platforms absorbed software infra.
-->

---

<div class="frame center">
    <div class="eyebrow">
<h1> Appendix</h1></div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · Product &amp; Architecture</div>
    <h2>A language, not a framework.</h2>
  </div>
  <div class="grow">
    <p class="lead-p">Developers meet Cambra where they already are — through their coding agent, with the tools they expect. Then they deploy.</p>
    <div class="cols n3">
      <div class="col">
        <h3>Write</h3>
        <p>Your coding agent writes Cambra, the same way it writes anything else.</p>
      </div>
      <div class="col">
        <h3>Check</h3>
        <p>Compiler, tests and version control answer — the feedback loop developers already trust.</p>
      </div>
      <div class="col warm">
        <h3>Deploy</h3>
        <p>Ship to Cambra Cloud. <strong>Like Heroku — for the whole stack.</strong></p>
      </div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
Source, verbatim:

Product/architecture. Product: a programming language for your system.
OSS for single-instance runtime. Cloud for scaling, fault-tolerance,
production operations. (visual: programmer, laptop, cloud; cambra logo
in both)

Architecture:
- CHL: parser, LSP, package manager
- IR: compiler, optimizer
- Execution: Vectorized Dataflow + JIT
- Storage: off the shelf engines
(visual: draw in a stack. Bracket top half as PL, bottom half as DB)
(idea: Cambra is a chimera?)

The "Key features" bullets and performance precedents that followed
this section in the source doc are on the next slide (Why It Wins) —
split out because it was too dense for one slide.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · Under the Hood</div>
    <h2>What that language sits on.</h2>
  </div>
  <div class="grow">
    <div class="cols n2">
      <div>
        <div class="bracket"><span class="lbl">Language</span></div>
        <div class="stack">
          <div class="layer">
            <div class="k">CHL</div>
            <div class="t">Parser · LSP · package manager</div>
          </div>
          <div class="layer">
            <div class="k">IR</div>
            <div class="t">Compiler · optimizer</div>
          </div>
        </div>
        <div class="bracket db" style="margin-top:.5rem"><span class="lbl">Database</span></div>
        <div class="stack">
          <div class="layer db">
            <div class="k">Execution</div>
            <div class="t">Vectorized dataflow + JIT</div>
          </div>
          <div class="layer db">
            <div class="k">Storage</div>
            <div class="t">Off-the-shelf engines</div>
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:1.2rem">
        <div>
          <h3 style="font-family:var(--f-mono);font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--fg-3);margin:0 0 .6rem">How it ships</h3>
          <div class="pills">
            <div class="pill on">OSS — single-instance runtime</div>
            <div class="pill">Cloud — scaling, fault tolerance, prod ops</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
Split off the Product & Architecture slide, which now leads with how a
developer actually encounters Cambra. This is the implementation detail
behind it, for when someone asks.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · Feasibility Proofs</div>
    <h2>Every ingredient is already proven.</h2>
  </div>
  <div class="grow">
    <div class="precedents wide">
      <div class="prec"><div class="x">10×</div><div class="d">HyPer — JIT compilation vs. interpretation</div></div>
      <div class="prec"><div class="x">30×</div><div class="d">Weld — one IR unifying NumPy &amp; Pandas</div></div>
      <div class="prec"><div class="x">10×</div><div class="d">Halide — vs. hand-optimized CUDA</div></div>
      <div class="prec"><div class="x">50×</div><div class="d">Mojo — on unmodified Python code</div></div>
    </div>
    <div class="cols n2">
      <div class="col">
        <h3>Database implementation matured</h3>
        <div class="pills">
          <div class="pill cool">columnar</div>
          <div class="pill cool">vectorized</div>
          <div class="pill cool">JIT</div>
          <div class="pill cool">IVM</div>
        </div>
      </div>
      <div class="col warm">
        <h3>PL techniques untapped at this scale</h3>
        <div class="pills">
          <div class="pill warm">type systems</div>
          <div class="pill warm">verification</div>
          <div class="pill warm">semantics</div>
        </div>
      </div>
    </div>
    <p class="lead-p">Each of these was met with the same skepticism, and each won: <strong>C over assembly</strong>, <strong>the relational database over hand-rolled storage</strong>, <strong>Mojo over PyTorch, CUDA and ROCm</strong>.</p>
    <p class="closer">The pieces are proven. Cambra is the first to put them behind <span class="hot">one language.</span></p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
Source, verbatim:

- Precedents:
  - HyPer got 10× from JIT compilation vs interpretation
  - Weld got 30× from creating a unified IR for Numpy & Pandas
  - Halide got 10× from optimizing GPU compute vs *hand-optimized CUDA*
  - Mojo got 50× on unmodified Python code

Technical Comparables (is this even interesting? probably not, spend
minimal time on it):
- C vs ASM
- DBs
- new: Mojo vs (PyTorch, CUDA, ROCm, etc)

(Moved off the Why It Wins slide, where the precedents read as though
they applied to both columns. Kept here as the answer to technical
skepticism rather than as a claim in the main line.)
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · Ideal Customer Profile</div>
    <h2>Developers outgrowing their PaaS</h2>
  </div>
  <div class="grow">
    <div class="cols n2">
      <div class="col">
        <h3>Who adopts first</h3>
        <ul>
          <li>Mid-size, high-growth — technical risk they can take, no time to build their own infra</li>
          <li>Care about correctness (B2B, retail, finance) — not heavily regulated</li>
          <li>Heavy AI coding usage already</li>
          <li>High operational burden from stack fragmentation</li>
        </ul>
      </div>
      <div style="display:flex;flex-direction:column;gap:.8rem">
        <h3 style="font-family:var(--f-mono);font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--fg-3);margin:0">About to pick up</h3>
        <div class="cols n3">
          <div class="col warm" style="padding:.8rem"><div class="vlogo i-simple-icons-supabase"></div><h3 style="font-family:var(--f-disp);text-transform:none;font-size:.9rem;color:var(--fg);letter-spacing:0">Supabase</h3><p style="font-size:.72rem">Not extensible, not scalable</p></div>
          <div class="col warm" style="padding:.8rem"><div class="vlogo i-simple-icons-temporal"></div><h3 style="font-family:var(--f-disp);text-transform:none;font-size:.9rem;color:var(--fg);letter-spacing:0">Temporal</h3><p style="font-size:.72rem">Non-determinism, replay issues</p></div>
          <div class="col warm" style="padding:.8rem"><div class="vlogo-pair"><div class="vlogo i-simple-icons-apachekafka"></div><div class="vlogo i-simple-icons-clickhouse"></div></div><h3 style="font-family:var(--f-disp);text-transform:none;font-size:.85rem;color:var(--fg);letter-spacing:0">Kafka + Clickhouse</h3><p style="font-size:.72rem">Impedance mismatch</p></div>
        </div>
        <p class="punch" style="font-size:.85rem">Expansion: more of the stack in Cambra creates a network effect — super-linear productivity gains within a codebase.</p>
      </div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
Source, verbatim:

Frame the wedge market narrowly (who adopts first and why) before the
expansive TAM. Seed investors have seen enough "$500B market" slides to
discount them; a credible wedge (e.g., teams currently gluing
Postgres+Kafka+dbt) followed by expansion logic reads as more
sophisticated. [Note: that Postgres+Kafka+dbt example isn't otherwise
used in the deck — consider it as an alternate/additional "unhappily
using" card.]

Wedge:
- mid size, high growth tech companies
  - mid size ⟹ willing to take more technical risk than nascent firms
  - high growth ⟹ don't have time to build their own infra
  - tech ⟹ sophisticated enough to understand the opportunity of a new
    approach
- care about correctness (e.g. B2B, retail, finance), but not heavily
  regulated
- heavy AI coding usage
- unhappily using:
  - supabase: not extensible, scalable
  - temporal: non-determinism & replay issues
  - kafka + clickhouse/duckdb: impedance mismatch
- high operational burden from stack fragmentation

Early Expansion: delivering on productivity promise leads to adoption
by adjacent workloads. Cambra creates a network effect within a
codebase: having more of the stack in Cambra leads to super-linear
gains in productivity.

Late Expansion (NOT currently on the slide — add if there's room):
Cambra builds a suite of AI-powered features to accelerate application
development: operational monitoring & mitigation, application metrics,
an experimentation framework, automated workload simulation.

ICP (from "Random ideas" section — overlaps with the above, plus one
item not otherwise captured):
- technical enough to understand the opportunity
- focused enough to not want to build their own infra
- feeling the pain of fragmentation in their stack
- able to make tech adoption decisions
Firmographics: mid size, high growth tech companies.
Technographics: Supabase?, Temporal, Clickhouse.
Pain points: heterogeneous domains (serving, durable execution,
analytics), high operational burden from stack fragmentation,
requirements around auth policy (?) [not elaborated in source — flag as
open question], heavy AI coding usage.
-->
