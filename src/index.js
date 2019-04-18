import "babel-polyfill";
import Chart from "chart.js";
import { ENODEV } from "constants";

let currencyURL;
let meteoURL;
if (process.env.NODE_ENV == "production") {
  meteoURL = "https://xml.meteoservice.ru/export/gismeteo/point/140.xml";
  // currencyURL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
}
if (process.env.NODE_ENV == "development") {
  meteoURL = "/xml.meteoservice.ru/export/gismeteo/point/140.xml";
  // currencyURL = "www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
}
// Опции для отображения графика
const options = {
  scales: {
      xAxes: [{
          type: 'time',
          time: {
              displayFormats: {
                  quarter: 'h:mm D-MMM-YYYY'
              }
          }
      }]
  }
}

/**
 * Позволяет делать "универсальный запрос" к API c XML
 * для получения данных для графика
 * @param {String} url Необходимый URL
 * @param {Object} queryObj Объект ("ТЕГ" => ["аттрибуты"])
 */
async function loadChartData(url, queryObj) {
  // const response = await fetch(url);
  // const responseBody = await response.text();
  const responseBody = await fetch(url)
    .then((res) => res.text())
    .then((data) => data);
  
  const parsedDOM = new DOMParser().parseFromString(responseBody, "text/xml");
  
  // Составляем запрос для селектора
  let queryItems = [];
  for (const tag of Object.keys(queryObj)) {
    let queryItem = "";
    queryItem += tag;
    if (queryObj[tag] !== undefined) {
      for (const attr of queryObj[tag]) {
        queryItem += `[${attr}]`;
      }
    }
    queryItems.push(queryItem);
  }
  const queryString = Array.join(queryItems, ',');

  const data = parsedDOM.querySelectorAll(queryString);
  const result = Object.create(null);
  result.hasOwnProperty = Object.hasOwnProperty;

  // Добавляем нужные данные в соответствующие треки
  for (const tag of data) {
    let values = []
    if (!result.hasOwnProperty(tag.nodeName)) {
      result[tag.nodeName] = [];
    }
    for (const attr of queryObj[tag.nodeName]) {
      values.push(tag.getAttribute(attr));
    }
    result[tag.nodeName].push(values);
  }
  // Избавляемся от ненужной функции
  delete result.hasOwnProperty;
  return result;
}

const buttonBuild = document.getElementById("btn");
const canvasCtx = document.getElementById("out").getContext("2d");

buttonBuild.addEventListener("click", async function() {
  const queryObject = {
    "FORECAST" : ["day", "month", "year", "hour"],
    "TEMPERATURE" : ["min", "max"],
    "HEAT" : ["min", "max"]
  }
  let parseTime = document.getElementById("parseTime").checked;

  // const quer = { "Cube":["currency", "rate"] }
  const tempData = await loadChartData(meteoURL, queryObject);

  const time = tempData["FORECAST"].map((time) => {
    if (!parseTime)
        return `${time[3]}:00 ${time[0]}-${time[1]}-${time[2]}`;
    return new Date(`${time[2]}-${time[1]}-${time[0]}T${time[3]}:00`);
  });

  const temp_min = [];
  const temp_max = [];
  for (const temp of tempData["TEMPERATURE"]) {
    temp_min.push(temp[0]);
    temp_max.push(temp[1]);
  }

  const heat = tempData["HEAT"].map((temp) => {
    return temp[1];
  });

  const chartConfig = {
    type: "line",

    data: {
      labels: time,
      datasets: [
        {
          label: "Минимальная температура",
          
          fill : false,
          backgroundColor: "rgb(219, 219, 219)",
          borderColor: "rgb(180, 0, 0)",

          data: temp_min,
        },
        {
          label: "Максимальная температура",

          fill: "-1",
          backgroundColor: "rgb(219, 219, 219)",
          borderColor: "rgb(0, 180, 0)",
          
          data: temp_max,
        },
        {
          label: "Ощущается",

          fill: false,
          backgroundColor: "rgb(20, 20, 255)",
          borderColor: "rgb(0, 0, 180)",

          data: heat
        }
      ]
    },
  };

  if (window.chart) {
    chart.data.labels = chartConfig.data.labels;
    for (let i = 0; i < chart.data.datasets.length; i++) {
      chart.data.datasets[i].data = chartConfig.data.datasets[i].data;
    }
    if (parseTime) {
      chart.options = options;
    } else {
      chart.options = Object.create(null);
    }
    chart.update({
      duration: 800,
      easing: "easeOutBounce"
    });
  } else {
    if (parseTime) { chartConfig.options = options; }
    window.chart = new Chart(canvasCtx, chartConfig);
  }
});