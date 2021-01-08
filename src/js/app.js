// URL, API
const transitURL = "https://api.winnipegtransit.com/v3/trip-planner.json";
const baseURL = "https://api.mapbox.com/geocoding/v5/mapbox.places/";
const transitAPI = "DdaRse4MoTngI6-lA6Cf";
const API = "pk.eyJ1Ijoibmd1eWVuaHVuZ3BodTc3NyIsImEiOiJja2psanoxOXAwemg5MnFxeXQyMHV6M2s4In0.Mmge4RRo03t0OWuVuHSdKQ"
const bBoxCoordinateOfWinnipeg = '-97.325875,49.766204,-96.953987,49.99275'
// DOM query
const originInput = document.querySelector('.origin-form')
const originList = document.querySelector('.origins')
const destinationInput = document.querySelector('.destination-form')
const destinationList = document.querySelector('.destinations')
const trip = document.querySelector('.my-trip')
const altTrip = document.querySelector('.alt-trip')
const planTripButton = document.querySelector('.plan-trip')
const errorMessage = document.querySelector('#error-msg')
// DOM manipulation
trip.innerHTML = "";
destinationList.innerHTML = "";
originList.innerHTML = "";
// Global Variables
let originLong, originLat, destLong, destLat, originCoordinate, destCoordinate;
let originInputResult, destinationInputResult;
// Boolean value
let distinct;

// Fetching API
function locateLocationWithGeoCode(location, distinct) {
  if (location !== "") {
    fetch(`${baseURL}${location}.json?&limit=10&bbox=${bBoxCoordinateOfWinnipeg}&access_token=${API}`)
    .then(resp => resp.json())
    .then(data => {
      if (distinct === false) {
        renderOriginResult(data)
      } else {
        renderDestinationResult(data)
      }
    })
    .catch(err => console.log(err))
  }
}

function planTrip() {
  fetch(`${transitURL}?api-key=${transitAPI}&origin=geo/${originCoordinate}&destination=geo/${destCoordinate}`)
  .then(resp => {
    if (resp.ok) {
      return resp.json();
    } else if (resp.status === 404) {
      trip.insertAdjacentHTML('beforeend', 'No trips data is available');
    }
  })
  .then(data => { renderRecommendedTrip(data) })
  .catch(err => console.log(err))
}

// Function
function renderOriginResult(arrOfLocation) {
  arrOfLocation.features.forEach(element => {
    let locationAddress = element['place_name'].split(',');
    originList.insertAdjacentHTML('beforeend', `
    <li data-long=${element.center[0]} data-lat=${element.center[1]} >
      <div class="name">${element.text}</div>
      <div>${locationAddress[1]}</div>
    </li>
    `)
  });
}

function renderDestinationResult(arrOfLocation) {
  arrOfLocation.features.forEach(element => {
    let locationAddress = element['place_name'].split(',');
    destinationList.insertAdjacentHTML('beforeend', `
    <li data-long=${element.center[0]} data-lat=${element.center[1]} >
      <div class="name">${element.text}</div>
      <div>${locationAddress[1]}</div>
    </li>
    `)
  });
}

function renderRecommendedTrip(data) {
  dataArr = [data.plans[0], data.plans[1]]

  let recIndex = 0;
  let endOfArr = false;
  trip.innerHTML = "Recommended Route";

  for (let e = 0; e < dataArr.length; e++) {
    dataArr[e].segments.forEach(element => {
      let timeStart = element.times.start, timeEnd = element.times.end;
      if (element.type == "walk") {
        if (recIndex === dataArr[e].segments.length - 1) {
          endOfArr = false;
          renderWalkLI(element, timeStart, timeEnd, endOfArr)
        } else {
          endOfArr = true;
          renderWalkLI(element, timeStart, timeEnd, endOfArr)
        }
      } else if (element.type == "ride") {
        renderRideLI(element, timeStart, timeEnd)
      } else if (element.type == "transfer") {
        renderTransferLI(element)
      }
      recIndex++;
    })
    if (e == 0) {
      trip.insertAdjacentHTML('beforeend', "Alternative Route")
      recIndex = 0;
    }
  }
}

