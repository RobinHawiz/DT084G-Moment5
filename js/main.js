// Denna fil ska innehålla din lösning till uppgiften (moment 5).

"use strict";

/* Här under börjar du skriva din JavaScript-kod */

/* Här hämtar jag alla nödvändiga element som behövs för att implementera sidans funktionalitet. */
let navbar = document.getElementById("mainnavlist");
let schedule = document.getElementById("info");
let showNumRowsInput = document.getElementById("numrows");
let player = document.getElementById("player");
let radioPlayer = document.getElementById("radioplayer");
let playChannel = document.getElementById("playchannel");
let playButton = document.getElementById("playbutton");
let mainHeader = document.getElementById("mainheader");

/* En array vars element kommer att vara objekt, vilket representerar de nyligen spelade radio kanalerna. */
let recent = [];

/* Här befinner sig alla initiala funktionsanrop samt skapade event listeners. */
radioChannels();
showCurrentlyPlayingPrograms();
showRecentlyPlayedRadioChannels();
showNumRowsInput.addEventListener("change", showRadioChannels);
playButton.addEventListener("click", showRadioPlayer);

/* Hämtar data från Sveriges Radio API */
async function sverigesRadioAPI(url) {
  /* Vi väntar på att vi får informationen som behövs innan vi fortsätter i funktionen. */
  let response = await fetch(url);
  let data;
  /* Status koden är mellan 200 and 299. */
  if (response.ok) {
    data = response.json();
  } else {
    /* Status koden är övrig. */
    data = "error";
  }
  return data;
}
/* Skapar och visar listan som innehåller namnen på den yligen spelade radio kanalerna. Där den senaste spelade visas längst upp. */
function showRecentlyPlayedRadioChannels() {
  /* Skapar listan. */
  let select = document.createElement("select");
  select.className = "form-control";
  select.id = "recently-played";
  player.appendChild(select);

  /* Finns inte recent på localStorage så låter vi recent arrayen vara tom (det finns ju inget att lägga till ännu). */
  if (localStorage.getItem("recent") === null) {
    /* Gör inget. */
  } else {
    /* Hämtar en array med objekt som element. Objekten representerar de nyligen spelade radio kanalerna. Vars ordning spelar roll. Den första i listan är den senaste som spelats av användaren.*/
    recent = JSON.parse(localStorage.getItem("recent"));
    /* Skapar de senast valda radio kanalerna utifrån det som fanns på local storage. */
    for (let y = 0; y < recent.length; y++) {
      let option = document.createElement("option");
      option.innerHTML = recent[y].channelName;
      select.appendChild(option);
    }
  }
}

/* Uppdaterar listan med nyligen spelade radio kanaler när användaren trycker på spela knappen. */
function updateRecentlyPlayedRadioChannels(channelName) {
  /* Används för att kolla om radio kanalen redan finns i nyligen spelade listan. */
  let exists = false;
  /* Håller koll på vilken plats (index) radio kanalen befinner sig i om den redan finns i nyligen spelade listan. */
  let i = 0;
  for (let y = 0; y < recent.length; y++) {
    if (recent[y].channelName === channelName) {
      exists = true;
      break;
    }
    i++;
  }
  /* Om radio kanalen redan befinner sig i nyligen spelade listan, så tar vi bort den. */
  if (exists) {
    recent.splice(i, 1);
  }

  /* Här lägger vi till den nyss valda radio kanalen först i listan. */
  recent.unshift({ channelName: channelName });

  /* Vi uppdaterar nyligen spelade listan. */
  let select = document.getElementById("recently-played");
  select.innerHTML = "";
  for (let y = 0; y < recent.length; y++) {
    let option = document.createElement("option");
    option.innerHTML = recent[y].channelName;
    select.appendChild(option);
  }
  /* Spara ändringen i local storage. */
  localStorage.setItem("recent", JSON.stringify(recent));
}

