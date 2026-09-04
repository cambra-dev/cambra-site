---
theme: default
title: Cambra — Teaser
colorSchema: dark

---

<div class="frame" style="justify-content:flex-start;padding-top:4.5rem">
  <img class="title-wordmark" src="/brand/logo-horizontal-negative.svg" alt="Cambra">
  <h1 style="font-size:3.4rem;margin:0">Ship at the pace of AI</h1>
  <p class="punch" style="margin-top:.6rem">
      An <strong>application platform</strong> for<br>
          • 10× productivity 
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
---

<div class="frame">
  <div class="head">
    <div class="eyebrow">03 · The Insight</div>
    <h2>Automated feedback unleashes AI.</h2>
  </div>
  <div class="grow">
    <div class="sdlc-canvas"><SdlcDiagram :stage="3" fixed /></div>
    <div class="closer center">Today a <span class="hot">human</span> closes the loop.</div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>
---

<div class="frame">
  <div class="head">
    <div class="eyebrow">03 · The Insight</div>
    <h2>Automated feedback unleashes AI.</h2>
  </div>
  <div class="grow">
    <div class="sdlc-canvas"><SdlcDiagram :stage="4" fixed /></div>
    <div class="closer center">Only <span class="warm">Cambra</span> can do this.</div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>
---

<div class="frame">
  <div class="head">
    <div class="eyebrow">04 · Why Now</div>
    <h2>Converging trends</h2>
  </div>
  <div class="grow">
    <div class="cols n3 trends" style="min-height: 16rem">
      <div class="trend" v-click="1">
        <div class="metaphor cool"><div class="i-ph-users-three-fill"></div></div>
        <div class="col">
          <h3>Market opportunity</h3>
          AI coding is bottlenecked.
          <div class="col-body">
            <div align=center class="cool" style="padding: .6em">only <span style="font-size: 28pt; font-weight: bold;">24% </span> gains</div>
          </div>
        </div>
      </div>
      <div class="trend" v-click="2">
        <div class="metaphor hot"><div class="i-ph-wall-fill"></div></div>
        <div class="col warm">
          <h3>Adoption barriers</h3>
          PL adoption is easy.
          <div class="col-body">
            <div class="flex" style="color: var(--amber); align-items: center"><div align=center style="font-weight: bold; line-height: 1; padding: 1em">535,000 lines<br>
                ———————<br>
                11 days</div> migrated</div>
          </div>
        </div>
      </div>
      <div class="trend" v-click="3">
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
    
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>
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
        <!-- TODO: use correct logo fonts for word logos -->
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
---

<div class="frame">
  <div class="head">
    <div class="eyebrow">06 · Market</div>
    <h2>Complex Applications</h2>
  </div>
  <div class="grow">
    <div class="cols n2" style="align-items:center">
      <div class="venn-col">
        <div class="venn-head">Categories</div>
        <div class="venn-stage">
      <div class="venn">
        <div class="venn-note">Combined<br>valuations</div>
        <div class="venn-circle serving"></div>
        <div class="venn-circle durable"></div>
        <div class="venn-circle analytics"></div>
        <div class="venn-label serving">
            <span class="vl-name">Serving<span style="font-family: var(--f-logo)">*</span></span>
          <span class="vl-logos">
            <span class="vl-co"><i class="i-simple-icons-vercel"></i>Vercel</span>
            <span class="vl-co"><i class="i-simple-icons-supabase"></i>Supabase</span>
            <span class="vl-co"><i class="vl-dot"></i>Render</span>
          </span>
          <span class="vl-val">$20B</span>
          <span class="vl-growth">2&ndash;3&times; / yr</span>
        </div>
        <div class="venn-label durable">
          <span class="vl-name">Durable execution</span>
          <span class="vl-logos">
            <span class="vl-co"><i class="i-simple-icons-temporal"></i>Temporal</span>
            <span class="vl-co"><i class="vl-dot"></i>Inngest</span>
            <span class="vl-co"><i class="vl-dot"></i>Restate</span>
          </span>
          <span class="vl-val">$5B</span>
          <span class="vl-growth">5&times; / yr</span>
        </div>
        <div class="venn-label analytics">
          <span class="vl-name">Analytics</span>
          <span class="vl-logos">
            <span class="vl-co"><i class="i-simple-icons-snowflake"></i>Snowflake</span>
            <span class="vl-co"><i class="i-simple-icons-databricks"></i>Databricks</span>
            <span class="vl-co"><i class="i-simple-icons-clickhouse"></i>ClickHouse</span>
          </span>
          <span class="vl-val">$300B</span>
          <span class="vl-growth">1.3&ndash;2&times; / yr</span>
        </div>
        <div class="venn-lens serving-durable">
          <span class="vl-co"><i class="vl-dot"></i>Convex</span>
          <span class="vl-val">$110M <span class="vl-qual">raised</span></span>
        </div>
        <div class="venn-core"><img src="/brand/symbol.svg" alt="Cambra"></div>
      </div>
      </div>
      </div>
      <div class="beats">
        <p class="lead-p">Most applications need all 3.</p>
        <p class="closer">Only <span class="warm">Cambra</span> is at the intersection.</p>
        <p><strong>ICP</strong>: teams <span class="hot">outgrowing their PaaS.</span></p>
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
---

<div class="frame">
  <div class="head">
    <div class="eyebrow">07 · The Ask</div>
    <h2 style="font-family:var(--f-logo);font-size:2.6rem">$4M seed</h2>
    <div class="ask-sub">24 months to the Series A</div>
  </div>
  <div class="grow">
    <div class="ask-phases">
      <div class="ask-phase">
        <div class="ph"><span>OSS Core</span><span>months 0–6</span></div>
        <div class="amt">$0.6M<small>team of 6</small></div>
        <div class="deliv">Program branching ships. The durable-execution wedge is live in open source with our first design partners.</div>
      </div>
      <div class="ask-phase">
        <div class="ph"><span>Cloud</span><span>months 6–18</span></div>
        <div class="amt">$1.8M<small>team of 8</small></div>
        <div class="deliv">The distributed runtime is in production with 3–5 paying design partners.</div>
      </div>
      <div class="ask-phase warm">
        <div class="ph"><span>Grow</span><span>months 18–24</span></div>
        <div class="amt">$1.3M<small>team of 11</small></div>
        <div class="deliv">Raise the Series A on production usage, with six months of runway held for it.</div>
      </div>
    </div>
    <div class="ask-footer">
      <div><strong>Where it goes</strong> &middot; people 87% &middot; cloud + inference 7% &middot; legal, accounting, travel 6% &middot; plan $3.8M + reserve</div>
      <div><strong>Already in</strong> &middot; Snowflake co-founder &middot; Redpanda CTO &middot; SAFEs at a $20M cap</div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage - 1 }} / {{ $slidev.nav.total - 1 }}</div>
</div>
