let country_code = 'ESP';
let countries_data = null;

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
function showCountryHtml(d) {
    let html = `<h2>${d.name}</h2>`;
    html += '<div class="row">';
    html += `<div class="floating"><b>Country:</b> <a href="${d.link}" target=_blank>${d.name} (${d.country_code}).</a></div><div class="floating"><b>Population:</b> ${d.population.toLocaleString()}</div>`;
    html += '</div>';
    html += '<div class="row">';
    html += '<div class="floating"><h3>Cases</h3></div>';
    html += '<div class="floating"><table>';
    html += '<tr><th>Total</th><th>Total vs population</th><th>Last 30d</th><th>Last 7d</th></tr>';
    html += `<tr><td>${d.total_cases.toLocaleString()}</td><td>${d.total_pcnt_cases.toLocaleString()} %</td><td>${d.last_month_cases.toLocaleString()}</td><td>${d.last_week_cases.toLocaleString()}</td></tr>`;
    html += '</table></div>';
    html += '</div>';
    html += '<div class="row">';
    html += '<div class="floating"><h3>Deaths</h3></div>';
    html += '<div class="floating"><table>';
    html += '<tr><th>Total</th><th>Total vs population</th><th>Last 30d</th><th>Last 7d</th></tr>';
    html += `<tr><td>${d.total_deaths.toLocaleString()}</td><td>${d.total_pcnt_deaths.toLocaleString()} %</td><td>${d.last_month_deaths.toLocaleString()}</td><td>${d.last_week_deaths.toLocaleString()}</td></tr>`;
    html += '</table></div>';
    html += '</div>';

    d3.select("#country_data").html(html);
}

function showGraph(data, yAttr) {
    // Margin setup
    var margin = {top: 100, right: 100, bottom: 20, left: 100};
    var width = 900 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    d3.select("#graph_tooltip").remove();

    var div = d3.select("body")
	    .append("div")
	    .attr("id", "graph_tooltip")
        .attr("class", "tooltip")
	    .style("opacity", 0)
        .style("display", "none");

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
    var g = svg.append("g").attr("transform", "translate(0, 0)");

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
        .style("opacity", .9)
        .style("display", "block");

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
        div.style("opacity", 0)
        .style("left", "0px")
        .style("right", "0px")
        .style("display", "none")
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

function getCountryRegistries(countryCode) {
    /**
     * Since Country data appears to be in reverse order and has
     * a registry with accumulated summary, we should remove that
     * registry and reverse registries (from older to newer).
     */
    let countryRegistries = countries_data.filter(d => d.countryterritoryCode == countryCode);
    countryRegistries.pop();  // remove summary registry

    return countryRegistries.reverse();
}

function getCountrySummary(countryCode) {
    /**
     * Since Country data appears to be in reverse order and has
     * a registry with accumulated summary, we should remove that
     * registry and reverse registries (from older to newer).
     */
    let countryRegistries = countries_data
        .filter(d => d.countryterritoryCode == countryCode)
        .reverse();
    const first_registry = countryRegistries.shift();  // first registry is a summary
    let country_summary = {
        name: first_registry.countriesAndTerritories,
        country_code: first_registry.countryterritoryCode,
        total_cases: first_registry.cases,
        total_deaths: first_registry.deaths,
        population: parseInt(first_registry.popData2020),
        last_week_cases: 0,
        last_month_cases: 0,
        last_week_deaths: 0,
        last_month_deaths: 0,
        total_pcnt_cases: 0,
        total_pcnt_deaths: 0,
        link: '',
    };
    var pos = countryRegistries.length - 1;
    for (var i = 0; i < 7; i++) {
        country_summary.last_week_deaths += countryRegistries[pos - i].deaths;
        country_summary.last_week_cases += countryRegistries[pos - i].cases;
    }
    pos = countryRegistries.length - 1;
    for (var i = 0; i < 30; i++) {
        country_summary.last_month_deaths += countryRegistries[pos - i].deaths;
        country_summary.last_month_cases += countryRegistries[pos - i].cases;
    }
    for (var i = 0; i < countryRegistries.length; i++) {
        country_summary.total_deaths += countryRegistries[i].deaths;
        country_summary.total_cases += countryRegistries[i].cases;
    }
    country_summary.total_pcnt_deaths = roundTo(country_summary.total_deaths * 100 / country_summary.population, 2);
    country_summary.total_pcnt_cases = roundTo(country_summary.total_cases * 100 / country_summary.population, 2);
    country_summary.link = `https://en.wikipedia.org/wiki/${country_summary.name}`;

    return country_summary;
}

function getCountries() {
    /**
     * Returns an array of 'name' and 'code' for all unique
     * countries that appears in countries_data.
     */
    var countries = [];
    let seen_countries = {}
    for (var item, i = 0; item = countries_data[i++];) {
        if (!(item.countriesAndTerritories in seen_countries)) {
            seen_countries[item.countriesAndTerritories] = item.countryterritoryCode;
            countries.push({
                'name': item.countriesAndTerritories,
                'code': item.countryterritoryCode,
            });
        }
    }
    return countries;
}

function showSelector() {
    /**
     * Draows a selector with options for selecting any country
     * present in countries_data.
     * When selection changes, it shows that country data.
     */
    const countries = getCountries();

    var select = d3.select('#countries')
    .append('select')
    .attr('class','select')
    .on('change', select_country);

    select
    .selectAll('option')
    .data(countries).enter()
    .append('option')
    .text(function (d) { return d.name; })
    .attr('value', function (d) { return d.code })
    .attr('id', function (d) { return `opt_${d.code}` });

    d3.select(`#opt_${country_code}`)
    .property('selected', true);

}

function select_country() {
    /**
     * Refresh screen shown data according to selected country.
     */
    country_code = d3.select('select').property('value');
    d3.select('#graph').html('');
    d3.select('#country_data').html('');
    showGraph(getCountryRegistries(country_code), 'cases');
    showCountryHtml(getCountrySummary(country_code));
};

/**
 * On document ready ...
 *  - Load data
 *  - Filter by country
 *  - Show D3 SVG graphics
 *  - Show country selector
 */
document.addEventListener("DOMContentLoaded", async function(event) {
    countries_data = (await loadData()).map(preprocessData);
    showGraph(getCountryRegistries(country_code), 'cases');
    showCountryHtml(getCountrySummary(country_code));
    showSelector();
});
