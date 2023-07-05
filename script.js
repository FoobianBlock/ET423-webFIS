const socket = new WebSocket('wss://api.geops.io/realtime-ws/v1/?key=5cc87b12d7c5370001c1d655112ec5c21e0f441792cfc2fafe3e7a1e');
// const socket = new WebSocket('wss://tralis-tracker-api.geops.io/ws?key=5cc87b12d7c5370001c1d655babfd9dc82ef43d99b1f12763a1ca6b4');

const params = new URLSearchParams(document.location.search)

let leftPanelViewIndex = 0;
let currentInfotainmentIndex = 0;
const infotainmentQueue = Object.seal(["https://assets.static-bahn.de/dam/jcr:5e33cbde-1254-4241-a8d4-2f6dcb605d47/220202_1080p_Erklaervideo_Simpleshow_Folienballons.mp4","https://assets.static-bahn.de/dam/jcr:6b82b65c-3cd4-4915-b02c-8fa5abde431e/220202_1080p_Erklaervideo_Simpleshow_SauberkeitImZug.mp4","https://assets.static-bahn.de/dam/jcr:da1188f1-8293-4351-8ac7-f26d1dbb4b5c/220202_1080p_Erklaervideo_Simpleshow_PersonenImGleis.mp4","https://assets.static-bahn.de/dam/jcr:a0c7be5c-39a1-4cac-8593-26ef12b8dea9/220202_1080p_Erklaervideo_Simpleshow_Tuerstoerung.mp4","https://assets.static-bahn.de/dam/jcr:49af3eb3-ff25-4de5-97a8-3f8ce9aa4f3a/220202_1080p_Erklaervideo_Simpleshow_Bahn%C3%BCberg%C3%A4nge_Clip01.mp4","https://assets.static-bahn.de/dam/jcr:6b82b65c-3cd4-4915-b02c-8fa5abde431e/220202_1080p_Erklaervideo_Simpleshow_SauberkeitImZug.mp4"]);

let activeDepartureTimerInterval;
let activeFirstStopViewInterval = null;

let currentTrain;
const stationDataJson = '{"Hamburg Hbf (S-Bahn)":{"nameDE":"Hauptbahnhof","nameEN":"Central Station","rvfv":true},"Hamburg-Altona(S)":{"rvfv":true},"Hamburg Dammtor":{"rvfv":true},"Hamburg-Eidelstedt":{"rvfv":true},"Hamburg-Harburg(S)":{"rvfv":true},"Hamburg-Holstenstraße":{"rvfv":true},"Hamburg-Bergdorf":{"rvfv":true},"München Hbf":{"nameDE":"Hauptbahnhof","nameEN":"Central Station","rvfv":true},"München Hbf Gl.27-36":{"nameDE":"Hauptbahnof Nord","rvfv":true},"München Ost":{"nameDE":"Ostbahnhof","nameEN":"Munich East","rvfv":true},"Flughafen/Airport ✈":{"nameDE":"Flughafen München","nameEN":"Airport"},"München Karlsplatz":{"nameDE":"Karlsplatz (Stachus)"},"München Hbf (tief)":{"nameDE":"Hauptbahnhof","nameEN":"Central Station","rvfv":true},"München St.Martin-Str.":{"nameDE":"St.-Martin-Straße"},"Furth(b Deisenhofen)":{"nameDE":"Furth"},"München-Pasing":{"rvfv":true},"München Donnersbergerbrücke":{"rvfv":true},"Petershausen(Obb)":{"rvfv":true},"Dachau Bahnhof":{"rvfv":true},"Deisenhofen":{"rvfv":true},"Markt Schwaben":{"rvfv":true},"München Heimeranplatz":{"rvfv":true},"München Harras":{"rvfv":true},"München-Mittersendling":{"rvfv":true},"München Siemenswerke":{"rvfv":true},"München-Solln":{"rvfv":true},"Kreuzstraße":{"rvfv":true},"Mammendorf":{"rvfv":true},"Holzkirchen":{"rvfv":true},"Starnberg":{"rvfv":true},"Tutzing":{"rvfv":true},"Grafing Stadt":{"rvfv":true},"Grafing Bahnhof":{"rvfv":true},"Ebersberg(Oberbay)":{"rvfv":true},"München-Feldmoching":{"rvfv":true},"München-Moosach":{"rvfv":true},"Geltendorf":{"rvfv":true}}';
let stationData = JSON.parse(stationDataJson);
let nextStationIndex = 0;
let lineData;