/* Visar tablån för en vald radio kanal när man har tryckt på en valfri kanal från mainnavlist. */
async function showRadioChannelSchedule(channel) {
  mainHeader.style.backgroundColor = `${"#" + channel.color}`;
  /* data kommer antingen att bestå av json information om en vald radio kanals programtablå, eller en sträng som representerar en typ av error. */
  let data;
  /* Om kanalen inte har en länk till sin programtablå, då finns det ingen anledning för oss att försöka hämta data som inte finns. */
  if (typeof channel.scheduleurl === "undefined") {
    data = "Schedule undefined";
  } else {
    /* Hämtar data för första sidan av programtablån */
    data = await sverigesRadioAPI(channel.scheduleurl + "&format=json");
  }
  if (
    data === "error" ||
    data === "Schedule undefined" ||
    data.schedule[0].title === "Sändningsuppehåll"
  ) {
    /* Gör ingenting om programtablån av någon anledning inte finns tillgånglig. */
    schedule.innerHTML = "";
  } else {
    let channelSchedule = data.schedule;
    /* Behöver date objektet för att senare kunna jämföra nuvarande klockslag med radio kanalernas olika programtider. */
    let currentDateObject = new Date();
    /* i står för vilken sida vi ska bläddra till efter att vi har läst in datan från föregående sidan av programtablån. */
    let i = 2;
    schedule.innerHTML = "";
    while (channelSchedule.length != 0) {
      channelSchedule.forEach((element) => {
        let channelProgramStartAndEndTimeArr = timeFormatter(element);

        /* Dessa två kodrader existerar enbart så att vi kan jämföra radio kanalernas programstarttider med användarens nuvarande klockslag. */
        let startTimeArray = element.starttimeutc.match(/(\d+)/);
        let startTimeDateObject = new Date(Number(startTimeArray[0]));
        /* Om nuvarande klockslag inte ligger före ett program som ska spelas, så körs koden i if-satsen. */
        if (!(currentDateObject.getTime() > startTimeDateObject.getTime())) {
          /* Skapar tablåformatet */
          let article = document.createElement("article");
          let title = document.createElement("h3");
          let subtitle = document.createElement("h4");
          let scheduledTime = document.createElement("h5");
          let description = document.createElement("p");

          /* Lägger till relevant information om programmet som ska spelas. */
          title.innerHTML = `${element.title}`;
          /* Om underrubriken inte existerar så får <h4>-elementet en tom sträng. Finns ett värde så ger vi den istället. */
          subtitle.innerHTML =
            typeof element.subtitle !== "undefined"
              ? `${element.subtitle}`
              : "";
          scheduledTime.innerHTML = `${
            channelProgramStartAndEndTimeArr[0] +
            " - " +
            channelProgramStartAndEndTimeArr[1]
          }`;
          description.innerHTML = `${element.description}`;

          article.appendChild(title);
          article.appendChild(subtitle);
          article.appendChild(scheduledTime);
          article.appendChild(description);

          schedule.appendChild(article);
        }
      });
      /* Hämtar nästa sida i programtablån */
      data = await sverigesRadioAPI(
        channel.scheduleurl + "&format=json" + `${"&page=" + i}`
      );
      channelSchedule = data.schedule;
      i++;
    }
  }
}

/* Hämtar  radio kanalernas namn och beskrivning på skärmen. */
async function radioChannels() {
  let data = await sverigesRadioAPI(
    "https://api.sr.se/api/v2/channels/?format=json"
  );
  /* Kanalinformationen */
  let channels = data.channels;
  let i = 2;
  navbar.innerHTML = "";
  while (channels.length != 0) {
    /* Nu när vi har informationen som vi väntat på så kan vi använda den. */
    channels.forEach((element) => {
      /* Alla kanaler som vi hämtar vill vi visa i mainnavlist som ett <li>-element */
      const channel = document.createElement("li");
      /* Ger varje <li>-element en onclick som visar den tryckta radiokanalens programtablå på skärmen. */
      channel.onclick = async () => {
        await showRadioChannelSchedule(element);
      };

      /* Vi lägger till attributet title för att visa en beskrivning av kanalen när man har muspekaren på <li>-elementet */
      channel.setAttribute("title", `${element.tagline}`);
      /* <li>-elementets text representerar dess kanalnamn */
      channel.innerHTML = `${element.name}`;
      channel.style.display = "none";
      navbar.appendChild(channel);

      /* Här lägger vi till alla kanaler som man ska kunna lyssna live ifrån i vår radiospelare. */
      let option = document.createElement("option");
      option.setAttribute("value", element.id);
      /* Behövs för att vi i showRadioPlayer ska kunna välja detta option-element som användaren har valt.
      Detta eftersom att därifrån kallar vi på updateRecentlyPlayedRadioChannels och behöver namnet på radiokanalen som option-elementet har. */
      option.setAttribute("id", element.id);
      option.innerHTML = element.name;

      playChannel.appendChild(option);
    });
    /* Hämtar nästa sida i informationen om kanaler */
    data = await sverigesRadioAPI(
      "https://api.sr.se/api/v2/channels/?format=json" + `${"&page=" + i}`
    );
    channels = data.channels;
    i++;
  }
  /* Shows the initial number of channels in the navbar. */
  showRadioChannels();
}
/* Shows and hides the radio channels in the navbar. */
function showRadioChannels() {
  /* Tells us how many channels we have displayed so far. */
  let numberOfChannelsShown = 0;
  /* We hide all channels, in order to later show the amount of channels the user wants displayed. */
  navbar.childNodes.forEach((node) => {
    node.style.display = "none";
  });
  /* We loop until we have shown all the channels that the user wants displayed, which is dictated by the value in the input-element. */
  while (numberOfChannelsShown < showNumRowsInput.value) {
    /* If there are no more channels left then we exit the loop. */
    if (typeof navbar.childNodes[numberOfChannelsShown] === "undefined") {
      break;
    }
    navbar.childNodes[numberOfChannelsShown].style.display = "block";
    numberOfChannelsShown++;
  }
}

