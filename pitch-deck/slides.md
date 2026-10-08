---
theme: default
title: Cambra — Seed Round
colorSchema: dark
---

<div class="frame" style="justify-content:flex-start;padding-top:4.5rem">
  <img class="title-wordmark" src="/brand/logo-horizontal-negative.svg" alt="Cambra">
  <h1 style="font-size:3.4rem;margin:0">Agent Heaven is an App Platform</h1>
  <p class="punch" style="margin-top:.6rem">
      Build agents that live forever and evolve safely, on a platform that compounds in value as you grow.
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
    <div class="eyebrow">{{ $slidev.nav.currentPage }} · The Problem</div>
    <h2>Your stack unravels in a month.</h2>
  </div>
  <div class="grow">
    <div class="grow split">
        <div class="diagram-stack">
          <!-- The clock names the protagonist and the pace: an engineer with a coding agent, six weeks, not six years. -->
          <div class="when">
            <span v-click="1"><b>Day 1</b> the agent</span>
            <span v-click="2"><b>Week 2</b> durable runs</span>
            <span v-click="3"><b>Week 4</b> evals</span>
            <span v-click="4"><b>Week 6</b> governance</span>
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
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">{{ $slidev.nav.currentPage }} · The Solution</div>
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
    <div class="pillars">
      <div v-click="3"><b>One program on one engine.</b> Not dozens of separate components.</div>
      <div v-click="4"><b>Proven before it runs.</b> The compiler checks your integrity and security rules end to end.</div>
      <div v-click="5" class="beat-ember"><b>Change it while it runs.</b> The new version takes over with its state intact, checked by the compiler.</div>
      <div v-click="6" class="beat-ember"><b>Tested against a branch of production.</b> See the actual effect of deploying, without risking production.</div>
    </div>
    <p class="closer center" v-click="7">Ship fast. <span class="hot">Break nothing.</span></p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">{{ $slidev.nav.currentPage }} · Why Now</div>
    <h2>Mutually reinforcing trends</h2>
  </div>
  <div class="grow">
    <div class="cols n3 trends">
      <div class="trend">
        <div class="metaphor cool"><div class="i-ph-users-three-fill"></div></div>
        <div class="col">
          <h3>Huge Market opportunity</h3>
          <div class="trend-lead">AI coding is bottlenecked.</div>
          <div class="col-body">
            <div align=center class="cool" style="padding: .6em">only <span style="font-size: 28pt; font-weight: bold;">24% </span> gains</div>
            <div class="stat-src"><i class="i-simple-icons-microsoft"></i> Microsoft</div>
            <QuoteCard
              class="mt-auto"
              reveal-on-expand
              expand-at="1"
              initials="PP"
              photo="/quotes/pp.jpg"
              quote="&quot;…it was very, very brittle…&quot;"
              full-quote="&quot;There was this point at which the code [AI] had written had gotten to a complexity tipping point, and then suddenly everything past that felt like it was very, very brittle…&quot;"
              name="Polita Paulus"
              title="Sr. Principal Eng., Snowflake → Golden"
            />
          </div>
        </div>
      </div>
      <div class="trend">
        <div class="metaphor hot"><div class="i-ph-wall-fill"></div></div>
        <div class="col warm">
          <h3>Falling Adoption barriers</h3>
          <div class="trend-lead">Programming language adoption is easy.</div>
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
              expand-at="2"
              initials="DS"
              photo="/quotes/ds.jpg"
              quote="&quot;…the barrier to entry has substantially reduced.&quot;"
              full-quote="&quot;I don't know Go. I still write Go code, and […] it just doesn't matter what language it is. So the barrier to entry has substantially reduced.&quot;"
              name="David Schultz"
              title="Distinguished Eng., Snowflake → Anthropic"
            />
          </div>
        </div>
      </div>
      <div class="trend">
        <div class="metaphor"><img src="/brand/symbol.svg" alt="" /></div>
        <div class="col">
          <h3>FUD in the air</h3>
          <div class="trend-lead">Software vulnerabilities are scarier than ever.</div>
          <div class="col-body">
            <div align=center class="cool" style="padding: .6em"><span style="font-size: 28pt; font-weight: bold;">3× </span> CVEs since 2022.</div>
          </div>
        </div>
      </div>
    </div>
    <!-- Click anchors. `expand-at` reads `$clicks`, which Slidev derives from
         the v-clicks on the page; with the trends static there are none, so the
         quotes could never reach their own beat. -->
    <div class="click-anchor" v-click="2"></div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">{{ $slidev.nav.currentPage }} · Team</div>
    <h2>Passionate, clear-eyed experts</h2>
  </div>
  <div class="grow">
      <p>Each with over a decade of experience working on this problem.</p>
      <p>Created and grew Dynamic Tables at Snowflake to $100M ARR over 4 years.</p>
      <p>Every offer we&rsquo;ve made has been accepted &mdash; 4 of 4, with talent arriving unsolicited.</p>
      <br>
    <div class="cols" style="grid-template-columns:1fr 1fr 1fr">
      <TeamCard photo="/team/dan.jpg" name="Dan Sotolongo" role="Founder/CEO"
        :companies="['i-simple-icons-snowflake', 'i-simple-icons-google', 'i-simple-icons-twitter', 'Caltech']">
        <p>Product visionary. Co-created Dynamic Tables. Worked on stream processing, observability. </p>
      </TeamCard>
      <TeamCard photo="/team/daniel.jpg" name="Daniel Mills" role="Co-founder"
        :companies="['i-simple-icons-snowflake', 'i-simple-icons-google', 'UW']">
        <p>Implementor extraordinaire. Co-created Dynamic Tables. Google Dataflow Streaming founding team.</p>
      </TeamCard>
      <TeamCard photo="/team/skylar.jpg" name="Skylar Cook" role="Co-founder"
        :companies="['Datadog', 'Noom', 'Verily', 'Caltech']">
            <p>DX Expert. Worked on distributed systems, developer infra, biotech. Used Temporal in anger.</p>
      </TeamCard>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">{{ $slidev.nav.currentPage }} · Market positioning</div>
    <h2>Turnkey Application Platform</h2>
  </div>
  <div class="grow">
    <div class="cols n2 venn-row">
      <div class="venn-col">
        <div class="venn-head">Product Categories</div>
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
          <span class="vl-val">$13B</span>
          <span class="vl-growth">3&times; / yr</span>
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
      <div class="beats beats-clear">
        <p v-click="4"><span class="hot">Convex</span> unifies 2 categories.</p>
        <p class="closer" v-click="5">Only <span class="warm">Cambra</span> does all 3.</p>
        <div class="spend" v-click="6">
          <div class="spend-head">Cost of revenue by layer</div>
          <div class="cor">
            <div class="cor-row"><span class="cor-name">Apps</span><span class="cor-track"><span class="cor-bar" style="width:100.0%"><i style="width:47%"></i></span></span><span class="cor-val">47%</span></div>
            <div class="cor-row here"><span class="cor-name">Data &amp; platform</span><span class="cor-track"><span class="cor-bar" style="width:47.00%"><i style="width:24%"></i></span></span><span class="cor-val">24%</span></div>
            <div class="cor-row"><span class="cor-name">Infrastructure</span><span class="cor-track"><span class="cor-bar" style="width:11.28%"><i style="width:44%"></i></span></span><span class="cor-val">44%</span></div>
          </div>
          <p class="spend-note">The platform layer has both centralization and large margins.</p>
        </div>
      </div>
    </div>
  </div>
  <div class="venn-src">
      Last-priced valuations &middot; YoY revenue growth, rounded, Aug 2026. 
      <span v-click="1">Snowflake is a live market cap. Analytics growth covers Snowflake and Databricks.</span>
      <br>
      <span v-click="2"><span style="font-family: var(--f-logo)">*</span> Select independents only. Hyperscalers dominate the category. <br><span class="vl-dot vl-dot-inline"></span> do not disclose revenue.</span>
      <span v-click="6"><br>Apps: AI-native SaaS, <a href="https://avanteventures.com/en/library/ai-startup-gross-margin-benchmark-2026">ICONIQ State of AI 2026 &nearr;</a> &middot; Platform: <a href="https://www.snowflake.com/en/news/press-releases/snowflake-reports-financial-results-for-the-fourth-quarter-and-full-year-of-fiscal-2026/">Snowflake FY2026 &nearr;</a> 24%, <a href="https://www.sec.gov/Archives/edgar/data/0001561550/000162828026053829/ex-991x20260630x8k.htm">Datadog Q2 2026 &nearr;</a> 20% &middot; Infra: <a href="https://www.stocktitan.net/sec-filings/DOCN/10-q-digital-ocean-holdings-inc-quarterly-earnings-report-a7679abb1555.html">DigitalOcean Q1 2026 &nearr;</a></span>
      
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">{{ $slidev.nav.currentPage }} · Market Size</div>
    <h2>3 Categories, 1 market.</h2>
  </div>
  <div class="grow">
    <div class="cols n2 venn-row">
      <!-- The same three sets over a different population, so the figure is the
           same figure — only stripped. The companies and the valuations were
           facts about products; here the circles are drawn over customers, and
           .venn-col.segments moves them to k = 0.26. -->
      <div class="venn-col segments">
        <div class="venn-head">Market Segments</div>
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
      </div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">{{ $slidev.nav.currentPage }} · The Wedge</div>
    <h2>Agents force the change.</h2>
  </div>
  <div class="grow">
    <div class="cols n2 venn-row">
      <!-- The market slide's own Venn, unchanged in geometry, with the wedge
           named at the intersection instead of the company. -->
      <div class="venn-col">
        <div class="venn-head">What it needs</div>
        <div class="venn-stage">
      <div class="venn">
        <div class="venn-circle analytics"></div>
        <div class="venn-label analytics"><span class="vl-name">Analytics</span></div>
        <div class="venn-circle serving"></div>
        <div class="venn-label serving"><span class="vl-name">Serving</span></div>
        <div class="venn-circle durable"></div>
        <div class="venn-label durable"><span class="vl-name">Durable execution</span></div>
        <svg class="venn-region cambra" v-click="7" viewBox="0 0 315 299.59" aria-hidden="true">
          <path class="for-cat" d="M115.40 108.88A100 100 0 0 1 199.60 108.89A100 100 0 0 1 157.50 181.82A100 100 0 0 1 115.40 108.88Z" />
        </svg>
        <div class="venn-core" v-click="7" style="width:auto;height:auto;padding:.3rem .6rem;background:var(--abyssal);border:1px solid var(--warm);border-radius:6px;font-family:var(--f-mono);font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--warm);white-space:nowrap">agent runtimes</div>
      </div>
        </div>
        <div class="wspend">
          <b class="ws-amt">$250M</b>
          <span class="ws-txt">a year on Temporal, up <b>200%</b>. 18 of the top 30 AI-native companies run on it.</span>
        </div>
        <div class="ws-src"><a href="https://www.geekwire.com/2026/temporal-12-55b-valuation-ai-agents/">Temporal Series E, Sept 2026 &nearr;</a></div>
      </div>
      <div class="beats reqs">
          <p>Everybody is building agents on durable execution. <span v-click=1>But agents need all this:</span></p>
        <ul>
          <li v-click="1"><strong>Immortality.</strong> Not a run that ends when the history log fills.</li>
          <li v-click="2"><strong>Evolvability.</strong> Without replay or pinned old versions.</li>
          <li v-click="3"><strong>Transactional shared state.</strong> One store, across agents.</li>
          <li v-click="4"><strong>Branchability.</strong> For evals, simulation, experiments.</li>
          <li v-click="5"><strong>Verifiability.</strong> As models grow more autonomous.</li>
          <li v-click="6"><strong>Complete provenance.</strong> Every decision back to its causes.</li>
        </ul>
        <p class="closer" v-click="7">Temporal does none of them. <span v-click="8">The architecture that solves agents <span class="hot">is an application platform</span> </span> 
        <span v-click="9"> &mdash; one you can adopt <span class="hot">one agent at a time</span>, alongside your existing stack.</span></p>
      </div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">{{ $slidev.nav.currentPage }} · Why It Wins</div>
    <h2 style="max-width:none">Compounds as agents get more capable.</h2>
  </div>
  <div class="grow">
    <div class="ladder">
      <div class="rung-group g1">
        <div class="rung-label">Foundation</div>
        <div class="rungs">
          <div class="rung"><b>Immortality</b><span>A run never has to end.</span></div>
          <div class="rung"><b>Evolvability</b><span>New code takes over a live run.</span></div>
        </div>
      </div>
      <div class="rung-group g2" v-click="1">
        <div class="rung-label">Complex systems</div>
        <div class="rungs">
          <div class="rung"><b>Transactional shared state</b><span>Agents read and write one store.</span></div>
          <div class="rung"><b>Branchability</b><span>Fork the world and test against it.</span></div>
        </div>
      </div>
      <div class="rung-group g3" v-click="2">
        <div class="rung-label">Safety &amp; governance</div>
        <div class="rungs">
          <div class="rung"><b>Verifiability</b><span>Invariants the compiler enforces.</span></div>
          <div class="rung"><b>Complete provenance</b><span>Every decision traces to its causes.</span></div>
        </div>
      </div>
    </div>
    <div class="verdict" v-click="3">
      <p class="verdict-head">Durable execution <span class="hot">can't do these</span>.</p>
      <p class="verdict-why">It relies on <b>deterministic replay</b>, which makes all of these features inaccessible in principle.</p>
    </div>
    <p class="closer center" v-click="4">For Cambra, these are just <span class="hot">consequences</span> of its architecture.</p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">{{ $slidev.nav.currentPage }} · Business Model</div>
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
          <h3 class="bm-h">Hosted, distributed engine</h3>
          <p>Multi-tenant, proprietary. The easiest, cheapest way to run Cambra, from hobbyist to enterprise.</p>
        </div>
        <div class="bm-note tier-0" v-click="1">
          <div class="bm-tier">Open Source</div>
          <h3 class="bm-h">Compiler + engine</h3>
          <p>Single-tenant. Useful standalone. Builds trust, community, and sales pipeline.</p>
        </div>
      </div>
      <div class="bm-g2m" v-click="4">
        <!-- Drawn in the column's own design pixels (168 x 381); the tier
             centres it points at are y 69, 199 and 320. -->
        <svg class="g2m-wires" viewBox="0 0 168 381" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="g2m-tip-ent" markerUnits="userSpaceOnUse" markerWidth="7" markerHeight="7"
                    refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 z" fill="var(--coral)" />
            </marker>
            <marker id="g2m-tip-plg" markerUnits="userSpaceOnUse" markerWidth="7" markerHeight="7"
                    refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 z" fill="var(--cool)" />
            </marker>
          </defs>
          <path class="w-ent" d="M44,128 L6,71" />
          <path class="w-ent" d="M44,140 L6,197" />
          <path class="w-plg" d="M112,254 L6,202" />
          <path class="w-plg" d="M112,266 L6,318" />
        </svg>
        <span class="g2m-label lbl-ent">Enterprise Sales</span>
        <span class="g2m-label lbl-plg">PLG</span>
      </div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">{{ $slidev.nav.currentPage }} · De-risking</div>
    <h2>What has to be true.</h2>
  </div>
  <div class="grow">
    <div class="hyps">
      <div class="hyp">
        <div class="h-claim">Developers get excited.</div>
        <div class="h-status ok">Proven</div>
        <div class="h-ev">HN front page, unpromoted. Contributors volunteering unpaid.</div>
      </div>
      <div class="hyp" v-click="1">
        <div class="h-claim">It works.</div>
        <div class="h-status ok">3 of 4</div>
        <div class="h-ev"><b>Done</b>: language, verification, hot reload. <b>In progress</b>: branching.</div>
      </div>
      <div class="hyp" v-click="2">
        <div class="h-claim">Agents can write it.</div>
        <div class="h-status now">Promising</div>
        <div class="h-ev">Early tests look good. Observable after MVP.</div>
        <div class="hyp-stats">
          <div class="hs"><b>5×</b><span>code reduction</span></div>
          <div class="hs"><b>1</b><span> shot to compile</span></div>
          <div class="hs"><b>2.6k</b><span>tokens of context to teach it</span></div>
        </div>
      </div>
      <div class="hyp" v-click="3">
        <div class="h-claim">Teams will try it.</div>
        <div class="h-status now">Promising</div>
        <div class="h-ev">Prospects got the value. Observable after MVP.</div>
      <div class="hyp-quotes">
        <QuoteCard
          initials="BJ"
        photo="/quotes/bj.jpg"
          quote="&quot;I think that would be amazing. [&hellip;] My ideal model would be like, here&rsquo;s old. This is new. Do it. [&hellip;] If you&rsquo;re taking over hosting our backends, probably hundreds of thousands a year.&quot;"
          name="Bryan Jadot"
          title="Tech Lead, Nuvo"
        />
        <QuoteCard
          initials="AM"
        photo="/quotes/am.jpg"
          quote="&quot;Unify[ing] the logic for all this stuff would simplify it a ton. [&hellip;] If I had one more engineer, it would give me less value than just being able to pay for this.&quot;"
          name="Alan Menezes"
          title="Director, Nvidia"
        />
      </div>
      </div>
      <div class="hyp" v-click="4">
        <div class="h-claim">Teams will ship it.</div>
        <div class="h-status open">Open</div>
        <div class="h-ev">Observable after hardening.</div>
      </div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">{{ $slidev.nav.currentPage }} · The Ask</div>
    <h2 style="font-family:var(--f-logo);font-size:2.6rem">$4M seed</h2>
    <div class="ask-sub">12–18 months to the Series A</div>
  </div>
  <div class="grow">
    <div class="ask-phases">
      <div class="ask-phase" style="--h:56%">
        <div class="ph"><span>MVP</span><span>months 0–6</span></div>
        <div class="amt">$0.9M<small>team of 6</small></div>
        <div class="deliv">Get hot reload + agent integrations in a design partner's hands within 3 months. Iterate to MVP in 3 more.</div>
      </div>
      <div class="ask-phase" style="--h:75%">
        <div class="ph"><span>Production</span><span>months 6–12</span></div>
        <div class="amt">$1.2M<small>team of 8</small></div>
        <div class="deliv">Get 5 paying design partners <b class="cool">into production</b>. Hire dev-rel to grow OSS community, prime sales funnel.</div>
      </div>
      <div class="ask-phase warm" style="--h:100%">
        <div class="ph"><span>Growth</span><span>months 12–18</span></div>
        <div class="amt">$1.6M<small>team of 11</small></div>
        <div class="deliv">Raise the Series A on production usage, leaving six months of runway. Start building hosted service, freemium tier. Ramp up marketing.</div>
      </div>
    </div>
    <div class="ask-footer">
      <div><strong>Where it goes</strong> &middot; people 87% &middot; cloud + inference 7% &middot; legal, accounting, travel 6% &middot; plan $3.8M + reserve</div>
      <div><strong>Already in</strong> &middot; Snowflake co-founder &middot; Redpanda CEO, CTO &middot; SAFEs at a $20M cap</div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame center">
  <div class="bg-glow" style="bottom:-16rem;left:-12rem;width:36rem;height:36rem;background:radial-gradient(circle,rgba(28,136,167,.2),transparent 70%)"></div>
  <div class="eyebrow">{{ $slidev.nav.currentPage }} · Vision</div>
  <h2 style="font-size:2.6rem;max-width:22ch;margin-top:.6rem">The <strong class="hot">development</strong> platform.</h2>

  <p class="lead-p" style="font-size:1.05rem">Our platform accumulates the context AI needs to take over not just operations, but <strong>application development</strong>.</p>
  <div style="font-family:var(--f-mono);font-size:.7rem;color:var(--fg-3);margin-top:.6rem">cambra.dev · dan@cambra.dev</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">{{ $slidev.nav.currentPage }} · Demo</div>
    <h2>The system as a program</h2>
  </div>
  <div class="grow" data-waitfor=".cart-demo">
    <CartDemo />
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame center">
    <div class="eyebrow">
