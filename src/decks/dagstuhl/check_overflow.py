#!/usr/bin/env python3
"""Measure every slide against the 1280x720 stage and render a report image.

    python3 check_overflow.py     # -> overflow-report.png

Catches what the eye misses: a code block or table that quietly bleeds under
the rail. This Chrome build emits nothing for --dump-dom, so the probe page
renders its own findings and we screenshot that.
"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
DECK = HERE / "deck.html"
PROBE = HERE / "_overflow_probe.html"
SHOT = HERE / "overflow-report.png"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

REPORT = r"""
<!-- Activating a slide restarts its entrance animation, whose `from` state is
     translateY(11px) with fill-mode backwards. Measuring through that reports a
     phantom 11px overflow on every slide, so kill animation before measuring. -->
<style>*, *::before, *::after { animation: none !important;
        transition: none !important; transform: none !important }
       .stage { transform: none !important }</style>
<div id="report" style="position:fixed;inset:0;z-index:99999;background:#fff;
     color:#111;font:15px/1.5 ui-monospace,Menlo,monospace;padding:22px 26px;
     overflow:auto"></div>
<script>
(function () {
  function run() {
    var stage = document.getElementById('stage');
    stage.style.transform = 'none';          // measure in stage px, not scaled
    var PAD_BOTTOM = 66, STAGE_H = 720, limit = STAGE_H - PAD_BOTTOM;
    var slides = [].slice.call(document.querySelectorAll('.slide'));
    var lines = [], bad = 0;

    slides.forEach(function (s, i) {
      var had = s.classList.contains('on');
      s.classList.add('on');
      var top = s.getBoundingClientRect().top;
      var low = 0, tag = '';
      [].forEach.call(s.querySelectorAll('*'), function (el) {
        if (el.closest('aside.n')) return;
        var r = el.getBoundingClientRect();
        if (r.height <= 0 && r.width <= 0) return;
        var b = r.bottom - top;
        if (b > low) { low = b; tag = el.className || el.tagName; }
      });
      var wide = 0;
      [].forEach.call(s.querySelectorAll('pre, .diag, table'), function (el) {
        if (el.scrollWidth > el.clientWidth + 1) {
          wide = Math.max(wide, el.scrollWidth - el.clientWidth);
        }
      });
      if (!had) s.classList.remove('on');

      var over = Math.round(low) - limit, notes = [];
      if (over > 0) notes.push('VERTICAL +' + over + 'px');
      if (wide > 0) notes.push('H-SCROLL +' + wide + 'px');
      if (notes.length) bad++;
      var head = s.querySelector('h1, h2');
      lines.push(
        '<div style="padding:3px 0;color:' + (notes.length ? '#b00' : '#111') + '">' +
        ('  ' + (i + 1)).slice(-3) + '.  ends ' +
        ('   ' + Math.round(low)).slice(-4) + ' / ' + limit + '   ' +
        (notes.length ? '<b>' + notes.join(', ') + '</b>' : 'ok') +
        '  <span style="color:#888">' +
        (head ? head.textContent.slice(0, 42) : '(title)') +
        '  [' + String(tag).slice(0, 28) + ']</span></div>'
      );
    });

    document.getElementById('report').innerHTML =
      '<div style="font-size:21px;font-weight:700;margin-bottom:14px">' +
      (bad ? bad + ' SLIDE(S) OVERFLOW' : 'ALL ' + slides.length + ' SLIDES FIT') +
      '</div>' + lines.join('');
  }
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run);
})();
</script>
"""


def main():
    if not Path(CHROME).exists():
        sys.exit("Chrome not found.")
    if not DECK.exists():
        sys.exit("Build the deck first: python3 build.py")

    PROBE.write_text(
        '<!doctype html><html><head><meta charset="utf-8"></head>'
        '<body style="margin:0">' + DECK.read_text() + REPORT + "</body></html>"
    )
    subprocess.run(
        [CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
         "--window-size=1100,700", "--screenshot=" + str(SHOT),
         "--virtual-time-budget=4000", PROBE.as_uri()],
        capture_output=True, timeout=180,
    )
    PROBE.unlink(missing_ok=True)
    if not SHOT.exists():
        sys.exit("screenshot failed")
    print("wrote %s" % SHOT.name)


if __name__ == "__main__":
    main()
