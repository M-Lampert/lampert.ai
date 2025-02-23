const width = window.innerWidth;
const height = document.documentElement.scrollHeight;

// Generate 100 random points
let nodes = d3.range(50).map(() => {
  return { x: Math.random() * width, y: Math.random() * height };
});

// Compute Delaunay triangulation
const delaunay = d3.Delaunay.from(nodes.map(d => [d.x, d.y]));
let links = [];

if (delaunay.halfedges.length > 0) {
  for (let i = 0; i < delaunay.halfedges.length; i++) {
    const j = delaunay.halfedges[i];
    if (j > i) {
      const source = nodes[delaunay.triangles[i]];
      const target = nodes[delaunay.triangles[j]];
      links.push({ source, target });
    }
  }
}

// Create a new SVG element
const svg = d3.create("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [0, 0, width, height]);

// Create the simulation with the standard forces.
const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(links).distance(400))
  .force("charge", d3.forceManyBody().strength(-350));
  // .force("x", d3.forceX().strength(100 / width).x(d => d.x))
  // .force("y", d3.forceY().strength(100 / height).y(d => d.y));

// Draw edges. Note we use 'let' here so we can update the selection later.
let link = svg.append("g")
  .selectAll("line")
  .data(links)
  .join("line")
  .attr("stroke", "#999")
  .attr("stroke-width", 1);

// Draw nodes
const node = svg.append("g")
  .selectAll("circle")
  .data(nodes)
  .join("circle")
  .attr("r", 15)
  .attr("fill", "steelblue");

simulation.on("tick", () => {
  link.attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

    node.attr("cx", d => d.x = Math.max(0, Math.min(width, d.x)))
    .attr("cy", d => d.y = Math.max(0, Math.min(height, d.y)));

});
// Append the SVG element to the network section.
document.getElementById('network').appendChild(svg.node());

window.addEventListener("scroll", () => {
  let scrollY = window.scrollY;
  let direction = (this.oldScroll > scrollY) ? 1 : -1;
  this.oldScroll = scrollY;
  
  nodes.forEach(d => {
    d.y += direction * scrollY * 0.001;
  });

  links.forEach(link => {
    link.source.y += direction * scrollY * 0.001;
    link.target.y += direction * scrollY * 0.001;
  });

  simulation.alpha(0.5).alphaDecay(0.1).restart();
});