<h1> Appendix</h1></div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · The Insight</div>
    <h2>Shift left. Automate more.</h2>
  </div>
  <div class="grow">
    <div class="sdlc-canvas"><SdlcDiagram :stage="Math.min($clicks + 1, 3)" :print-stage="3" /></div>
    <div class="pillars compact">
      <div v-click="2" class="beat-today"><b>Today</b> — types and unit tests early. All the important stuff late, with a human in the loop.
        <!-- Reserves the height of page two's tag row. The pair shares a
             layout, and without this the diagram refits between them. -->
        <div class="bm-tags" aria-hidden="true" style="margin-left:9em;visibility:hidden">
            <span>Static Assertions</span>
            <span>Program Branching</span>
            <span>Transactional Hot Reload</span>
        </div>
      </div>
    </div>
    <div class="closer center" v-click="3">Today a <span class="hot">human</span> closes the loop.</div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · The Insight</div>
    <h2>Shift left. Automate more.</h2>
  </div>
  <div class="grow">
    <div class="sdlc-canvas"><SdlcDiagram :stage="4" fixed /></div>
    <div class="pillars compact">
      <div class="beat-cambra"><b>Cambra</b> — end-to-end properties checked before deployment, no human required. 
        <div class="bm-tags" style="margin-left:9em">
            <span>Static Assertions</span>
            <span>Program Branching</span>
            <span>Transactional Hot Reload</span>
        </div>
      </div>
    </div>
    <div class="closer center" v-click="1">You can't bolt this on. <span class="warm">Cambra designs it in.</span></div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · Why It Wins</div>
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
    <p v-click="3" class="closer">Only with <span style="color:var(--coral)">Cambra</span> &mdash; <span style="color:var(--lagoon)">inaccessible</span> to conventional stack.</p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · Why It Wins</div>
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
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · The Agent Wedge</div>
    <h2 style="max-width:40ch">You decide to build an agent.</h2>
  </div>
  <div class="grow">
    <div class="prelim">
      <div class="pre-step" v-click="1">It calls models, uses tools, waits on people. A single run lasts hours or days.</div>
      <div class="pre-step" v-click="2">So it has to survive a crash, a restart, a deploy.</div>
      <div class="pre-step" v-click="3">You go and read. Every answer points the same way: <b>durable execution</b>.</div>
    </div>
    <div class="rainbow" v-click="4">
      <div class="rb-top">
        <div class="rb-box app">Your app</div>
        <div class="rb-arrow">&darr;</div>
      </div>
      <div class="rb-row">
        <div class="rb-box svc">Temporal Service</div>
        <div class="rb-feed">
          <span class="rb-line">&#8644;</span>
          <small>tasks</small>
        </div>
        <div class="rb-pools">
          <div class="rb-box app"><b>Your workers</b></div>
        </div>
      </div>
    </div>
    <p class="closer center" v-click="5">The obvious choice: Temporal<br><span class="cool">4,300 paying customers, last valued at $12.55B.</span></p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · The Agent Wedge</div>
    <h2 style="max-width:40ch">First, learn Temporal.</h2>
  </div>
  <div class="grow">
    <div class="shots">
      <img class="shot p1" src="/temporal/workflows.png" alt="Temporal docs: Workflows" v-click="1">
      <img class="shot p2" src="/temporal/activities.png" alt="Temporal docs: Activities" v-click="2">
      <img class="shot p3" src="/temporal/workers.png" alt="Temporal docs: Workers" v-click="3">
      <img class="shot p4" src="/temporal/task-queues.png" alt="Temporal docs: Task Queues" v-click="4">
      <img class="shot p5" src="/temporal/determinism.png" alt="Temporal docs: Workflow Definition and deterministic constraints" v-click="5">
      <img class="shot p6" src="/temporal/message-passing.png" alt="Temporal docs: Signals, Queries and Updates" v-click="6">
      <div class="shot-tally" v-click="7"><b>18</b><span>concepts before your first deploy</span></div>
    </div>
    <div class="concepts" v-click="7">
      <span>Workflow Definition</span><span>Workflow Execution</span><span>Workflow Type</span><span>Activity</span><span>Activity Execution</span><span>Worker</span><span>Worker Process</span><span>Task Queue</span><span>Deterministic constraints</span><span>Replay</span><span>Signal</span><span>Query</span><span>Update</span><span>Timer</span><span>Heartbeat</span><span>Continue-As-New</span><span>Patching</span><span>Namespace</span>
    </div>
    <p class="closer center" v-click="8">Two weeks in, <span class="cool">v1 is in production.</span> It works.</p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · The Agent Wedge</div>
    <h2 style="max-width:44ch">Then you try to change it.</h2>
  </div>
  <div class="grow nde-slide">
    <div class="nde" v-click="1">
      <div class="nde-head">workflow task failed</div>
      <pre class="nde-body">Failure handling event 11 of type <span class="ev">&#39;EVENT_TYPE_ACTIVITY_TASK_SCHEDULED&#39;</span> during replay.
