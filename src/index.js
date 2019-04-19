import 'babel-polyfill';
import Chart from 'chart.js';

const currencyURL = 'www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
// const meteoURL = '/xml.meteoservice.ru/export/gismeteo/point/140.xml';

async function loadCurrency() {
  const xmlBody = await fetch(currencyURL)
    .then((res) => res.text())
    .then((data) => data);
  const currencyData = new DOMParser().parseFromString(xmlBody, 'text/xml');
  const rates = currencyData.querySelectorAll('Cube[currency][rate]');
  const result = Object.create(null);
  for (const rateTag of rates) {
    const rate = rateTag.getAttribute('rate');
    const currency = rateTag.getAttribute('currency');
    result[currency] = rate;
  }
  result['EUR'] = 1;
  return result;
}

function normalizeDataByCurrency(data, currency) {
  const result = Object.create(null);
  const value = data[currency];
  for (const key of Object.keys(data)) {
    result[key] = value / data[key];
  }
  return result;
}

const buttonBuild = document.getElementById('btn');
const canvasCtx = document.getElementById('out').getContext('2d');

buttonBuild.addEventListener('click', async function() {
  const currencyData = await loadCurrency();
  const normalData = normalizeDataByCurrency(currencyData, 'RUB');
  const keys = Object.keys(normalData).sort((k1, k2) => {
    return normalData[k1] > normalData[k2]? 1 : -1;
  });
  const plotData = keys.map(key => normalData[key]);

  const chartConfig = {
    type: 'line',

    data: {
      labels: keys,
      datasets: [
        {
          label: 'Стоимость валюты в рублях',
          backgroundColor: 'rgb(255, 20, 20)',
          borderColor: 'rgb(180, 0, 0)',
          data: plotData
        }
      ]
    }
  };

  if (window.chart) {
    chart.data.labels = chartConfig.data.labels;
    chart.data.datasets[0].data = chartConfig.data.datasets[0].data;
    chart.update({
      duration: 800,
      easing: 'easeOutBounce'
    });
  } else {
    window.chart = new Chart(canvasCtx, chartConfig);
  }
});