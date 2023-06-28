const socket = new WebSocket('wss://api.geops.io/realtime-ws/v1/?key=5cc87b12d7c5370001c1d655112ec5c21e0f441792cfc2fafe3e7a1e');

var currentTrain;
var currentInfotainmentIndex = 0;
var infotainmentQueue = Object.seal(["https://assets.static-bahn.de/dam/jcr:5e33cbde-1254-4241-a8d4-2f6dcb605d47/220202_1080p_Erklaervideo_Simpleshow_Folienballons.mp4","https://assets.static-bahn.de/dam/jcr:6b82b65c-3cd4-4915-b02c-8fa5abde431e/220202_1080p_Erklaervideo_Simpleshow_SauberkeitImZug.mp4","https://assets.static-bahn.de/dam/jcr:da1188f1-8293-4351-8ac7-f26d1dbb4b5c/220202_1080p_Erklaervideo_Simpleshow_PersonenImGleis.mp4","https://assets.static-bahn.de/dam/jcr:a0c7be5c-39a1-4cac-8593-26ef12b8dea9/220202_1080p_Erklaervideo_Simpleshow_Tuerstoerung.mp4","https://assets.static-bahn.de/dam/jcr:49af3eb3-ff25-4de5-97a8-3f8ce9aa4f3a/220202_1080p_Erklaervideo_Simpleshow_Bahn%C3%BCberg%C3%A4nge_Clip01.mp4","https://assets.static-bahn.de/dam/jcr:6b82b65c-3cd4-4915-b02c-8fa5abde431e/220202_1080p_Erklaervideo_Simpleshow_SauberkeitImZug.mp4"]);

var stationDataJson = '{"München Ost":{"nameDE":"Ostbahnhof","nameEN":"Munich East"},"Flughafen/Airport ✈":{"nameDE":"Flughafen München","nameEN":"Airport"},"München Karlsplatz":{"nameDE":"Karlsplatz (Stachus)"},"München Hbf (tief)":{"nameDE":"Hauptbahnhof","nameEN":"Central Station"},"München-Pasing":{"nameDE":"Pasing"}}';
var stationData = JSON.parse(stationDataJson);

socket.onopen = function(e) {

}

socket.onmessage = function(e) {
    var wsContent = JSON.parse(e.data).content;

    if(wsContent.length > 0) {
        setupLine(wsContent[0]);
    }
}

socket.onerror = function(e) {
    alert(`[ERROER] ${e.message}`);
}

socket.onclose = function(e) {

}

function setupLine(lineData) {
    console.log(lineData);
    document.getElementById("finalDestinationDE").innerText = getStationNameDE(lineData.destination);
    var lineColouredElements = document.getElementsByClassName("lineColoured")
    for (let i = 0; i < lineColouredElements.length; i++) {
        lineColouredElements[i].style.backgroundColor = lineData.stroke;
    }

    var stations = lineData.stations;
    stations.forEach(element => {
        console.log(element.stationName);
    });

    stations.every(element => {
        document.getElementById("nextStopDE").innerText = getStationNameDE(element.stationName);

        if(element.state != "LEAVING") {
            if(getStationNameEN(element.stationName) != null) {
                document.getElementById("nextStopEN").innerText = getStationNameEN(element.stationName);
                document.getElementById("nextStopEN").style.display = "revert";
            }
            else {
                document.getElementById("nextStopEN").style.display = "none";
            }
            
            if(element.state == "BOARDING") {
                document.getElementById("stationActionDE").innerText = "Abfahrt";
                document.getElementById("stationActionEN").innerText = "Departure";
            }
            else {
                document.getElementById("stationActionDE").innerText = "Nächster Halt";
                document.getElementById("stationActionEN").innerText = "Next stop";
            }
            
            return false;
        }

        return true;
    });

}

function getStationNameDE(stationName) {
    if(stationData[stationName] != undefined) {
        if(stationData[stationName].nameDE != undefined)
        {
            return stationData[stationName].nameDE;
        }
    }

    if(stationName.startsWith("München ")) {
        return stationName.substring(8);
    }

    return stationName;
}

function getStationNameEN(stationName) {
    if(stationData[stationName] != undefined) {
        if(stationData[stationName].nameEN != undefined)
        {
            return stationData[stationName].nameEN;
        }
    }
    return null;
}

function debugSearchTrainID() {
    var trainID = document.getElementById("input_dbgTrainID").value;
    socket.send(`GET stopsequence_${trainID}`);
    console.log(`GET stopsequence_${trainID}`);
}

//#region Independent visual elements
function updateClock() {
    var date = new Date();
    var h = date.getHours();
    var m = date.getMinutes();
    var delimiter = " ";

    if(h < 10) {h = "0" + h};
    if(m < 10) {m = "0" + m};
    if(date.getSeconds() % 2 == 0) {delimiter = ":"}

    var time = h + delimiter + m;

    document.getElementById("digitalClock").innerText = time;
    document.getElementById("digitalClock").textContent = time;
    
    setTimeout(updateClock, 1000);
}

updateClock();

function advanceInfotainmentQueue() {
    currentInfotainmentIndex++;
    if(currentInfotainmentIndex > infotainmentQueue.length - 1) {
        currentInfotainmentIndex = 0;
    }
    
    var player = document.getElementById("infotainmentPlayer");
    player.attributes = "";
    player.setAttribute("src", infotainmentQueue[currentInfotainmentIndex]);
}

advanceInfotainmentQueue()
//#endregion