socket.onopen = function(e) {
    const paramTrainId = params.get("trainid");
    if(paramTrainId != null) {
        currentTrain = paramTrainId;
        socket.send(`SUB stopsequence_${currentTrain}`);
        updateLine();
    }

    resetDisplay();
    document.getElementById("fullScreenError").style.display = 'none';
}

socket.onmessage = function(e) {
    var wsContent = JSON.parse(e.data).content;

    if(wsContent.length > 0) {
        console.log(wsContent);
        setupLine(wsContent[0]);
    }
}

socket.onerror = function(e) {
    alert(`[ERROER] ${e.message}`);
    document.getElementById("fullScreenError").style.display = 'revert';
}

socket.onclose = function(e) {
    resetDisplay();
}

function updateLine() {
    socket.send(`GET stopsequence_${currentTrain}`);
}

function resetDisplay() {
    document.getElementById("stationList").innerHTML = '';
    document.getElementById("finalDestinationDE").innerText = "";
    document.getElementById("finalDestinationEN").innerText = "";
    document.getElementById("finalDestinationRVFV").style.display = "none";
    document.getElementById("lineNumberFill").style.fill = '#008E4E';
    document.getElementById("lineNumberText").style.fill = "#FFFFFF"
    document.getElementById("nextStopNextStop").style.display = "none";
    document.getElementById("firstStopNextStop").style.display = "none";
    document.getElementById("welcomeLineNumber").textContent = "";

    const lineStrokeColouredElements = document.getElementsByClassName("lineStrokeColoured")
    for (let i = 0; i < lineStrokeColouredElements.length; i++) {
        lineStrokeColouredElements[i].style.backgroundColor = '#008E4E';
        lineStrokeColouredElements[i].style.fill = '#008E4E';
    }

    updateView(0);
}

function setupLine(data) {
    document.getElementById("finalDestinationDE").innerText = getStationNameDE(data.destination);
    document.getElementById("finalDestinationEN").innerText = getStationNameEN(data.destination);
    document.getElementById("finalDestinationRVFV").style.display = getStationRVFV(data.destination) ? "revert" : "none";
    document.getElementById("lineNumberFill").style.fill = data.color;
    document.getElementById("lineNumberText").style.fill = data.text_color;
    document.getElementById("welcomeLineNumber").textContent = data.longName;

    const lineStrokeColouredElements = document.getElementsByClassName("lineStrokeColoured")
    for (let i = 0; i < lineStrokeColouredElements.length; i++) {
        lineStrokeColouredElements[i].style.backgroundColor = data.stroke;
        lineStrokeColouredElements[i].style.fill = data.stroke;
    }

    lineData = data;
    const stations = data.stations;

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
            
            let nextStopTime;
            let nextStopDelay;

            clearInterval(activeDepartureTimerInterval);
            
            if(element.state == "BOARDING") {    
                // First Station
                if(i === 0) {
                    document.getElementById("firstStopNextStop").style.display = "block";
                    document.getElementById("nextStopNextStop").style.display = "none";

                    updateDepartureTime();
                    activeDepartureTimerInterval = setInterval(updateDepartureTime, 15000);

                    if(activeFirstStopViewInterval === null) {
                        activeFirstStopViewInterval = setInterval(
                            function() { 
                                if(leftPanelViewIndex === 2) {
                                    updateView(0);
                                } 
                                else {
                                    updateView(2); 
                                }
                            }, 5000);
                    }
                }
                else {
                    clearFirstStopViewInterval();

                    document.getElementById("firstStopNextStop").style.display = "none";
                    document.getElementById("nextStopNextStop").style.display = "block";

                    document.getElementById("stationActionDE").innerText = "Abfahrt";
                    document.getElementById("stationActionEN").innerText = "Departure";
                    document.getElementById("stationActionDepartureTime").innerText = "";
                }

                nextStopTime = new Date(element.aimedDepartureTime);
                nextStopDelay = Math.round(element.departureDelay / 60000);
            }
            else {
                clearFirstStopViewInterval();

                document.getElementById("firstStopNextStop").style.display = "none";
                document.getElementById("nextStopNextStop").style.display = "block";

                document.getElementById("stationActionDE").innerText = "Nächster Halt";
                document.getElementById("stationActionEN").innerText = "Next stop";
                document.getElementById("stationActionDepartureTime").innerText = "";

                nextStopTime = new Date(element.aimedArrivalTime);
                nextStopDelay = Math.round(element.arrivalDelay / 60000);
            }

            let h = nextStopTime.getHours();
            let m = nextStopTime.getMinutes();
    
            if(h < 10) {h = "0" + h};
            if(m < 10) {m = "0" + m};
            
            document.getElementById("plannedArrivalNextStop").textContent = h + ":" + m;

            document.getElementById("delayNextStop").textContent = "+" + nextStopDelay;

            break;
        }
    }

    const stationListElement = document.getElementById("stationList");
    if(stationListElement.childElementCount != stations.length) {
        stationListElement.innerHTML = '';
    }
    
    for (let i = 0; i < stations.length; i++) {    
        if(i >= stationListElement.childElementCount) {
            stationListElement.appendChild(newStationListEntry(stations[i], i));
        }

        const element = stationListElement.children[i];
        element.updateEntry(stations[i], i);
        element.style.backgroundColor = ((nextStationIndex - i) % 2 === 0) ? '#FFFFFF' : '#E6E6E6';
        
        element.style.display = i > nextStationIndex ? 'block' : 'none';
    }
}

