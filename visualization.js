async function loadData(url = '') {
    /**
     * Loads data from a given url in JSON format and returns it as an
     * objects array.
     * See:
     * https://developer.mozilla.org/es/docs/Web/API/Fetch_API/Using_Fetch
     * 
     * Due to CORS restrictions, file can be loaded from local storage. In that case, file should define JSON data through a variable called "covid_data".
     * 
     * @returns {Array}
     */
    if (!url.startsWith('http')) {
        return covid_data;  // defined in local file
    }
    const response = await fetch(
        url,
        {
            method: 'GET',
            mode: 'same-origin',
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
    return response.json();
}

function roundTo(num, digits = 5) {
    /**
     * Rounds a float to a given value of digits
     */
    return +(Math.round(num + "e+" + digits)  + "e-" + digits);
}

function preprocessData(item) {
    /**
     * Given a data registry, add percent values fields and a date
     * field to be used as x-axis value.
     */
    var dateParser = d3.timeParse("%d/%m/%Y");
    item.cases_percent = roundTo(item.cases * 100.0 / item.popData2020);
    item.deaths_percent = roundTo(item.deaths * 100.0 / item.popData2020);
    item.date = dateParser(item.dateRep);

    return item;
}

function tooltipHtml(d) {
    let html = '<table>';
    html += `<tr><td>Date:</td><td class="value">${d.dateRep}</td></tr>`;
    html += `<tr><td>Cases:</td><td class="value">${d.cases}</td></tr>`;
    html += `<tr><td>Deaths:</td><td class="value">${d.deaths}</td></tr>`;
    html += '</table>';

    return html;
}

function showGraph(data, yAttr) {
    // Margin setup
    var margin = {top: 100, right: 100, bottom: 20, left: 100};
    var width = 900 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    var div = d3.select("body")
	    .append("div")
	    .attr("class", "tooltip")
	    .style("opacity", 0);

    console.log('With: ' + width + ' Height: ' + height);

    // Basic SVG canvas
    var svg = d3.select("#graph").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Temporal scale
    var x = d3.scaleTime().range([0, width]);
	// Linear scale
    var y = d3.scaleLinear().range([height, height - 250]);

    // Line graph
    var line = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d[yAttr]); });

    // g is a group of vectorial graphics
    var g = svg.append("g").attr("transform", "translate(10, 0)");

    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d[yAttr]; })]);

    g.selectAll("circle").data(data).enter()
    .append("circle")
    .attr("cx", function(d) { return x(d.date); })
    .attr("cy", function(d) { return y(d[yAttr]); })
    .attr("r", function(d, i) { return 5; })
    // .attr("id", function(d) { return d.id; })
    .style("fill", "#fcb0b5")
    .on("mouseover", function(event){

        const d = event.target.__data__;

        div.html(tooltipHtml(d))
        .style("left", (event.pageX + 20) + "px")
        .style("top", (event.pageY - 20) + "px")
        .style("opacity", .9);

        d3.select(this).transition().duration(200).style("fill", "#d30715");

        g.selectAll("#tooltip_path").data([d]).enter().append("line")
        .attr("id", "tooltip_path")
        .attr("class", "line")
        .attr("d", line)
        .attr("x1", function(d) {return x(d.date)})
        .attr("x2", function(d) {return x(d.date)})
        .attr("y2", height)
        .attr("y1", function(d) {return y(d[yAttr]);})
        .attr("stroke", "black")
        .style("stroke-dasharray", ("3, 3"));

    })
    .on("mouseout", function(d) {
        d3.select(this).transition().duration(500).style("fill", "#fcb0b5");
        g.selectAll("#tooltip_path").remove();
        div.style("opacity", 0).style("left", "0px").style("right", "0px")
    });

    g.selectAll("path").data([data]).enter().append("path")
    .attr("class", "line")
    .attr("d", line);

    svg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    svg.append("g")
    .attr("class", "axis axis--y")
    .attr("transform", "translate(0," + 0 + ")")
    .call(d3.axisLeft(y));

}

function getCountryData(data, countryCode) {
    /**
     * Since Country data appears to be in reverse order and has
     * a registry with accumulated summary, we should remove that
     * registry and reverse registries (from older to newer).
     */
    let countryRegistries = data.filter(d => d.countryterritoryCode == countryCode);
    countryRegistries.pop();  // remove summary registry

    return countryRegistries.reverse();
}

/**
 * On document ready ...
 *  - Load data
 *  - Filter by country
 *  - Show D3 SVG graphics
 */
document.addEventListener("DOMContentLoaded", async function(event) {
  const data = (await loadData()).map(preprocessData);
  console.log(data[0]);
  showGraph(getCountryData(data, 'AUT'), 'cases');
});
