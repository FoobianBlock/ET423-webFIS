const socket = new WebSocket('wss://api.geops.io/realtime-ws/v1/?key=5cc87b12d7c5370001c1d655112ec5c21e0f441792cfc2fafe3e7a1e');

let currentTrain;
let currentInfotainmentIndex = 0;
const infotainmentQueue = Object.seal(["https://assets.static-bahn.de/dam/jcr:5e33cbde-1254-4241-a8d4-2f6dcb605d47/220202_1080p_Erklaervideo_Simpleshow_Folienballons.mp4","https://assets.static-bahn.de/dam/jcr:6b82b65c-3cd4-4915-b02c-8fa5abde431e/220202_1080p_Erklaervideo_Simpleshow_SauberkeitImZug.mp4","https://assets.static-bahn.de/dam/jcr:da1188f1-8293-4351-8ac7-f26d1dbb4b5c/220202_1080p_Erklaervideo_Simpleshow_PersonenImGleis.mp4","https://assets.static-bahn.de/dam/jcr:a0c7be5c-39a1-4cac-8593-26ef12b8dea9/220202_1080p_Erklaervideo_Simpleshow_Tuerstoerung.mp4","https://assets.static-bahn.de/dam/jcr:49af3eb3-ff25-4de5-97a8-3f8ce9aa4f3a/220202_1080p_Erklaervideo_Simpleshow_Bahn%C3%BCberg%C3%A4nge_Clip01.mp4","https://assets.static-bahn.de/dam/jcr:6b82b65c-3cd4-4915-b02c-8fa5abde431e/220202_1080p_Erklaervideo_Simpleshow_SauberkeitImZug.mp4"]);

const stationDataJson = '{"Hamburg Hbf (S-Bahn)":{"rvfv":true},"München Hbf":{"nameDE":"Hauptbahnhof","nameEN":"Central Station","rvfv":true},"München Hbf Gl.27-36":{"nameDE":"Hauptbahnof Nord","rvfv":true},"München Ost":{"nameDE":"Ostbahnhof","nameEN":"Munich East","rvfv":true},"Flughafen/Airport ✈":{"nameDE":"Flughafen München","nameEN":"Airport"},"München Karlsplatz":{"nameDE":"Karlsplatz (Stachus)"},"München Hbf (tief)":{"nameDE":"Hauptbahnhof","nameEN":"Central Station","rvfv":true},"München St.Martin-Str.":{"nameDE":"St.-Martin-Straße"},"München-Pasing":{"rvfv":true},"München Donnersbergerbrücke":{"rvfv":true},"Petershausen(Obb)":{"rvfv":true},"Dachau Bahnhof":{"rvfv":true},"Deisenhofen":{"rvfv":true},"Markt Schwaben":{"rvfv":true},"München Heimeranplatz":{"rvfv":true},"München Harras":{"rvfv":true},"München-Mittersendling":{"rvfv":true},"München Siemenswerke":{"rvfv":true},"München-Solln":{"rvfv":true},"Kreuzstraße":{"rvfv":true}}';
let stationData = JSON.parse(stationDataJson);
let nextStationIndex = 0;

let perpetualUpdate = false;

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

function updateLine() {
    if(perpetualUpdate) {
        socket.send(`GET stopsequence_${currentTrain}`);
    }
}

setInterval(updateLine, 30000);

function setupLine(lineData) {
    console.log(lineData);

    document.getElementById("finalDestinationDE").innerText = getStationNameDE(lineData.destination);
    document.getElementById("finalDestinationEN").innerText = getStationNameEN(lineData.destination);
    document.getElementById("finalDestinationRVFV").style.display = getStationRVFV(lineData.destination) ? "revert" : "none";
    document.getElementById("lineNumberFill").style.fill = lineData.color;
    document.getElementById("lineNumberText").style.fill = lineData.text_color

    const lineStrokeColouredElements = document.getElementsByClassName("lineStrokeColoured")
    for (let i = 0; i < lineStrokeColouredElements.length; i++) {
        lineStrokeColouredElements[i].style.backgroundColor = lineData.stroke;
    }

    const stations = lineData.stations;

    for (let i = 0; i < stations.length; i++) {
        const element = stations[i];
        
        if(element.state != "LEAVING" && element.state != "JOURNEY_CANCELLED") {
            nextStationIndex = i;

            document.getElementById("nextStopDE").innerText = getStationNameDE(element.stationName);
            document.getElementById("nextStopRVFV").style.display = getStationRVFV(element.stationName) ? "revert" : "none";

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

            const aimedArrivialTime = new Date(element.aimedArrivalTime);
            let h = aimedArrivialTime.getHours();
            let m = aimedArrivialTime.getMinutes();
    
            if(h < 10) {h = "0" + h};
            if(m < 10) {m = "0" + m};
            
            document.getElementById("plannedArrivalNextStop").textContent = h + ":" + m;

            document.getElementById("delayNextStop").textContent = "+" + Math.round(element.arrivalDelay / 60000);

            break;
        }
    }

    const stationListElement = document.getElementById("stationList");
    if(stationListElement.childElementCount != stations.length) {
        stationListElement.innerHTML = '';
    }
    
    for (let i = 0; i < stations.length; i++) {    
        if(i >= stationListElement.childElementCount) {
            stationListElement.appendChild(newStationListEntry(stations[i]));
        }

        const element = stationListElement.children[i];
        element.updateEntry(stations[i]);
        element.style.backgroundColor = ((nextStationIndex - i) % 2 === 0) ? '#FFFFFF' : '#E6E6E6';
        
        element.style.display = i > nextStationIndex ? 'block' : 'none';
    }
}