function renderWalkLI(data, timeStart, timeEnd, endOfArr) {
  if (endOfArr === false) {
    trip.insertAdjacentHTML('beforeend', `
    <li>
      <i class="fas fa-walking" aria-hidden="true"></i> Walk 
      for ${calculateTimeDifferent(timeStart, timeEnd)} minutes 
      to your destination
    </li>
    `)
  } else {
    trip.insertAdjacentHTML('beforeend', `
    <li>
      <i class="fas fa-walking" aria-hidden="true"></i> Walk 
      for ${calculateTimeDifferent(timeStart, timeEnd)} minutes 
      to stop #${data.to.stop.key} - ${data.to.stop.name}
    </li>
    `)
  }

}

function renderRideLI(data, timeStart, timeEnd) {
  trip.insertAdjacentHTML('beforeend', `
  <li>
    <i class="fas fa-bus" aria-hidden="true"></i> Ride the ${data.route.name} 
    for ${calculateTimeDifferent(timeStart, timeEnd)} minutes
  </li>
  `)
}

function renderTransferLI(data) {
  trip.insertAdjacentHTML('beforeend', `
  <li>
    <i class="fas fa-ticket-alt" aria-hidden="true"></i> Transfer from stop 
     #${data.from.stop.key} - ${data.from.stop.name} to stop #${data.to.stop.key} - ${data.to.stop.name}
  </li>
  `)
}

function calculateTimeDifferent(time1, time2) {
  let t1 = new Date(time1),
    t2 = new Date(time2);
  return new Date(t2 - t1).getMinutes();
}

// Eventlistener
planTripButton.addEventListener('click', e => {
  errorMessage.style.display = "block";

  if ((originInputResult != "", originInputResult != undefined) && (destinationInputResult == "", destinationInputResult == undefined)) {
    errorMessage.innerText = "Destination are missing"
  } if ((originInputResult == "", originInputResult == undefined) && (destinationInputResult != "", destinationInputResult != undefined)) {
    errorMessage.innerText = "Origin destination are missing"
  } if ((originInputResult != "", originInputResult != undefined) && (destinationInputResult != "", destinationInputResult != undefined)) {
    if (originInputResult.toLowerCase() == destinationInputResult.toLowerCase()) {
      errorMessage.innerText = "Origin and Destination are the same"
    } else {
      planTrip();
    }
  } if ((originInputResult == "", originInputResult == undefined) && (destinationInputResult == "", destinationInputResult == undefined)) {
    errorMessage.innerText = "Origin and Destination are missing"
  }
})

originList.addEventListener('click', e => {
  let selectedOriginLocation = document.querySelector('.origins > .selected')

  if (e.target.tagName === 'DIV' || e.target.tagName === 'LI') {
    if (selectedOriginLocation != null) {
      selectedOriginLocation.classList.remove('selected');
    }
    e.target.closest('ul > li').classList.add('selected')
    originLong = e.target.closest('ul > li').getAttribute('data-long');
    originLat = e.target.closest('ul > li').getAttribute('data-lat');
    originCoordinate = `${originLat},${originLong}`;
  }
})

destinationList.addEventListener('click', e => {
  let selectedOriginLocation = document.querySelector('.destinations > .selected')

  if (e.target.tagName === 'DIV' || e.target.tagName === 'LI') {
    if (selectedOriginLocation != null) {
      selectedOriginLocation.classList.remove('selected');
    }
    e.target.closest('ul > li').classList.add('selected')
    destLong = e.target.closest('ul > li').getAttribute('data-long');
    destLat = e.target.closest('ul > li').getAttribute('data-lat');
    destCoordinate = `${destLat},${destLong}`
  }
})

originInput.onsubmit = event => {
  originList.innerHTML = "";
  errorMessage.innerText = "";
  distinct = false;
  let input = event.target.querySelector('input')
  originInputResult = input.value;
  locateLocationWithGeoCode(input.value, distinct);
  event.preventDefault();
}

destinationInput.onsubmit = event => {
  destinationList.innerHTML = "";
  errorMessage.innerText = "";
  distinct = true;
  let input = event.target.querySelector('input')
  destinationInputResult = input.value;
  locateLocationWithGeoCode(input.value, distinct);
  event.preventDefault();
}