function updateDepartureTime() {
    const element = lineData.stations[0];
    const relativeDepartureTime = new Date(element.departureTime + element.departureDelay) - Date.now();

    if(relativeDepartureTime > 60000) {
        document.getElementById("stationActionDE").innerText = "Abfahrt in";
        document.getElementById("stationActionEN").innerText = "Departure in";
        document.getElementById("stationActionDepartureTime").innerText = Math.floor(relativeDepartureTime / 60000) + " min";
    }
    else {
        document.getElementById("stationActionDE").innerText = "Abfahrt in Kürze";
        document.getElementById("stationActionEN").innerText = "Departure soon";
        document.getElementById("stationActionDepartureTime").innerText = "";
    }
}

function updateView(idx) {
    leftPanelViewIndex = idx;

    console.log(leftPanelViewIndex);

    switch (leftPanelViewIndex) {
        case 1: // Station Details
            document.getElementById("welcomeScreen").style.display = 'none';
            document.getElementById("stationList").style.display = 'none';

            document.getElementById("stationDetails").style.display = 'block';
            break;
        case 2: // Welcome Screen
            document.getElementById("stationList").style.display = 'none';
            document.getElementById("stationDetails").style.display = 'none';

            document.getElementById("welcomeScreen").style.display = 'block';
            break;
        default: // Station List
            document.getElementById("welcomeScreen").style.display = 'none';
            document.getElementById("stationDetails").style.display = 'none';

            document.getElementById("stationList").style.display = 'block';
            break;
    }
}

function clearFirstStopViewInterval() {
    if(activeFirstStopViewInterval != null) {
        clearInterval(activeFirstStopViewInterval);
        activeFirstStopViewInterval = null;
        updateView(0);
    }
}

