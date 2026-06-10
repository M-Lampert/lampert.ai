// Animated network background (custom, not part of the HTML5UP template).
//
// Nodes drift slowly across the page and bounce off the left/right page edges
// and the visible band between the banner and the footer. Scrolling nudges a
// random fraction of nodes in the scroll direction ("friction" then settles
// them back to the base drift speed). A gentle separation force keeps nodes
// from clustering. Edges connect nodes by proximity, so they form and dissolve
// as nodes pass each other.
//
// Plain JS + SVG. This replaces the original D3 force simulation, which settled
// into a static equilibrium and only jittered on scroll (d3 is no longer needed).
(function () {
  "use strict";

  const container = document.getElementById("network");
  if (!container) return;

  // --- Tunables --------------------------------------------------------------
  const AREA_PER_NODE = 150000; // px² of page per node (≈ the previous density)
  const MIN_NODES = 25;
  const MAX_NODES = 80;
  const NODE_R = 12; // px, same as the old look
  const LINK_DIST = 350; // connect nodes closer than this (px)
  const NEAR_DIST = 180; // closer pairs get a stronger line
  const BASE_SPEED = 80; // px/s drift speed nodes always relax back to
  const MAX_SPEED = 300; // px/s cap right after fast scrolling
  const RELAX_RATE = 1.2; // 1/s — how quickly speed returns to BASE_SPEED
  const WANDER = 1.0; // rad/s of random curving, keeps directions varied
  const SCROLL_KICK = 2.2; // px/s of velocity per scrolled px
  const MAX_KICK = 90; // ignore scroll deltas beyond this (page jumps)
  const KICK_FRACTION = 0.2; // each scroll event only nudges this share of nodes
  const SEP_DIST = 110; // px — push apart nodes closer than this (anti-clustering)
  const SEP_ACCEL = 260; // px/s² separation push at zero distance, fades to 0 at SEP_DIST

  const SVG_NS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The SVG is purely decorative: hide it from assistive technology.
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("role", "presentation");

  // All edges are drawn as segments of two <path>s (near/far) — two DOM updates
  // per frame instead of hundreds of <line> elements. Colours stay CSS-driven
  // (dark mode overrides the stroke/fill in _sass/libs/_dark.scss).
  function makeEdgePath(opacity) {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#999");
    p.setAttribute("stroke-width", "1");
    p.setAttribute("stroke-opacity", opacity);
    svg.appendChild(p);
    return p;
  }
  const farPath = makeEdgePath("0.3");
  const nearPath = makeEdgePath("0.65");
  const nodeGroup = document.createElementNS(SVG_NS, "g");
  svg.appendChild(nodeGroup);

  let W = 0;
  let H = 0;
  let minY = 0; // top of the visible band (bottom edge of the banner) in SVG coords
  let maxY = 0; // bottom of the band (top edge of the footer)

  function measure() {
    W = container.clientWidth;
    H = container.clientHeight;
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);

    // The landing layout pulls the content up behind the banner (negative margin),
    // so #network's box starts ~14em under the banner. Bounce off the *visible*
    // band — below the banner, above the footer — instead of the raw box edges.
    const top = container.getBoundingClientRect().top;
    const banner = document.getElementById("banner");
    const footer = document.getElementById("footer");
    minY = banner ? Math.max(0, banner.getBoundingClientRect().bottom - top) : 0;
    maxY = footer ? Math.min(H, footer.getBoundingClientRect().top - top) : H;
    if (maxY - minY < 4 * NODE_R) {
      // Degenerate band (tiny page) — fall back to the full box.
      minY = 0;
      maxY = H;
    }
  }

  const nodes = [];

  function initNodes() {
    const count = Math.max(
      MIN_NODES,
      Math.min(MAX_NODES, Math.round((W * (maxY - minY)) / AREA_PER_NODE))
    );
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const el = document.createElementNS(SVG_NS, "circle");
      el.setAttribute("r", NODE_R);
      el.setAttribute("fill", "steelblue");
      nodeGroup.appendChild(el);
      nodes.push({
        x: NODE_R + Math.random() * (W - 2 * NODE_R),
        y: minY + NODE_R + Math.random() * (maxY - minY - 2 * NODE_R),
        vx: Math.cos(angle) * BASE_SPEED,
        vy: Math.sin(angle) * BASE_SPEED,
        kick: 0.6 + Math.random() * 0.8, // per-node scroll sensitivity (organic feel)
        el: el,
      });
    }
  }

  function step(dt) {
    // Separation: nodes closer than SEP_DIST push each other apart, so heavy
    // scrolling (which sweeps everything the same way) can't pile them up.
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 === 0 || d2 >= SEP_DIST * SEP_DIST) continue;
        const d = Math.sqrt(d2);
        const push = (SEP_ACCEL * (1 - d / SEP_DIST) * dt) / d;
        a.vx += dx * push;
        a.vy += dy * push;
        b.vx -= dx * push;
        b.vy -= dy * push;
      }
    }

    for (const n of nodes) {
      // Gentle random curving so drift directions stay varied over time.
      const turn = (Math.random() - 0.5) * 2 * WANDER * dt;
      const cos = Math.cos(turn);
      const sin = Math.sin(turn);
      const vx = n.vx * cos - n.vy * sin;
      n.vy = n.vx * sin + n.vy * cos;
      n.vx = vx;

      // Friction: speed relaxes back to the base drift speed (and is capped).
      const speed = Math.hypot(n.vx, n.vy) || BASE_SPEED;
      let target = speed + (BASE_SPEED - speed) * Math.min(1, RELAX_RATE * dt);
      target = Math.min(target, MAX_SPEED);
      n.vx *= target / speed;
      n.vy *= target / speed;

      n.x += n.vx * dt;
      n.y += n.vy * dt;

      // Bounce off the page edges (left/right) and the visible band between the
      // banner and the footer (top/bottom).
      if (n.x < NODE_R) {
        n.x = 2 * NODE_R - n.x;
        n.vx = Math.abs(n.vx);
      } else if (n.x > W - NODE_R) {
        n.x = 2 * (W - NODE_R) - n.x;
        n.vx = -Math.abs(n.vx);
      }
      if (n.y < minY + NODE_R) {
        n.y = 2 * (minY + NODE_R) - n.y;
        n.vy = Math.abs(n.vy);
      } else if (n.y > maxY - NODE_R) {
        n.y = 2 * (maxY - NODE_R) - n.y;
        n.vy = -Math.abs(n.vy);
      }
    }
  }

  function draw() {
    let near = "";
    let far = "";
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const seg = "M" + a.x.toFixed(1) + " " + a.y.toFixed(1) + "L" + b.x.toFixed(1) + " " + b.y.toFixed(1);
          if (d2 < NEAR_DIST * NEAR_DIST) near += seg;
          else far += seg;
        }
      }
      a.el.setAttribute("cx", a.x.toFixed(1));
      a.el.setAttribute("cy", a.y.toFixed(1));
    }
    nearPath.setAttribute("d", near);
    farPath.setAttribute("d", far);
  }

  // Keep in sync with layout changes (window resize, <details> opening, fonts).
  function resize() {
    const oldW = W;
    const oldH = H;
    measure();
    if (!nodes.length || (W === oldW && H === oldH)) return;
    for (const n of nodes) {
      if (oldW > 0) n.x = (n.x / oldW) * W;
      n.x = Math.min(Math.max(n.x, NODE_R), W - NODE_R);
      n.y = Math.min(Math.max(n.y, minY + NODE_R), maxY - NODE_R);
    }
    if (reduceMotion) draw();
  }

  measure();
  initNodes();
  container.appendChild(svg);
  draw();

  if (window.ResizeObserver) new ResizeObserver(resize).observe(container);
  else window.addEventListener("resize", resize);

  if (reduceMotion) return; // static frame only — no animation, no scroll kicks

  // Scrolling nudges nodes in the scroll direction — but each scroll event only
  // sweeps a random KICK_FRACTION of them, so the network ripples while most
  // nodes hold their place instead of drifting off-screen together. Friction
  // settles the kicked ones back to the base drift.
  let lastScrollY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      const kick = Math.max(-MAX_KICK, Math.min(MAX_KICK, delta)) * SCROLL_KICK;
      for (const n of nodes) {
        if (Math.random() < KICK_FRACTION) n.vy += kick * n.kick;
      }
    },
    { passive: true }
  );

  let last = performance.now();
  function frame(now) {
    // Clamp dt so a backgrounded tab doesn't fast-forward the simulation.
    const dt = Math.min(0.066, (now - last) / 1000);
    last = now;
    step(dt);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
