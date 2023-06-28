const socket = new WebSocket('wss://api.geops.io/realtime-ws/v1/?key=5cc87b12d7c5370001c1d655112ec5c21e0f441792cfc2fafe3e7a1e');

var currentTrain;

socket.onopen = function(e) {

}

socket.onmessage = function(e) {
    var wsContent = JSON.parse(e.data).content;
}

socket.onerror = function(e) {
    alert(`[ERROER] ${e.message}`);
}

socket.onclose = function(e) {

}

function updateClock() {
    var date = new Date();
    var h = date.getHours();
    var m = date.getMinutes();

    var time = h + ":" + m;

    document.getElementById("digitalClock").innerText = time;
    document.getElementById("digitalClock").textContent = time;
    
    setTimeout(updateClock, 10000);
}

updateClock();