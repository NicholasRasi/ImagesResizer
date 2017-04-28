//var Jimp = require("jimp");
let DEBUG = (process.env.NODE_ENV === 'development');
let fs = require('fs');
let config;
let presetName;
let lastSavedFileName;

const outputFileDir = './out/';
const DEFAULT_QUALITY = 60;
const RESIZEMODE = ["resize", "cover", "contain"];
const AUTOSIZE = ["none", "width", "height"];

function ready(fn) {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}
ready(function () {
    $(loadConfigFile());

    // UI events
    $("#size").change(function () {
        presetName = $(this).val();

        // Update the UI with the data from the presets file
        updateUI();
    });

    $("#reset").click(function () {
        $("#images").empty();
    });

    $("#images").on("click", ".close-button", function () {
        $(this).parent().parent().remove();
    });


    // prevent default behavior from changing page on dropped file
    window.ondragover = function (e) {
        e.preventDefault();
        return false
    };
    // NOTE: ondrop events WILL NOT WORK if you do not "preventDefault" in the ondragover event!!
    window.ondrop = function (e) {
        e.preventDefault();
        return false
    };

    let holder = document.getElementById('images');
    holder.ondragover = function () {
        this.className = 'row hover fill';
        return false;
    };
    holder.ondragleave = function () {
        this.className = 'row empty fill';
        return false;
    };
    holder.ondrop = function (e) {
        e.preventDefault();
        this.className = 'row notempty fill';

        for (let i = 0; i < e.dataTransfer.files.length; ++i) {

            $("#images").append("" +
                "<div class=\"col-md-4\">" +
                "<div class=\"image\">" +
                "<img width=\"100%\" src=" + e.dataTransfer.files[i].path + ">" +
                "<div class=\"overlay\"></div>" +
                "<div class=\"close-button\"><a href=\"#\">X</a></div>" +
                "</div>" +
                "</div>"
            );
            DEBUG && console.log(e.dataTransfer.files[i].path);
        }

        return false;
    };


    $("#submit").click(function () {
        $("#progress-bar").css("width", 0).attr('aria-valuenow', 0);

        const width = Number($("#size-width").val());
        const height = Number($("#size-height").val());

        if (width && height && width > 0 && height > 0) {
            const quality = $("#quality").slider('getValue');
            let imagesSrc = [];
            let noImages = 0;
            let resizeMode = {};
            let resizeModeNumber = 0;

            let halign;
            if ($("#halign #hcenter").is(":checked")) {
                halign = 2;
            } else if ($("#halign #hleft").is(":checked")) {
                halign = 1;
            } else if ($("#halign #hright").is(":checked")) {
                halign = 4;
            }

            let valign;
            if ($("#valign #vmiddle").is(":checked")) {
                valign = 16;
            } else if ($("#valign #vbottom").is(":checked")) {
                valign = 32;
            } else if ($("#valign #vtop").is(":checked")) {
                valign = 8;
            }

            for (let i = 0; i < RESIZEMODE.length; i++) {
                if ($("#resize-mode #" + RESIZEMODE[i]).is(":checked")) {
                    resizeMode[RESIZEMODE[i]] = true;
                    resizeModeNumber++;
                }
            }

            let autoSize;
            if ($("#auto-size #none").is(":checked")) {
                autoSize = 1; // None
            } else if ($("#auto-size #width").is(":checked")) {
                autoSize = 2; // Width
            } else if ($("#auto-size #height").is(":checked")) {
                autoSize = 3; // Height
            }

            let images = $("#images > div > div > img")
                .each(function (i, image) {
                    const imageName = $(image).attr('src').split('\\').pop();
                    const extension = imageName.split('.').pop();

                    if (!extension.match(/jpg|jpeg|png|gif/gi)) {
                        errorMessage(l.translate("Image extensions not valid") + imageName);
                    }

                    // it tries to elaborate the image even if the extension is not matched
                    imagesSrc.push($(image).attr('src'));
                    noImages++;
                });

            let message = {
                "images": imagesSrc,
                "presetName": presetName,
                "sizes": [width, height],
                "resizeMode": resizeMode,
                "halign": halign,
                "valign": valign,
                "autosize": autoSize,
                "quality": quality
            };

            let worker = new Worker("jimp-worker.js");

            let progress = 0;
            worker.onmessage = function (e) {

                if (e.data.src) {
                    // Image message
                    DEBUG && console.log("Saving file" + e.data.name);

                    let data = e.data.src.replace(/^data:image\/\w+;base64,/, "");
                    let buf = new Buffer(data, 'base64');

                    lastSavedFileName = outputFileDir;
                    if (e.data.presetName) {
                        lastSavedFileName += e.data.presetName;
                    }
                    lastSavedFileName += '_' + e.data.type + '_' + e.data.name;

                    fs.writeFile(lastSavedFileName, buf, "binary", function (err) {
                        if (err) {
                            DEBUG && console.log(err);
                        }
                    });

                } else {
                    // Progress message
                    progress++;
                    DEBUG && console.log(progress + '/' + noImages * resizeModeNumber);
                    $("#progress-bar").css("width", ((progress / (noImages * resizeModeNumber)) * 100 + "%")).attr('aria-valuenow', ((progress / (noImages * resizeModeNumber)) * 100));

                    if (progress === noImages * resizeModeNumber) {
                        let n = new Noty({
                            text: l.translate('Finished'),
                            type: 'success',
                            progressBar: true,
                            timeout: 3000,
                            buttons: [
                                Noty.button(l.translate("Open output folder"), 'btn btn-info', function () {
                                    openFolder(lastSavedFileName);
                                    n.close();
                                })
                            ]
                        }).show();
                    }
                }

            };

            DEBUG && console.log(JSON.stringify(message));
            worker.postMessage(JSON.stringify(message)); // message the worker thread
        }
        else {
            errorMessage(l.translate('Sizes are not correct'));
        }


    });
});

