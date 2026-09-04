---
theme: default
title: Cambra — Seed Round
colorSchema: dark
---

<div class="frame" style="justify-content:flex-start;padding-top:4.5rem">
  <img class="title-wordmark" src="/brand/logo-horizontal-negative.svg" alt="Cambra">
  <h1 style="font-size:3.4rem;margin:0">Ship at the pace of AI</h1>
  <p class="punch" style="margin-top:.6rem">
      The <strong>application platform</strong> for
        <br>• 10× productivity 
        <br>• 100× performance
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
    <h2>System Fragmentation</h2>
  </div>
  <div class="grow">
    <div class="grow split">
        <div class="diagram-stack">
          <div class="diagram-canvas">
            <SystemDiagram :stage="$clicks" />
          </div>
          <div class="flow-note" v-click="5">Each arrow multiplies complexity</div>
        </div>
        <div class="beats arc" v-click="6">
            <div>You ship fast.</div>
            <div>Then you slow down.</div>
            <div class="hot">Then production breaks.</div>
        </div>
    </div>
    <p class="closer center" v-click="7">
        <span>AI doesn't fix this <span class="hot">— it makes it worse.</span></span></p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
0. The problem we're solving is the fragmentation of software systems.

1. When you're building a software application, you almost always start with the 3-tier architecture: a database, a server, and a client.

2. Unfortunately, that architecture lasts about 15 minutes. You need background tasks. You need a system for that.

3. You need analytics. You need a system for that.

4. You need to know if something is broken. You need a system for that.

And this is just a basic app.

5. The big problem is that system complexity quadratically as you add components.

6. In practice, things are fine at first, but then development slows, performance crawls, and reliability falls.

7. AI doesn't fix this. It makes it worse. It lets you build faster. But that just gets you in this mess sooner.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">02 · The Solution</div>
    <h2>A platform for coherent systems</h2>
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
    <div></div>
    <div class="closer" v-click="3">
        With Cambra, building complex apps is <span class="cool">simple</span>.
    </div>
    <div class="closer" v-click="4">
        You get 10× <span class="warm">productivity</span>.
    </div>
    <div class="closer" v-click="5">
        Your app gets 100× <span class="hot">performance</span>.
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
0. Solving this problem requires rethinking the stack of tools we take for granted.

1. In the traditional stack, a program runs as a process inside of the operating system. The OS mediates communication with storage and other programs.
This architecture implies that programming languages, which are the best tool developers have to wrangle complexity, **cannot** solve problems that reach outside of an OS process.

2. In Cambra, a program is a *logical* description of the relationships between the different parts of your application. Cambra takes care of distributing it across machines, how data is stored, and how the various parts communicate.

3. We make building complex apps simple.

4. You get a huge productivity boost.

5. Your app gets a massive performance boost.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">03 · The Insight</div>
    <h2>Automated feedback unleashes AI.</h2>
  </div>
  <div class="grow">
    <div class="sdlc-canvas"><SdlcDiagram :stage="$clicks + 1" /></div>
    <div class="closer center" v-click="4">Only <span class="warm">Cambra</span> can do this.</div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
0. The software development lifecycle involves the following steps. Each of these steps happens in a loop, where feedback from each step informs the next iteration of the code.

1. Programming languages give excellent feedback. They help us structure our programs with syntax and types, and tests reproduce bugs.

2. But feedback on the most important properties — reliability, integrity, security, performance — is very limited until we deploy to a production-like environment: staging, load tests, audit logging, etc.
This feedback needs a human in the loop to ensure the tests are realistic and don't risk production.

3. Cambra makes it possible to automate these feedback signals, moving them earlier in the lifecycle. Our type system checks integrity and security requirements automatically. And our runtime makes realistic testing trivial. That gets the human out of the loop, letting AI iterate unimpeded.

4. These features aren't something you can bolt on to an existing development platform. It's something you have to design in. Cambra is the only system built for it.
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
            New things are possible.
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

1. We all know AI coding has massive potential. But that potential has not yet been realized. A recent Microsoft study showed that adopting coding agents only increased productivity by 24%.