function newStationListEntry(stationData, i) {
    let element = document.createElement("station-list-entry");
    element.updateEntry(stationData, i);
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
    if(currentTrain != null) {
        socket.send(`DEL stopsequence_${currentTrain}`)
    }
    currentTrain = document.getElementById("input_dbgTrainID").value;
    socket.send(`SUB stopsequence_${currentTrain}`);
    updateLine();
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
        arrowContainer.style.width = '202px';
        arrowContainer.style.height = '100%';
        arrowContainer.style.display = 'flex';
        arrowContainer.style.alignItems = 'center';
        arrowContainer.style.fontSize = '25px';
        const plannedArrivalTime = document.createElement('span');
        plannedArrivalTime.style.paddingLeft = '20px';
        const svgContainer = document.createElement('div');
        svgContainer.style.position = 'relative';
        svgContainer.style.left = '8px';
        const delay = document.createElement('span');
        delay.style.paddingLeft = '10px';
        const nameDE = document.createElement('span');
        nameDE.style.paddingRight = '5px';
        const nameEN = document.createElement('i');
        nameEN.style.paddingRight = '5px';
        nameEN.style.color = '#666666';
        const rvfvIcon = document.createElement('img');
        rvfvIcon.src = 'icons/RVFV.svg';
        rvfvIcon.style.height = '38px';
        rvfvIcon.style.filter = 'brightness(33%) contrast(58%)';
        rvfvIcon.style.paddingLeft = '5px';

        this.shadowRoot.appendChild(container);
        container.appendChild(arrowContainer);
        container.appendChild(nameDE);
        container.appendChild(nameEN);
        container.appendChild(rvfvIcon);

        arrowContainer.appendChild(plannedArrivalTime);
        arrowContainer.appendChild(svgContainer);
        arrowContainer.appendChild(delay);
    }

    // Update the text content based on the data string
    updateEntry(stationData, i) {
        const container = this.shadowRoot.querySelector('div');

        // Update the text content
        container.children[1].textContent = getStationNameDE(stationData.stationName);

        const aimedArrivialTime = new Date(stationData.aimedArrivalTime);
        let h = aimedArrivialTime.getHours();
        let m = aimedArrivialTime.getMinutes();

        if(h < 10) {h = "0" + h};
        if(m < 10) {m = "0" + m};

        const arrowContainer = container.children[0];

        arrowContainer.children[0].textContent = h + ":" + m;
        arrowContainer.children[2].textContent = "+" + Math.round(stationData.arrivalDelay / 60000);

        let svgData;

        if(i === (lineData.stations.length - 1)) {
            if(stationData.cancelled) {
            }
            else {
                svgData = '<svg width="40" height="69" viewBox="0 0 40 69" version="1.1" xml:space="preserve" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"><g style="display:inline;fill:#ffffff"><rect style="fill:#ffffff;" class="lineStrokeColoured" width="6" height="34" x="17" y="0" /><rect style="fill:#ffffff;" class="lineStrokeColoured" width="6" height="24" x="34" y="-32" transform="rotate(90)" /></g></svg>';
            }
        }
        else {
            if(stationData.cancelled) {
                svgData = '<svg width="40" height="69" viewBox="0 0 40 69" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"><g style="display:inline;"><rect style="display:inline;fill:#666666;" width="6" height="69" x="17" y="0" /></g></svg>';
            }
            else {
                svgData = '<svg width="40" height="69" viewBox="0 0 40 69" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"><defs><clipPath clipPathUnits="userSpaceOnUse" id="clipPath3870"><circle style="display:none;" id="circle2860" cx="20" cy="35" r="5" d="m 25,35 a 5,5 0 0 1 -5,5 5,5 0 0 1 -5,-5 5,5 0 0 1 5,-5 5,5 0 0 1 5,5 z" /><path id="lpe_path-effect2862" style="display:inline;" class="powerclip" d="M 4,19 H 36 V 51 H 4 Z m 21,16 a 5,5 0 0 0 -5,-5 5,5 0 0 0 -5,5 5,5 0 0 0 5,5 5,5 0 0 0 5,-5 z" /></clipPath></defs><g style="fill:#ffffff"><rect style="display:inline;fill:#ffffff;stroke:none;" class="lineStrokeColoured" width="6" height="25" x="17" y="44" id="rect7" /><path style="fill:#ffffff" clip-path="url(#clipPath3870)" class="lineStrokeColoured" d="M 31,35 A 11,11 0 0 1 20,46 11,11 0 0 1 9,35 11,11 0 0 1 20,24 11,11 0 0 1 31,35 Z" id="path9" transform="translate(0,1)" /><rect style="fill:#ffffff;" class="lineStrokeColoured" width="6" height="27" x="17" y="0"/></g></svg>';
            }
        }

        arrowContainer.children[1].innerHTML = svgData;
        const lineStrokeColouredElements = arrowContainer.getElementsByClassName("lineStrokeColoured")
        for (let i = 0; i < lineStrokeColouredElements.length; i++) {
            lineStrokeColouredElements[i].style.backgroundColor = lineData.stroke;
            lineStrokeColouredElements[i].style.fill = lineData.stroke;
        }

        const stationNameEN = getStationNameEN(stationData.stationName);
        if(stationNameEN != null) {            
            container.children[2].textContent = stationNameEN;
            container.children[2].style.display = 'revert';
        }
        else {
            container.children[2].style.display = 'none';
        }

        container.children[3].style.display = getStationRVFV(stationData.stationName) ? 'revert' : 'none';
    }
}

// Register the custom element
customElements.define('station-list-entry', stationListEntry);
//#endregion