/* Visar en "radiospelare" som spelar en livesändning från den radiokanal som användaren har valt i dropdown menyn playchannel. */
function showRadioPlayer() {
  let currentlyPlayingAudio = document.getElementById("current-audio-playing");

  /* Om en radiospelare inte finns så skapar vi den. */
  if (currentlyPlayingAudio === null) {
    createRadioPlayer();
  } else {
    /* Radiospelaren uppdaterar inte sin livesändning om radiokanalen som har valts i select-elementet med id:et playchannel är densamma. */
    if (playChannel.value === currentlyPlayingAudio.getAttribute("value")) {
    } else {
      updateRadioPlayer(currentlyPlayingAudio);
    }
  }
}

/* Uppdaterar nuvarande radiospelare med en ny livesändning. */
function updateRadioPlayer(audio) {
  audio.setAttribute("value", `${playChannel.value}`);

  audio.src =
    "https://sverigesradio.se/topsy/direkt/" +
    `${playChannel.value}` +
    "-lo.mp3";
  /* load() används för att uppdatera ljud-/videoelementet efter att ha ändrat src eller andra inställningar. */
  audio.load();

  /* Spelar livesändningen när tillräckligt med data har laddats in. */
  audio.addEventListener("canplaythrough", audio.play());
  /* När användaren spelar en radio kanal så vill vi hämta namnet på radio kanalen och skicka med den till nyligen spelade listan. */
  let selectedOption = document.getElementById(playChannel.value);
  updateRecentlyPlayedRadioChannels(selectedOption.innerHTML);
}

/* Skapar den initiala radiospelaren. */
function createRadioPlayer() {
  let audio = document.createElement("audio");

  audio.setAttribute("controls", "");
  audio.setAttribute("id", "current-audio-playing");
  /* Används senare för att se ifall den nuvarande livesändningen spelas från samma radio kanal som den valda radio kanalen i select-elementet med id:et playchannel. */
  audio.setAttribute("value", `${playChannel.value}`);

  audio.src =
    "https://sverigesradio.se/topsy/direkt/" +
    `${playChannel.value}` +
    "-lo.mp3";
  /* load() används för att uppdatera ljud-/videoelementet efter att ha ändrat src eller andra inställningar. */
  audio.load();

  /* Spelar livesändningen när tillräckligt med data har laddats in. */
  audio.addEventListener("canplaythrough", audio.play());

  radioPlayer.appendChild(audio);

  /* När användaren spelar en radio kanal så vill vi hämta namnet på radio kanalen och skicka med den till nyligen spelade listan. */
  let selectedOption = document.getElementById(playChannel.value);
  updateRecentlyPlayedRadioChannels(selectedOption.innerHTML);
}

function timeFormatter(channelProgram) {
  /* Använder match med regEx. \d matchar en siffra och + ber match-metoden att fortsätta mata in siffror (i arrayen som skapas) tills vi når en annan karaktär (som inte är en siffra)*/
  let startTimeArray = channelProgram.starttimeutc.match(/(\d+)/);
  let endTimeArray = channelProgram.endtimeutc.match(/(\d+)/);
  /* Skapar Date-objekt för att sedan komma åt tiderna. */
  let startTimeDateObject = new Date(Number(startTimeArray[0]));
  let endTimeDateObject = new Date(Number(endTimeArray[0]));

  /* Nu tar vi ut tiden ur date-objekten och formaterar den på ett passande sätt. */
  let startTimeHours = `${startTimeDateObject.getHours()}`;
  let startTimeMinutes = `${startTimeDateObject.getMinutes()}`;

  let endTimeHours = `${endTimeDateObject.getHours()}`;
  let endTimeMinutes = `${endTimeDateObject.getMinutes()}`;

  let startTime;
  let endTime;

  switch (true) {
    case startTimeMinutes === "0":
      startTime =
        `${"0" + startTimeHours}`.slice(-2) + ":" + `${startTimeMinutes + "0"}`;
      break;
    case startTimeMinutes.length === 1:
      startTime =
        `${"0" + startTimeHours}`.slice(-2) + ":" + `${"0" + startTimeMinutes}`;
      break;
    default:
      startTime =
        `${"0" + startTimeHours}`.slice(-2) + ":" + `${startTimeMinutes}`;
      break;
  }

  switch (true) {
    case endTimeMinutes === "0":
      endTime =
        `${"0" + endTimeHours}`.slice(-2) + ":" + `${endTimeMinutes + "0"}`;
      break;
    case endTimeMinutes.length === 1:
      endTime =
        `${"0" + endTimeHours}`.slice(-2) + ":" + `${"0" + endTimeMinutes}`;
      break;
    default:
      endTime = `${"0" + endTimeHours}`.slice(-2) + ":" + `${endTimeMinutes}`;
      break;
  }

  return [startTime, endTime];
}