2. I recently had a conversation with a respected former colleague who joined an analytics startup as its founding engineer, and her experience supports this. Their codebase reached a tipping point in complexity past which it was brittle and everything slowed down.

3. Historically, there were huge barriers to adopting new programming languages. Agents have completely demolished that barrier. A powerful example is the migration of Bun from Zig to Rust, which ported 500k lines over 11 days with light human supervision. This would have been unthinkable a year ago. Now, it was done in pursuit of agent productivity: Rust gives better feedback than Zig. That's Cambra's thesis in action at large scale.

4. I spoke with another respected colleague who is now at Anthropic, who said essentially the same thing: the barrier to entry has substantially reduced.

5. While these adoption barriers have existed, major innovations developed in academia have been kept out of the market. Those are ripe for the picking. Cambra weaves together numerous threads of cutting edge research into a groundbreaking product. AI makes it possible to do this work with a tiny team, faster than ever, and with minimal coordination overhead.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">05 · Demo</div>
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
    <div class="eyebrow">06 · Team</div>
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

I've organized the last 10 years of my career around solving this problem. 

Daniel and I co-created Dynamic Tables at Snowflake, which grew into a $100M business over 4 years. Daniel co-created Google Dataflow Streaming. Skylar is our expert generalist, who has hit this problem from many different angles and knows developer infrastructure at scale.

We're the team you'd bet can solve this problem.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">07 · Traction</div>
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
    <div class="eyebrow">08 · Market</div>
    <h2>Complex Applications</h2>
  </div>
  <div class="grow">
    <div class="cols n2" style="align-items:center">
      <div class="venn-col">
        <div class="venn-head">Categories</div>
        <div class="venn-stage">
      <div class="venn">
        <div class="venn-note">Combined<br>valuations</div>
        <div class="venn-circle serving" v-click="2"></div>
        <div class="venn-circle durable" v-click="3"></div>
        <div class="venn-circle analytics" v-click="1"></div>
        <div class="venn-label serving" v-click="2">
            <span class="vl-name">Serving<span style="font-family: var(--f-logo)">*</span></span>
          <span class="vl-logos">
            <span class="vl-co"><i class="i-simple-icons-vercel"></i>Vercel</span>
            <span class="vl-co"><i class="i-simple-icons-supabase"></i>Supabase</span>
            <span class="vl-co"><i class="vl-dot"></i>Render</span>
          </span>
          <span class="vl-val">$20B</span>
          <span class="vl-growth">2&ndash;3&times; / yr</span>
        </div>
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
        <div class="venn-lens serving-durable" v-click="4">
          <span class="vl-co"><i class="vl-dot"></i>Convex</span>
          <span class="vl-val">$110M <span class="vl-qual">raised</span></span>
        </div>
        <div class="venn-core" v-click="6"><img src="/brand/symbol.svg" alt="Cambra"></div>
      </div>
      </div>
      </div>
      <div class="beats">
        <p class="lead-p" v-click="5">Most applications need all 3.</p>
        <p class="closer" v-click="6">Only <span class="warm">Cambra</span> is at the intersection.</p>
        <p v-click="7"><strong>ICP</strong>: teams <span class="hot">outgrowing their PaaS.</span></p>
      </div>
    </div>
  </div>
  <div class="venn-src">
      <span style="font-family: var(--f-logo)">*</span> Serving covers the leading independents &mdash; hyperscalers hold most of that market. 
    <br>Last-priced valuations &middot; YoY revenue growth, rounded, Aug 2026. Snowflake is a live market cap. Analytics growth covers Snowflake and Databricks. 
    <br><span class="vl-dot vl-dot-inline"></span> do not disclose revenue.
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
0. Cambra works at the intersection of 3 market categories.

1. Analytics is a behemoth with major incumbents like Snowflake, Databricks, and Clickhouse, cumulative valuations in the hundreds of billions, and annual growth between 30 and 80 percent.

2. Serving backend APIs is a huge business. We chose a few platforms as a service with a lot of momentum as representative of the use cases we would target. Their combined valuations is $20B, with a yearl growth rate of 2-3x.

