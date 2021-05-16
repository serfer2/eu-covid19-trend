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

function roundToFive(num) {    
  return +(Math.round(num + "e+5")  + "e-5");
}

function addPercents(item) {
  item.cases_percent = roundToFive(item.cases * 100.0 / item.popData2020);
  item.deaths_percent = roundToFive(item.deaths * 100.0 / item.popData2020);
  return item;
}

document.addEventListener("DOMContentLoaded", async function(event) {
  const data = (await loadData()).map(addPercents);
  console.log(data[0]);
});