function loadConfigFile() {
    let filePath = './presets/presets.json';

    try {
        config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        DEBUG && console.log(err);
    }

    if (config) {
        if (config.sizes) {
            for (let size in config.sizes) {
                $("#size").append("<option id='+ size +'>" + size + "</option>");
            }
        } else {
            errorMessage(l.translate('No size found'));
        }

    } else {
        errorMessage(l.translate('Configuration file not founded at: ') + filePath);
    }
}

function openFolder(path) {
    var pathModule = require('path');
    var fullpath = pathModule.resolve(path);
    DEBUG && console.log("try to open path" + fullpath);
    var gui = require('nw.gui');
    gui.Shell.showItemInFolder(fullpath);
}

function errorMessage(message) {
    new Noty({
        text: message,
        type: 'error'
    }).show();
}

function updateUI() {
    if (config.sizes[presetName]) {
        if (config.sizes[presetName].width) {
            $("#size-width").val(config.sizes[presetName].width)
        } else { // Default
            $("#size-width").val(0)
        }

        if (config.sizes[presetName].height) {
            $("#size-height").val(config.sizes[presetName].height)
        } else { // Default
            $("#size-height").val(0)
        }


        if (config.sizes[presetName].quality) {
            $("#quality").slider('setValue', config.sizes[presetName].quality);
        } else { // Default
            $("#quality").slider('setValue', DEFAULT_QUALITY);
        }

        if (config.sizes[presetName].resizeMode) {
            // Reset Form
            for (let i = 0; i < RESIZEMODE.length; i++) {
                $("#resize-mode #" + RESIZEMODE[i]).prop('checked', false);
            }

            // Set the value from the presets file
            for (let i = 0; i < config.sizes[presetName].resizeMode.length; i++) {
                $("#resize-mode #" + config.sizes[presetName].resizeMode[i]).prop('checked', true);
            }
        } else { // Default
            // Reset Form
            for (let i = 0; i < RESIZEMODE.length; i++) {
                $("#resize-mode #" + RESIZEMODE[i]).prop('checked', false);
            }
            $("#resize-mode #resize").prop('checked', true);
        }

        if (config.sizes[presetName].autoSize) {
            $("#auto-size #" + config.sizes[presetName].autoSize).click();
        } else {
            $("#auto-size #none").click();
        }

    }
}