3. Durable execution is a new category, but it's seeing explosive growth. Temporal is the dominant player, with a last-raise valuation of $5B, but rumored to be raising at $12B and growing at 5x.

4. An interesting case study is Convex, which is something like a PaaS with durable execution. They're growth stage, so numbers aren't public, but they've raised $100M. They have clear traction based on the premise of unifying two categories.

5. In fact, most applications need one component from all 3 categories. But there's a reason these are separate: building a system that spans them is traditionally regarded as impossible. 

6. Cambra rejects that contention, and our prototype proves out many of the core pieces. We will serve all 3 categories. And once we do, we'll have access to a gigantic market full of incumbents with structural limitations.

7. Our wedge hypothesis is teams who have outgrown their PaaS, and are about to adopt into a new technology.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">09 · Why It Wins</div>
    <h2>Unprecedented productivity</h2>
  </div>
  <div class="grow">
    <p class="lead-p">Cambra gives developers confidence and simplicity.</p>
    <div class="cols n2">
      <div class="col">
          <!-- TODO: change header style to be distinct from ghost bar header. -->
        <h3>Confidence begets velocity</h3>
        <!-- TODO: redesign the ghost bar diagram to have 2 separate bars, one above and one below. The labels sit between the bars, with lines connecting teh respective sections. The overall multiplier sits in the empty space next to the lower bar.
        Keep the blue coloring for "time to production", but make the code and test segments orange. Then change the "lines of code" bars to orange, since they're a proxy for that multiplier. -->
        <GhostBar
          title="Time to production"
          :segments="[
            { label: 'Code', value: 4, keep: 1 },
            { label: 'Review', value: 8, keep: 0.33 },
            { label: 'Test', value: 4, keep: 0.75 },
            { label: 'Deploy', value: 26, keep: 1 },
            { label: 'Operate', value: 3, keep: 1 },
          ]"
        />
        <p>Estimates of Cambra's verification and validation features.</p>
      </div>
      <div class="col">
        <h3>Less code, less mess</h3>
        <GhostBar
          title="Lines of code"
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
        <p>Agent-built app built on a conventional stack vs Cambra.</p>
      </div>
    </div>
    <p class="closer">Only with <span style="color:var(--coral)">Cambra</span> &mdash; <span style="color:var(--lagoon)">inaccessible</span> to frameworks.</p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">10 · Why It Wins</div>
    <h2>Transformative performance</h2>
  </div>
  <div class="grow">
    <p class="lead-p">Deep abstractions fuse layers of the stack. Each layer nets ~10× gains.</p>
    <!-- TODO:  Take the diagram out of the col container.  -->
    <div class="col warm perf-col">
      <div class="stackint">
          <!-- TODO: Make the layers look more like layers, and less like boxes. center the text. -->
          <!-- TODO:  Add a vertical label on the left saying "layer".  -->
        <div class="si-layer">Distributed systems</div>
        <div class="si-layer">Database</div>
        <div class="si-layer">Operating System</div>
        <div class="si-layer">Hardware</div>
        <!-- TODO:  Add a heading over the brackets "Depth of Abstraction"  -->
        <div class="si-int weld" v-click="1"><span class="si-mult">30&times;</span><span class="si-name">Weld</span></div>
        <div class="si-int hyper" v-click="2"><span class="si-mult">10&times;</span><span class="si-name">HyPer<br>Halide</span></div>
        <div class="si-int mojo" v-click="3"><span class="si-mult">50&times;</span><span class="si-name">Mojo</span></div>
        <div class="si-int cambra" v-click="4"><span class="si-mult">100&times;</span><span class="si-name">Cambra</span></div>
      </div>
    </div>
    <p class="closer">Only with <span style="color:var(--coral)">Cambra</span> &mdash; <span style="color:var(--lagoon)">inaccessible</span> to frameworks.</p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
Cambra wins because using it yields unparalleled productivity and performance gains.

These gains are enabled by the way Cambra spans every layer of the backend stack.

## Unprecedented productivity

