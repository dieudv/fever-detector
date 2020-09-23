var ws = null;
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

$("#table-records").on('click', 'tr', function () {
    $(this).toggleClass('active');
});

$(document).ready(function () {
    setTimeout(() => {
        ws.send(JSON.stringify({
            'action': 'init',
        }));
    }, 1000);

    $("#external-tab").click(function () {
      var params = ["height=" + screen.height, "width=" + screen.width, "fullscreen=yes"].join(",");
      var popup = window.open("/screen", "popup_window", params);
      popup.moveTo(0, 0);
      return false;
    });

    connect();
});

var dataTable = $('#table-records').DataTable({
    destroy: true,
    data: new Array(),
    dom: '<"row"<"col-md-4"l><"col-md-4"B><"col-md-4"f>>rt<"row"<"col-md-6"i><"col-md-6"p>>',
    buttons: [
        {
            extend: 'copyHtml5',
            text: 'Copy',
            exportOptions: {
                stripHtml: false,
                format: {
                    body: function (data, row, column, node) {
                        if (column === 4) {
                            let img_path = data.replace('<img class="pop" src="', '').replace('" style="height:30px;">', '');
                            if (img_path.length == 0) return "";
                            return  window.location.origin + img_path;
                        } else {
                            return data;
                        }
                    }
                }
            }
        },
        {
            extend: 'excelHtml5',
            text: 'Excel',
            exportOptions: {
                stripHtml: false,
                format: {
                    body: function (data, row, column, node) {
                        if (column === 4) {
                            let img_path = data.replace('<img class="pop" src="', '').replace('" style="height:30px;">', '');
                            if (img_path.length == 0) return "";
                            return  window.location.origin + img_path;
                        } else {
                            return data;
                        }
                    }
                }
            }
        },
        {
            extend: 'print',
            exportOptions: {
                stripHtml: false,
                format: {
                    body: function (data, row, column, node) {
                        if (column === 4) {
                            let img_path = data.replace('<img class="pop" src="', '').replace('" style="height:30px;">', '');
                            if (img_path.length == 0) return "";
                            return  window.location.origin + img_path;
                        } else {
                            return data;
                        }
                    }
                }
            },
            customize: function (win) {
                $(win.document.body)
                    .css('font-size', '10pt')
                    .prepend(
                        '<img src="https://aifablab.vn/static/logo.png" style="position:absolute; top:0; right:0;" />'
                    );

                $(win.document.body).find('table')
                    .addClass('compact')
                    .css('font-size', 'inherit');
            },
        }
    ],
    columns: [{
        title: "ID"
    },
    {
        title: "Thời gian"
    },
    {
        title: "Nhiệt độ (°C)"
    },
    {
        title: "Hình ảnh"
    },
    ],
    "language": {
        "search": "Tìm Kiếm",
        "paginate": {
            "first": "Về Đầu",
            "last": "Về Cuối",
            "next": "Tiến",
            "previous": "Lùi"
        },
        "order": [
            [0, "desc"]
        ],
        "info": "Hiển thị _START_ đến _END_ của _TOTAL_ mục",
        "infoEmpty": "Hiển thị 0 đến 0 của 0 mục",
        "lengthMenu": "Hiển thị _MENU_ mục",
        "loadingRecords": "Đang tải...",
        "emptyTable": "Không có gì để hiển thị",
    }
});

dataTable.on('draw', function () {
    $('.pop').on('click', function () {
        $('.img-view').attr('src', $(this).attr('src'));
        $('#img-modal').modal('show');
    });
});

function connect() {
    ws = new WebSocket('ws://' + window.location.host + '/ws/');

    ws.onopen = function() {
        ws.send(JSON.stringify({
            'action': 'reconnect',
        }));
    };

    ws.onmessage = function (e) {
        let json_parse = JSON.parse(e.data);
        let len = json_parse['data'].length;

        if (json_parse['status'] == "init") {
            if (len > 0) {
                for (var i = 0; i < len; i++) {
                    addRow(json_parse['data'][i]);
                }
                updateTemp(json_parse['data'][0].value);
            }
            $('#statistical').show();
            $('#ls-records').fadeIn('slow');
        } else if (json_parse['status'] == "add") {
            addRow(json_parse['data']);
            updateTemp(json_parse['data'].value, true);
        }

        let summary = json_parse['summary'];
        $('#count').text(summary['count']);
        $('#fever').text(summary['fever']);
        $('#today-count').text(summary['today_count']);
        $('#today-fever').text(summary['today_fever']);
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

function updateTemp(temp, isBeep = false) {
    $('#temp').text(temp);
    if (temp > 37.5) {
        if (isBeep) beep(true);
        $('#temp-div').css('color', 'red');
    } else {
        if (isBeep) beep();
        $('#temp-div').css('color', 'green');
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

function addRow(record) {
    let time = record["created_at"].split(".")[0].replace("T", " ");
    let row = null;

    if (record["photo"] !== null) {
        row = [
            record["id"],
            time,
            record["value"],
            "<img class=\"pop\" src=\"" + record["photo"] + "\" style=\"height:30px;\">"
        ];
    } else {
        row = [
            record["id"],
            time,
            record["value"],
            null
        ];
    }

    dataTable.row.add(row).draw(false).node().id = "r" + record["id"];
    if (record["value"] > 37.5) {
        $("#r" + record["id"]).css('color', 'red')
    };
    dataTable.order([0, 'desc']).draw(true);

    if (dataTable.data().length > 1000) {
        var rowId = dataTable.column(0).data().toArray().map(function (item) { return parseInt(item); }).sort(function (a, b) { return a - b })[0];
        $('#table-records').DataTable().row('#r' + rowId).remove().draw(false);
    }
}