Command COMMAND_TYPE_SCHEDULE_ACTIVITY_TASK doesn&#39;t match event
EVENT_TYPE_ACTIVITY_TASK_SCHEDULED with EventId=11 on check activityType
with an expected value name: <span class="ev">&quot;DoA&quot;</span> and an actual value name: <span class="ev">&quot;DoB&quot;</span></pre>
      <div class="nde-src">temporalio/sdk-java#902</div>
    </div>
    <div class="diff">
      <figure v-click="2">
        <figcaption>First version</figcaption>
        <pre class="code">@workflow.defn
class MyWorkflow:
    @workflow.run
    async def run(self) -&gt; None:
        self._result = await workflow.execute_activity(
<span class="add">            pre_patch_activity,</span>
            schedule_to_close_timeout=timedelta(minutes=5),
        )</pre>
      </figure>
      <figure v-click="3">
        <figcaption>How to change one line</figcaption>
        <pre class="code">@workflow.defn
class MyWorkflow:
    @workflow.run
    async def run(self) -&gt; None:
<span class="add">        if workflow.patched("my-patch"):</span>
            self._result = await workflow.execute_activity(
<span class="add">                post_patch_activity,</span>
                schedule_to_close_timeout=timedelta(minutes=5),
            )
<span class="add">        else:</span>
<span class="add">            self._result = await workflow.execute_activity(</span>
<span class="add">                pre_patch_activity,</span>
<span class="add">                schedule_to_close_timeout=timedelta(minutes=5),</span>
<span class="add">            )</span></pre>
      </figure>
    </div>
    <p class="closer center" v-click="4">Both paths stay until every old run drains.</p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · The Agent Wedge</div>
    <h2 style="max-width:44ch">So you version your workers.</h2>
  </div>
  <div class="grow">
    <div class="rainbow">
      <div class="rb-top">
        <div class="rb-box app" v-click="1">Your app</div>
        <div class="rb-arrow" v-click="1">&darr;</div>
      </div>
      <div class="rb-row tall">
        <div class="rb-box svc" v-click="1">Temporal Service</div>
        <div class="rb-feed" v-click="1">
          <span class="rb-line">&#8644;</span>
          <small>poll<br>&amp; report</small>
        </div>
        <div class="rb-pools">
          <div class="rb-pool v1" v-click="1"><b>workers</b><span>v1</span></div>
          <div class="rb-pool v2" v-click="2"><b>workers</b><span>v2</span></div>
          <div class="rb-pool v3" v-click="3"><b>workers</b><span>v3</span></div>
          <div class="rb-pool v4" v-click="4"><b>workers</b><span>v4</span></div>
          <div class="rb-pool v5" v-click="4"><b>workers</b><span>v5</span></div>
          <div class="rb-pool v6" v-click="4"><b>workers</b><span>v6</span></div>
        </div>
      </div>
    </div>
    <div class="rb-math" v-click="5">
      <div class="rbm"><b>3</b><span>deploys a day</span></div>
      <div class="rbm op">&times;</div>
      <div class="rbm"><b>2 days</b><span>for a run to drain</span></div>
      <div class="rbm op">=</div>
      <div class="rbm hot"><b>6</b><span>worker fleets live at once</span></div>
    </div>
    <p class="closer center" v-click="6">Drain duration is agent lifetime.
       <br>Now, you have to weigh <span class="hot">product quality against operational risk.</span></p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · Root Cause</div>
    <h2>Durable execution has a split brain.</h2>
  </div>
  <div class="grow">
    <div class="brain">
      <div class="hemi" v-click="1">
        <div class="hemi-where">Inside your program</div>
        <div class="hemi-what">Ephemeral state</div>
        <p>Where you are in the code, your variables, the half&ndash;finished work. Gone the moment the process dies.</p>
      </div>
      <div class="seam" v-click="3"><span>must stay<br> in sync</span></div>
      <div class="hemi out" v-click="2">
        <div class="hemi-where">Outside your program</div>
        <div class="hemi-what">Durable state</div>
        <p>The event log. Survives the crash, and knows nothing about what your code was doing.</p>
      </div>
    </div>
    <div class="sync-work" v-click="4">
      <p class="brain-lead">Temporal keeps things in sync... with some help.</p>
      <div class="pills">
        <span class="pill">nondeterminism errors</span>
        <span class="pill">patched()</span>
        <span class="pill">rainbow deploys</span>
        <span class="pill">continue-as-new</span>
      </div>
    </div>
    <p class="closer center" v-click="5">Every one exists to <span class="hot">keep the two halves consistent.</span></p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · Ideal Customer Profile</div>
    <h2 style="max-width:46ch">Teams shipping agents daily on Temporal.</h2>
  </div>
  <div class="grow">
    <div class="buyer-names" v-click="1">
      <p>Agents in production on Temporal today:</p>
      <div class="bn-row">
        <span>OpenAI</span><span>Cursor</span><span>Replit</span><span>Lovable</span><span>Scale AI</span><span>Hebbia</span><span>Abridge</span>
      </div>
    </div>
    <p class="buyer-def" v-click="2">And they are all working around the same wall.</p>
    <div class="cols n3 buyers">
      <div class="col" v-click="2">
        <h3 class="disp">Cursor</h3>
        <p>Built its own replay shadower &mdash; a cron pulls production histories and replays them against new code, because a deploy can break runs already in flight.</p>
        <span class="buyer-src"><a href="https://temporal.io/resources/on-demand/building-agentic-consumer-products-with-temporal-at-cursor">Replay &rsquo;26 talk &nearr;</a></span>
      </div>
      <div class="col" v-click="3">
        <h3 class="disp">Lovable</h3>
        <p>Their infrastructure lead took the stage at Temporal&rsquo;s own conference to ask what durability is costing them &mdash; operationally, financially, architecturally.</p>
        <span class="buyer-src"><a href="https://temporal.io/resources/on-demand/lovable-durable-but-at-what-cost">&ldquo;Durable, but at what cost?&rdquo; &nearr;</a></span>
      </div>
      <div class="col warm" v-click="4">
        <h3 class="disp">Nuvo</h3>
        <p>Had a wedged workflow the morning we spoke. Rolling back wedges the newly started ones too &mdash; so they had to intervene manually.</p>
        <span class="buyer-src">Tech lead, in conversation &middot; Aug 2026</span>
      </div>
    </div>
    <p class="closer center" v-click="5">One question:<br><span class="hot">&ldquo;How long does it take to roll out changes to your agents?&rdquo;</span></p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · Ideal Customer Profile</div>
    <h2>High-performance agent runtimes</h2>
  </div>
  <div class="grow">
    <div class="cols n2">
      <div class="cols n1">
        <div class="col">
            <h3>Who adopts first</h3>
            <ul>
            <li>Mid-size, high-growth — technical risk they can take, no time to build their own infra</li>
            <li>Care about correctness (B2B, retail, finance) — not heavily regulated</li>
            <li>Heavy AI coding usage already</li>
            <li>High operational burden from stack fragmentation</li>
            </ul>
        </div>
        <div class="cols n2">
            <div class="col" style="padding:.8rem"><div class="vlogo i-simple-icons-supabase"></div><h3 style="font-family:var(--f-disp);text-transform:none;font-size:.9rem;color:var(--fg);letter-spacing:0">Supabase</h3><p style="font-size:.72rem">Can't handle durable execution, analytics.</p></div>
            <div class="col" style="padding:.8rem"><div class="vlogo i-simple-icons-render"></div><h3 style="font-family:var(--f-disp);text-transform:none;font-size:.9rem;color:var(--fg);letter-spacing:0">Render</h3><p style="font-size:.72rem">Classic PaaS, not customizable.</p></div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:.8rem">
        <h3 style="font-family:var(--f-mono);font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--fg-3);margin:0">About to pick up</h3>
        <div class="cols n3">
          <div class="col warm" style="padding:.8rem"><div class="vlogo i-simple-icons-temporal"></div><h3 style="font-family:var(--f-disp);text-transform:none;font-size:.9rem;color:var(--fg);letter-spacing:0">Temporal</h3><p style="font-size:.72rem">Non-determinism, replay issues</p></div>
          <div class="col warm" style="padding:.8rem"><div class="vlogo-pair"><div class="vlogo i-simple-icons-apachekafka"></div><div class="vlogo i-simple-icons-clickhouse"></div></div><h3 style="font-family:var(--f-disp);text-transform:none;font-size:.85rem;color:var(--fg);letter-spacing:0">Kafka + Clickhouse</h3><p style="font-size:.72rem">Impedance mismatch</p></div>
        </div>
      </div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

