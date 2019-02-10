if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(function(reg) {
    if(reg.installing) {
      console.log('Service worker installing');
    } else if(reg.waiting) {
      console.log('Service worker installed');
    } else if(reg.active) {
      console.log('Service worker active');
    }
  }).catch(function(error) {
    console.log('Registration failed with ' + error);
  });
}


function showNotification(title,options,link) {
  if (!("Notification" in window)) {
    alert("This browser does not support system notifications");
  } else 
  if (Notification.permission === "granted") {
    var notification = new Notification(title, options);
  } else 
  if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      if (permission === "granted") {
        let notification = new Notification(title, options);
      }
    });
  }
  notification.onclick = function(event) {
    window.open(link, '_blank');
  }
}



function fullDate(startDate, endDate) {
  const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
  ];

  let start = new Date(startDate);
  let end = new Date(endDate);
  let startYear = start.getFullYear();
  let startMonth = start.getMonth();
  let endMonth = end.getMonth();
  let startMonthName = monthNames[startMonth];
  let startDay = start.getDate();
  let endDay = end.getDate();
  let stringDate = startMonthName;
  stringDate += ' ' + startDay;
  if ((startDay != endDay)||(startMonth != endMonth)) {
   stringDate += '-' + endDay;
  }
  return {
    stringDate: stringDate,
    year: startYear,
    month: startMonthName
  }
}

function insertTitle(conferencesList, before, actual, className) {
  if (before != actual) {
    before = actual;
    title = document.createElement('dt');
    title.className = className;
    title.innerHTML = `<span>${before}<span>`;
    conferencesList.appendChild(title);
  }
  return before;
}


function renderCalendar(data) {
  const container = document.getElementById('calendar');
  let conferencesList = document.createElement('dl');
  let monthBefore, yearBefore;
  let now = new Date().getTime()/1000;

  conferencesList.className = 'events';
  container.appendChild(conferencesList);

  for (var i = 0; i < data.length; i++) {
    if (now > data[i].startDateUnix) {
      continue;
    }
    let result = fullDate(data[i].startDate, data[i].endDate);
    yearBefore = insertTitle(conferencesList, yearBefore, result.year, 'year_title');
    monthBefore = insertTitle(conferencesList, monthBefore, result.month, 'month_title');
    

    let conference = document.createElement('dd');
    conference.innerHTML = `
      <div class="event-title">
      <div data-id="${i}" class="alert"></div>
      <a href="${data[i].url}"></a>
      </div>
      <div>${data[i].city},  ${result.stringDate}</div>`;
    conference.querySelector('a').textContent += data[i].name;
    conferencesList.appendChild(conference);
  }
  initializationCalendar();
}


let eventsData = {};


fetch('/conferences.json').then(function(response) {  
  if (response.status !== 200) {  
    console.log('Problem. Status Code: ' + response.status);  
    return;  
  }
  response.json().then(function(data) {          
    eventsData = data.results[0].hits;
    renderCalendar(data.results[0].hits);
    addListener();
  });  
}  
)  
.catch(function(err) {  
  console.log('Fetch Error :', err);  
});




function addListener() {
  let events = document.querySelector(".events");
  events.addEventListener("click", function(e) {
    let toggleButton = e.target;
    if (toggleButton.classList.contains("alert")) {
      if (toggleButton.classList.toggle('on')) {
        addNotificationList(toggleButton.dataset.id);
      } else {
        deleteNotificationList(toggleButton.dataset.id);    
      }
    }
  });    
}

let alertDay = [3,7,14];
let notificationList = [{id:0, start:0}];


function initializationCalendar() {
  let flag = [];
  let localData = localStorage.getItem("notificationList");

  if (localData != null) {
     notificationList = JSON.parse(localData); 
    for (var i = 1; i < notificationList.length; i++) {
      if (flag[i] == undefined) {
        console.log(flag[i]);
        flag[i] = true;
        let toggleButton = document.querySelector('div[data-id="'+notificationList[i].id+'"]');
        toggleButton.classList.add("on");
      }
    }
  }
}


function addNotificationList(eventId) {
  const day = 60*60*24;
  let now = new Date().getTime()/1000;
  let listJson;
  for (var i = 0; i < alertDay.length; i++) {
    for (var j = notificationList.length-1; j >= 0; j--) { 
      let notificationTime = eventsData[eventId].startDateUnix - (day * alertDay[i]);
      if ((notificationTime > notificationList[j].start)&&(notificationTime >= now)) {
        notificationList.splice(j+1, 0, {id:eventId, start:notificationTime, dayBefore:alertDay[i]});
        listJson = JSON.stringify(notificationList); 
        break;
      }
    }
  }
  localStorage.setItem("notificationList", listJson);
  let title = 'You will be notified';
  let options = {body: 'Conference '+eventsData[eventId].name+' start \n'+eventsData[eventId].startDate};
  let link = eventsData[eventId].url;
  showNotification(title,options,link);
};

function deleteNotificationList(eventId) {
  for (var i = 0; i < notificationList.length; i++) {
    if (notificationList[i].id == eventId) {
      notificationList.splice(i, 1);
      i--;
    }
  }
  let listJson = JSON.stringify(notificationList); 
  localStorage.setItem("notificationList", listJson);
}

let infelicity = 60;

function checkNotification () {
  let now = new Date().getTime()/1000;
  if ((notificationList.length>1)&&(now >= notificationList[1].start)&&((now - infelicity)<=notificationList[1].start)) {
    let title = eventsData[notificationList[1].id].name;
    let options = {body: 'Your conference will be in '+notificationList[1].dayBefore+' days\n'+eventsData[notificationList[1].id].startDate};
    let link = eventsData[notificationList[1].id].url;
    showNotification(title,options,link);
    notificationList.splice(1, 1);
    let listJson = JSON.stringify(notificationList); 
    localStorage.setItem("notificationList", listJson);
  }
}
setInterval(checkNotification, 1000);




function getJSON () {
  let data = '{"requests":[{"indexName":"prod_conferences","params":"query=&hitsPerPage=200&maxValuesPerFacet=100&page=0&highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&filters=startDateUnix%3E1548774669&facets=%5B%22topics%22%2C%22country%22%5D&tagFilters=&facetFilters=%5B%5B%22topics%3Ajavascript%22%2C%22topics%3Acss%22%2C%22topics%3Aux%22%5D%5D"},{"indexName":"prod_conferences","params":"query=&hitsPerPage=1&maxValuesPerFacet=100&page=0&highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&filters=startDateUnix%3E1548774669&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=topics"}]}';
  
  fetch("https://29flvjv5x9-2.algolianet.com/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20vanilla%20JavaScript%20(lite)%203.32.0%3Breact-instantsearch%205.3.2%3BJS%20Helper%202.26.1&x-algolia-application-id=29FLVJV5X9&x-algolia-api-key=f2534ea79a28d8469f4e81d546297d39",
  {
      method: "POST",
      body: data
  })
  .then(function (response) {
      return response.json();
  })
  .then(function (result) {
      console.log( JSON.stringify(result));
  })
  .catch (function (error) {
      console.log('Request failed', error);
  });
}










