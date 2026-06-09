// Interactive talks map (Leaflet) for the Talks page hero.
// Reads talk data inlined as JSON in #talks-data, places a coloured/tagged marker
// per talk, and animates connection arcs from the home base to each talk in
// chronological order. Vanilla JS (no jQuery). Leaflet is loaded before this file.
(function () {
  var el = document.getElementById("talks-map");
  var dataEl = document.getElementById("talks-data");
  if (!el || !dataEl || typeof L === "undefined") return;

  // --- Config (edit here) --------------------------------------------------
  var HOME = { lat: 49.7888, lon: 9.9352, label: "University of Würzburg" };
  var ARC_COLOR = "#e89980"; // site accent
  var TAGS = {
    keynote: { color: "#e74c3c", label: "Keynote", letter: "K" },
    invited: { color: "#3498db", label: "Invited Talk", letter: "I" },
    contributed: { color: "#2ecc71", label: "Contributed Talk", letter: "C" },
    poster: { color: "#9b59b6", label: "Poster", letter: "P" },
  };
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  var talks = [];
  try {
    talks = JSON.parse(dataEl.textContent) || [];
  } catch (e) {
    talks = [];
  }
  talks = talks.filter(function (t) {
    return typeof t.lat === "number" && typeof t.lon === "number";
  });

  // --- Marker icons (coloured teardrop + white tag letter) -----------------
  function pinSvg(color, glyph) {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="34" viewBox="0 0 24 34">' +
      '<path d="M12 0C5.4 0 0 5.4 0 12c0 8 12 22 12 22s12-14 12-22C24 5.4 18.6 0 12 0z" ' +
      'fill="' + color + '" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>' +
      '<circle cx="12" cy="12" r="7" fill="#fff" opacity="0.92"/>' +
      '<text x="12" y="12" text-anchor="middle" dominant-baseline="central" ' +
      'font-family="sans-serif" font-size="9" font-weight="700" fill="' + color + '">' +
      glyph + "</text></svg>"
    );
  }
  function tagIcon(tag) {
    var t = TAGS[tag] || TAGS.contributed;
    return L.divIcon({
      html: pinSvg(t.color, t.letter),
      className: "talk-pin",
      iconSize: [24, 34],
      iconAnchor: [12, 34],
      popupAnchor: [0, -32],
    });
  }
  var homeIcon = L.divIcon({
    html: pinSvg(ARC_COLOR, "★"),
    className: "talk-pin talk-pin--home",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });

  // --- Map + tiles ---------------------------------------------------------
  var map = L.map(el, {
    scrollWheelZoom: false,
    worldCopyJump: true,
    zoomControl: false, // re-added and CSS-centered on the right edge
  }).setView([HOME.lat, HOME.lon], 4);
  // Zoom centered on the right edge; attribution (required by OSM) centered and
  // rotated on the left edge — both kept in the band not covered by content.
  L.control.zoom({ position: "topright" }).addTo(map);
  map.attributionControl
    .setPosition("topleft")
    .setPrefix('<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>');
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: "abc",
    maxZoom: 19,
    className: "talks-map-tiles",
  }).addTo(map);

  // --- Home marker ---------------------------------------------------------
  L.marker([HOME.lat, HOME.lon], { icon: homeIcon, zIndexOffset: 1000 })
    .bindPopup('<div class="talk-pop"><strong>' + HOME.label + "</strong></div>")
    .addTo(map);

  // --- Talk markers (clustered) -------------------------------------------
  var cluster = L.markerClusterGroup({
    maxClusterRadius: 40,
    iconCreateFunction: function (c) {
      return L.divIcon({
        html: '<div class="talk-cluster">' + c.getChildCount() + "</div>",
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    },
  });
  talks.forEach(function (t) {
    var d = (t.date || "").split("-");
    var dateStr =
      d.length === 3 ? MONTHS[parseInt(d[1], 10) - 1] + " " + parseInt(d[2], 10) + ", " + d[0] : "";
    var marker = L.marker([t.lat, t.lon], { icon: tagIcon(t.tag) });
    marker.bindPopup(
      '<div class="talk-pop"><strong>' + t.title + "</strong>" +
        '<div class="talk-pop-meta">' +
        (dateStr ? dateStr : "") +
        (t.location ? (dateStr ? " &middot; " : "") + t.location : "") +
        "</div></div>",
      { maxWidth: 280 }
    );
    cluster.addLayer(marker);
  });
  map.addLayer(cluster);

  // --- Fit to all points ---------------------------------------------------
  var pts = talks.map(function (t) {
    return [t.lat, t.lon];
  });
  pts.push([HOME.lat, HOME.lon]);
  map.invalidateSize(false); // ensure the container size is current before fitting
  if (pts.length > 1) {
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 6, animate: false });
  }
  // Re-measure once everything (fonts, layout) has settled.
  window.addEventListener("load", function () {
    map.invalidateSize(false);
  });

  // --- Animated connection arcs (chronological) ----------------------------
  function curve(from, to, bend) {
    var dLat = to[0] - from[0],
      dLng = to[1] - from[1];
    var cLat = (from[0] + to[0]) / 2 - dLng * bend;
    var cLng = (from[1] + to[1]) / 2 + dLat * bend;
    var out = [];
    for (var s = 0; s <= 1.0001; s += 0.02) {
      var a = 1 - s;
      out.push([
        a * a * from[0] + 2 * a * s * cLat + s * s * to[0],
        a * a * from[1] + 2 * a * s * cLng + s * s * to[1],
      ]);
    }
    return out;
  }
  var chrono = talks.slice().sort(function (a, b) {
    return (a.date || "").localeCompare(b.date || "");
  });
  chrono.forEach(function (t, i) {
    var line = L.polyline(curve([HOME.lat, HOME.lon], [t.lat, t.lon], 0.18), {
      color: ARC_COLOR,
      weight: 2,
      opacity: 0.6,
      className: "talk-arc",
      interactive: false,
    }).addTo(map);
    var path = line.getElement();
    if (path && path.getTotalLength) {
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      window.setTimeout(function () {
        path.style.transition = "stroke-dashoffset 0.9s ease";
        path.style.strokeDashoffset = "0";
      }, 350 + i * 450);
    }
  });
})();
