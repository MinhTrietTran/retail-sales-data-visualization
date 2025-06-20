d3.csv("../../data/final_data_date_edit.csv").then(data => {
  data.forEach(d => {
    d.Date = new Date(d.Date);
    d.Month = d3.timeFormat("%b")(d.Date);
    d["Price per Unit"] = +d["Price per Unit"];
    d["Total Amount"] = +d["Total Amount"];
    d["Transaction Count"] = 1;
  });

  

  const grouped = d3.rollup(data,
    v => v.length,
    d => d.Month,
    d => d.Gender,
    d => d["Product Category"]
  );

  const flatData = [];
  for (let [month, genderMap] of grouped.entries()) {
    for (let [gender, catMap] of genderMap.entries()) {
      for (let [category, count] of catMap.entries()) {
        flatData.push({ Month: month, Gender: gender, Category: category, Count: count });
      }
    }
  }

  console.log("flatData:", flatData.map(d => d.Month));

  const months = [...new Set(flatData.map(d => d.Month))];
  const genders = [...new Set(flatData.map(d => d.Gender))];
  const categories = [...new Set(flatData.map(d => d.Category))];
  const color = d3.scaleOrdinal().domain(categories).range(d3.schemeSet2);

  // === Biểu đồ 1: Bar Chart
  const svg1 = d3.select("#barChart"),
        margin1 = {top: 70, right: 20, bottom: 60, left: 50},
        width1 = +svg1.attr("width") - margin1.left - margin1.right,
        height1 = +svg1.attr("height") - margin1.top - margin1.bottom,
        g1 = svg1.append("g").attr("transform", `translate(${margin1.left},${margin1.top})`);

  const x0 = d3.scaleBand().domain(months).range([0, width1]).padding(0.2);
  const x1 = d3.scaleBand().domain(genders).range([0, x0.bandwidth()]).padding(0.05);
  const y = d3.scaleLinear().domain([0, d3.max(flatData, d => d.Count)]).nice().range([height1, 0]);

  g1.append("g")
    .selectAll("g")
    .data(months)
    .join("g")
      .attr("transform", d => `translate(${x0(d)},0)`)
    .selectAll("rect")
    .data(month => flatData.filter(d => d.Month === month))
    .join("rect")
      .attr("x", d => x1(d.Gender))
      .attr("y", d => y(d.Count))
      .attr("width", x1.bandwidth())
      .attr("height", d => height1 - y(d.Count))
      .attr("fill", d => color(d.Category))
      .on("mouseover", (event, d) => showTooltip(event, `${d.Gender}, ${d.Category}: ${d.Count}`))
      .on("mouseout", hideTooltip);

  g1.append("g").call(d3.axisLeft(y));
  g1.append("g").attr("transform", `translate(0,${height1})`).call(d3.axisBottom(x0));
  months.forEach(month => {
    genders.forEach(gender => {
      g1.append("text")
        .attr("x", x0(month) + x1(gender) + x1.bandwidth() / 2)
        .attr("y", height1 + 25) // tăng khoảng cách để tránh đè
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text(gender === "Male" ? "Nam" : "Nữ");
    });
  });

  createLegend(svg1, categories, color, 20, 10);

  // === Biểu đồ 2: Scatter Plot
  const svg2 = d3.select("#scatterPlot"),
        margin2 = {top: 70, right: 20, bottom: 50, left: 60},
        width2 = +svg2.attr("width") - margin2.left - margin2.right,
        height2 = +svg2.attr("height") - margin2.top - margin2.bottom,
        g2 = svg2.append("g").attr("transform", `translate(${margin2.left},${margin2.top})`);

  const x2 = d3.scaleLinear().domain(d3.extent(data, d => d["Price per Unit"])).nice().range([0, width2]);
  const y2 = d3.scaleLinear().domain(d3.extent(data, d => d["Total Amount"])).nice().range([height2, 0]);

  g2.selectAll("circle")
    .data(data)
    .join("circle")
      .attr("cx", d => x2(d["Price per Unit"]))
      .attr("cy", d => y2(d["Total Amount"]))
      .attr("r", 5)
      .attr("fill", d => color(d["Product Category"]))
      .attr("opacity", 0.7)
      .on("mouseover", (event, d) => showTooltip(event, `${d["Product Category"]}<br>Giá: ${d["Price per Unit"]}<br>Doanh thu: ${d["Total Amount"]}`))
      .on("mouseout", hideTooltip);

  g2.append("g").call(d3.axisLeft(y2));
  g2.append("g").attr("transform", `translate(0,${height2})`).call(d3.axisBottom(x2));

  createLegend(svg2, categories, color, 20, 10);
});

// === TOOLTIP ===
const tooltip = d3.select("#tooltip");

function showTooltip(event, content) {
  tooltip.style("opacity", 1)
         .html(content)
         .style("left", (event.pageX + 10) + "px")
         .style("top", (event.pageY - 28) + "px");
}
function hideTooltip() {
  tooltip.style("opacity", 0);
}

// === LEGEND FUNCTION ===
function createLegend(svg, categories, color, x, y) {
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${x},${y})`);

  const legendItems = legend.selectAll(".legend-item")
    .data(categories)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(${(i % 4) * 150}, ${Math.floor(i / 4) * 20})`);

  legendItems.append("rect")
    .attr("class", "legend-color")
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", d => color(d));

  legendItems.append("text")
    .attr("x", 18)
    .attr("y", 10)
    .text(d => d);
}



