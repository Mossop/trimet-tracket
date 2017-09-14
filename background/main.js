const URL_ARRIVALS = "https://developer.trimet.org/ws/V1/arrivals";

const UPDATE_TIMER = 60000;

let timer = null;
let ports = [];

async function getStops() {
  let results = await browser.storage.sync.get({ stops: [] });
  if (!("stops" in results)) {
    console.log("Missing stops", []);
    return [];
  } else {
    console.log("Got stops", results.stops);
    return results.stops;
  }
}

function setStops(stops) {
  return browser.storage.sync.set({ stops });
}

async function update() {
  timer = null;

  let stops = await getStops();
  if (stops.length == 0) {
    timer = setTimeout(update, UPDATE_TIMER);

    for (let port of ports) {
      port.postMessage({
        message: "arrivals",
        data: [],
      });
    }

    return;
  }

  let url = new URL(URL_ARRIVALS);
  url.searchParams.set("locIDs", stops.join(","));
  url.searchParams.set("appID", APP_ID);
  url.searchParams.set("json", "true");

  let response = await fetch(url.href);
  if (response.ok) {
    let json = await response.json();

    let stops = {};
    let stopData = [];
    for (let location of json.resultSet.location) {
      let stop = {
        id: location.locid,
        long: location.lng,
        lat: location.lat,
        name: location.desc,
        arrivals: [],
      };

      stops[location.locid] = stop;
      stopData.push(stop);
    }

    for (let arrival of json.resultSet.arrival) {
      stops[arrival.locid].arrivals.push({
        scheduled: new Date(arrival.scheduled),
        estimated: new Date(arrival.estimated),
      });
    }

    for (let port of ports) {
      port.postMessage({
        message: "arrivals",
        data: stopData,
      });
    }
  } else {
    console.error(response.statusText);
  }

  timer = setTimeout(update, UPDATE_TIMER);
}

function newListener(port) {
  ports.push(port);
  port.onDisconnect.addListener(() => {
    ports = ports.filter(p => p != port);
    if (ports.length == 0) {
      clearTimeout(timer);
      timer = null;
    }
  });

  port.onMessage.addListener(async function(message) {
    switch (message.message) {
      case "addStop": {
        let stops = await getStops();
        stops.push(message.data);
        console.log("Set stops to", stops);
        await setStops(stops);

        clearTimeout(timer);
        update();
        break;
      }
      case "removeStop": {
        let stops = await getStops();
        stops = stops.filter(s => s != message.data);
        console.log("Set stops to", stops);
        await setStops(stops);

        clearTimeout(timer);
        update();
        break;
      }
      default: {
        console.error("Unexpected message", message.message);
      }
    }
  });

  if (!timer) {
    update();
  }
}

browser.runtime.onConnect.addListener(newListener);