### Ship in hours:
  - actual delivery of code is bottlenecked on *waiting for confidence*.
  - Cambra meaningfully accelerates coding and testing
  - the biggest gains come from having the confidence to not wait for code review and slow releases
  - these come from:
    1. our verification features, which provide hard guarantees about security and integrity
    2. our validation features, which ensure performance and reliability are robust through upgrades.

### Lines of Code


## Transformative performance
  - scalability: automatic parallelization & distribution
    (caching)
  - Precedents:
    - HyPer got 10× from JIT compilation vs interpretation
    - Weld got 30× from creating a unified IR for Numpy & Pandas
    - Halide got 10× from optimizing GPU compute vs *hand-optimized CUDA*
    - Mojo got 50× on unmodified Python code

##

-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">11 · Business Model</div>
    <h2>Cloud Runtime ⇒ Self-building Apps</h2>
  </div>
  <!-- TODO: Animate from OSS to VAS, one step each. -->
  <div class="grow">
    <div class="bm">
      <TierStack />
      <div class="bm-notes">
        <div class="bm-note tier-2">
          <div class="bm-tier">Value Added Services</div>
          <h3 class="bm-h">Self-building Apps</h3>
          <p>Upsell features for AI to build apps automatically.</p>
          <div class="bm-tags"><span>User simulation</span><span>Feature development</span><span>Experimentation</span></div>
        </div>
        <div class="bm-note tier-1">
          <div class="bm-tier">Core revenue</div>
          <h3 class="bm-h">Hosted, distributed runtime</h3>
          <p>Teams pay for ease of operations and enterprise features.</p>
        </div>
        <div class="bm-note tier-0">
          <div class="bm-tier">Open Source</div>
          <h3 class="bm-h">Compiler + runtime</h3>
          <p>Useful for real workloads. Creates community and sales pipeline.</p>
        </div>
      </div>
    </div>
    <p class="closer">Only Cambra has the full context that AI needs.</p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>

<!--
The closer states the context argument; the payoff after "so AI can…" is still
yours to finish — I did not want to invent the capability.
-->

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">12 · The Ask</div>
    <h2 style="font-family:var(--f-logo);font-size:2.6rem">$4M seed</h2>
    <div class="ask-sub">24 months to the Series A</div>
  </div>
  <div class="grow">
    <div class="ask-phases">
      <div class="ask-phase">
        <div class="ph"><span>OSS Core</span><span>months 0–6</span></div>
        <div class="amt">$0.6M<small>team of 6</small></div>
        <div class="deliv">Teams outgrowing their PaaS/BaaS reach for Cambra instead of a workflow engine and analytics stack.</div>
      </div>
      <div class="ask-phase">
        <div class="ph"><span>Cloud</span><span>months 6–18</span></div>
        <div class="amt">$1.8M<small>team of 8</small></div>
        <div class="deliv">The hosted runtime is in production with 3–5 paying design partners.</div>
      </div>
      <div class="ask-phase warm">
        <div class="ph"><span>Grow</span><span>months 18–24</span></div>
        <div class="amt">$1.3M<small>team of 11</small></div>
        <div class="deliv">Raise the Series A on production usage, leaving six months of runway.</div>
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
  <div class="eyebrow">13 · Vision</div>
  <h2 style="font-size:2.6rem;max-width:22ch;margin-top:.6rem">In five years, Cambra is the default way to start and scale software applications.</h2>

  <p class="lead-p" style="font-size:1.05rem">Engineers use agents on Cambra to develop applications with 10× the productivity and 100× the performance of other platforms. They can't even imagine going back to their old tools.</p>
  <div style="font-family:var(--f-mono);font-size:.7rem;color:var(--fg-3);margin-top:.6rem">cambra.dev · dan@cambra.dev</div>
</div>

<!--
Source, verbatim:

Vision (close). Zoom back out — what does the world look like in 5
years if Cambra wins. This is the slide people remember; end on
ambition, not logistics.

The source doc doesn't supply actual vision wording — everything on
this slide is a drafted first pass, explicitly flagged for rewriting in
Dan's own words.
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
    <h2>Miserable Temporal Users</h2>
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
        <h3 style="font-family:var(--f-mono);font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--fg-3);margin:0">Unhappily using</h3>
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