function newStationListEntry(stationData) {
    let element = document.createElement("station-list-entry");
    element.updateEntry(stationData);
    return element;
}

function getStationNameDE(stationName) {
    if(stationData[stationName] != undefined) {
        if(stationData[stationName].nameDE != undefined) {
            return stationData[stationName].nameDE;
        }
    }

    if(stationName.startsWith("München")) {
        return stationName.substring(8);
    }

    if(stationName.startsWith("Hamburg")) {
        return stationName.substring(8);
    }

    return stationName;
}

function getStationNameEN(stationName) {
    if(stationData[stationName] != undefined) {
        if(stationData[stationName].nameEN != undefined) {
            return stationData[stationName].nameEN;
        }
    }
    return null;
}

function getStationRVFV(stationName) {
    if(stationData[stationName] != undefined) {
        if(stationData[stationName].rvfv != undefined) {
            return stationData[stationName].rvfv;
        }
    }

    return false;
}

function debugSearchTrainID() {
    currentTrain = document.getElementById("input_dbgTrainID").value;
    perpetualUpdate = true;
    updateLine();
}

function checkFontWidthOfElement(element) {
    
} 

//#region Station List Entry Elememt
// Define the custom element
class stationListEntry extends HTMLElement {
    constructor() {
        super();

        // Create a shadow root for encapsulation
        this.attachShadow({ mode: 'open' });

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.height = '100%';
        container.style.alignItems = 'center';
        const arrowContainer = document.createElement('div');
        arrowContainer.style.width = '17.5%';
        arrowContainer.style.height = '100%';
        arrowContainer.style.display = 'flex';
        arrowContainer.style.alignItems = 'center';
        arrowContainer.style.fontSize = '25px';
        const plannedArrivalTime = document.createElement('span');
        plannedArrivalTime.style.paddingLeft = '20px';
        const delay = document.createElement('span');
        delay.style.paddingLeft = '50px';
        const nameDE = document.createElement('span');
        nameDE.style.paddingRight = '15px';
        const nameEN = document.createElement('i');
        nameEN.style.paddingRight = '15px';
        nameEN.style.color = '#666666';

        this.shadowRoot.appendChild(container);
        container.appendChild(arrowContainer);
        container.appendChild(nameDE);
        container.appendChild(nameEN);

        arrowContainer.appendChild(plannedArrivalTime);
        arrowContainer.appendChild(delay);
    }

    // Update the text content based on the data string
    updateEntry(stationData) {
        const container = this.shadowRoot.querySelector('div');

        // Update the text content
        container.children[1].textContent = getStationNameDE(stationData.stationName);

        const aimedArrivialTime = new Date(stationData.aimedArrivalTime);
        let h = aimedArrivialTime.getHours();
        let m = aimedArrivialTime.getMinutes();

        if(h < 10) {h = "0" + h};
        if(m < 10) {m = "0" + m};

        container.children[0].children[0].textContent = h + ":" + m;
        container.children[0].children[1].textContent = "+" + Math.round(stationData.arrivalDelay / 60000);
        
        const stationNameEN = getStationNameEN(stationData.stationName);
        if(stationNameEN != null) {            
            container.children[2].textContent = stationNameEN;
            container.children[2].style.display = 'revert';
        }
        else {
            container.children[2].style.display = 'none';
        }
    }
}

// Register the custom element
customElements.define('station-list-entry', stationListEntry);
//#endregion