/* Visar de program som körs just nu på startsidan av de 10 första radio kanalerna som visas i navbaren. */
async function showCurrentlyPlayingPrograms() {
  let data = await sverigesRadioAPI(
    "https://api.sr.se/api/v2/channels/?format=json"
  );
  /* Behöver date objektet för att senare kunna jämföra nuvarande klockslag med radio kanalernas olika programtider. */
  let currentDateObject = new Date();
  /* Används för att se ifall man har hittat ett program som körs just nu. När den är false så fortsätter vi leta efter radio kanalens probramtablå tills vi hittar ett program som körs just nu. 
  När den är true så vill vi inte fortsätta iterera igenom nuvarande radio kanalens programtablån, så vi hoppar ut ur while-loopen och kollar en annan radio kanals programtablå. */
  let match = false;
  /* i står för vilken sida vi ska bläddra till efter att vi har läst in datan från föregående sidan av programtablån. Första sidan är ju 1, så i = 1. */
  let i = 1;
  for (let y = 0; y < data.channels.length; y++) {
    /* Radio kanalen, vars programtablå vi ska iterera igenom i nedanstående while-loop. */
    let radioChannel = data.channels[y];
    let channelName = radioChannel.name;
    let channelImageUrl = radioChannel.image;
    /* Vi sätter match till false igen för att while-loopen ska iterera igenom en annan radio kanals programtablå och i = 1 för att börja om letandet i första sidan av programtablån. */
    if (match === true) {
      match = false;
      i = 1;
    }
    let channelSchedule = await sverigesRadioAPI(
      radioChannel.scheduleurl + "&format=json" + `${"&page=" + i}`
    );
    while (!match) {
      for (let z = 0; z < channelSchedule.schedule.length; z++) {
        let element = channelSchedule.schedule[z];
        /* Dessa två kodrader existerar enbart så att vi kan jämföra radio kanalernas programstarttider med användarens nuvarande klockslag. */
        let endTimeArray = element.endtimeutc.match(/(\d+)/);
        let endTimeDateObject = new Date(Number(endTimeArray[0]));
        /* Vi vill visa de radioprogram som körs just nu. Därför jämför vi nuvarande klockslag med programmets sluttid. */
        if (!(currentDateObject.getTime() >= endTimeDateObject.getTime())) {
          let channelProgramStartAndEndTimeArr = timeFormatter(element);

          /* Skapar tablåformatet */
          let article = document.createElement("article");
          let title = document.createElement("h3");
          let subtitle = document.createElement("h4");
          let scheduledTime = document.createElement("h5");
          let description = document.createElement("p");

          let image = document.createElement("img");

          /* Lägger till relevant information om programmet som ska spelas. */
          title.innerHTML = `${channelName + " - " + element.title}`;
          /* Om underrubriken inte existerar så får <h4>-elementet en tom sträng. Finns ett värde så ger vi den istället. */
          subtitle.innerHTML =
            typeof element.subtitle !== "undefined"
              ? `${element.subtitle}`
              : "";
          scheduledTime.innerHTML = `${
            channelProgramStartAndEndTimeArr[0] +
            " - " +
            channelProgramStartAndEndTimeArr[1]
          }`;
          description.innerHTML = `${element.description}`;

          image.setAttribute("src", channelImageUrl);
          image.setAttribute("height", "25px");
          image.setAttribute("width", "25px");

          article.appendChild(title);
          article.appendChild(subtitle);
          article.appendChild(scheduledTime);
          article.appendChild(description);

          article.appendChild(image);

          schedule.appendChild(article);

          match = true;
          break;
        }
      }
      i++;
      channelSchedule = await sverigesRadioAPI(
        radioChannel.scheduleurl + "&format=json" + `${"&page=" + i}`
      );
    }
  }
}