---

<div class="frame">
  <div class="head">
    <div class="eyebrow">Appendix · Adoption</div>
    <h2 style="max-width:44ch">Adoption is the job, not a hire.</h2>
  </div>
  <div class="grow">
    <div class="cols n3">
      <div class="col" v-click="1">
        <h3>Who owns it</h3>
        <div class="col-body">
          <ul>
            <li><b>Skylar</b> &mdash; developer experience. He lived this at Datadog.</li>
            <li><b>Dan</b> &mdash; the first ten users, personally.</li>
          </ul>
          <p>Two founders, not a req. The cost of being wrong here is the company.</p>
        </div>
      </div>
      <div class="col warm" v-click="2">
        <h3>Where the first ten come from</h3>
        <div class="col-body">
          <ul>
            <li><b>Nuvo</b> &mdash; already asking for it</li>
            <li><b>Datadog alumni</b> &mdash; Skylar&rsquo;s network, incl. the team that ran Conductor</li>
            <li><b>The talks above</b> &mdash; the engineers who gave them</li>
            <li><b>Temporal&rsquo;s own forum</b> &mdash; the versioning threads are the ICP self-identifying</li>
          </ul>
        </div>
      </div>
      <div class="col" v-click="3">
        <h3>What we put in front of them</h3>
        <div class="col-body">
          <ul>
            <li>The <b>side-by-side</b>: one agent, both stacks, upgraded mid-run</li>
            <li>The replay argument, <b>written down</b></li>
            <li>Open source from day one</li>
          </ul>
          <p class="wn-note">Advisors in the loop: Felipe Hoffa (ex-Google Cloud DevRel); a Kelsey Hightower intro offered by Bill Coughran.</p>
        </div>
      </div>
    </div>
    <p class="closer center" v-click="4">The plan is not &ldquo;we&rsquo;ll hire DevRel.&rdquo; <span class="hot">It&rsquo;s where our next six months go.</span></p>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
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
  <div class="page-no">{{ $slidev.nav.currentPage  }} / {{ $slidev.nav.total  }}</div>
</div>

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
            <div class="pill on">OSS — single-instance engine</div>
            <div class="pill">Cloud — scaling, fault tolerance, prod ops</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>

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
  <div class="page-no">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
</div>
