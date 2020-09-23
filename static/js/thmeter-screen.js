var ws = null;
connect();

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function connect() {
    ws = new WebSocket('ws://' + window.location.host + '/ws/');

    ws.onopen = function() {
        ws.send(JSON.stringify({
            'action': 'init-screen',
        }));
    };

    ws.onmessage = function (e) {
        let json_parse = JSON.parse(e.data);
        if (json_parse["status"] == "init-screen") {
            let data = json_parse["data"][0];
            updateScreen(data["value"], data["photo"]);
        } else if (json_parse["status"] == "add") {
            let data = json_parse["data"];
            updateScreen(data["value"], data["photo"]);
        } 
    };

    ws.onclose = function (e) {
        setTimeout(() => {
            connect();
        }, 1000);
    };

    ws.onerror = function (err) {
        console.error('Socket encountered error: ', err.message, 'Closing socket');
        ws.close();
    };
}

function updateScreen(temp, photo) {
    $('#temp').text(temp);
    $("#photo").attr("src", photo);
    if (temp > 37.5) {
        beep(true);
        $('#temp').css('color', 'red');
    } else {
        beep();
        $('#temp').css('color', 'green');
    }

}

function beep(warning = false) {
    let oscillator = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.value = 1;
    oscillator.frequency.value = 2000;
    oscillator.type = "sawtooth";
    let duration = 100;
    if (warning) duration = 2000;

    oscillator.start();

    setTimeout(
        function () {
            oscillator.stop();
        },
        duration
    );
};