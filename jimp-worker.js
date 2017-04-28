importScripts("node_modules/jimp/browser/lib/jimp.js");

self.addEventListener("message", function (message) {
    const data = JSON.parse(message.data);
    let presetName = data.presetName;
    const noImages = data.images.length;
    const width = data.sizes[0];
    const height = data.sizes[1];
    const quality = data.quality;
    const resizeMode = data.resizeMode;
    const autoSize = data.autosize;
    const halign = data.halign;
    const valign = data.valign;

    for (let i = 0; i < data.images.length; i++) {
        const imageName = data.images[i].split('\\').pop();


        if (resizeMode["resize"]) {
            Jimp.read(data.images[i]).then(function (img) {
                self.postMessage(i);
                // Auto size
                let aWidth;
                let aHeight;
                if (autoSize === 1) { // None
                    aWidth = width;
                    aHeight = height;
                } else if (autoSize === 2) { // Width
                    aWidth = Jimp.AUTO;
                    aHeight = height;
                } else { // Height
                    aWidth = width;
                    aHeight = Jimp.AUTO;
                }

                img.resize(aWidth, aHeight, halign | valign)
                    .quality(quality)
                    .getBase64(Jimp.AUTO, function (err, src) {
                        if (presetName) presetName = presetName.toLowerCase().trim();
                        let message = {
                            "presetName": presetName,
                            "name": imageName,
                            "src": src,
                            "type": 'resize'
                        };
                        self.postMessage(message);   // message the main thread
                    });
            }).catch(function (err) {
                console.error(err);
            });
        }

        if (resizeMode["cover"]) {
            Jimp.read(data.images[i]).then(function (img) {
                self.postMessage(i);
                img.cover(width, height, halign | valign)
                    .quality(quality)
                    .getBase64(Jimp.AUTO, function (err, src) {
                        if (presetName) presetName = presetName.toLowerCase().trim();
                        let message = {
                            "presetName": presetName,
                            "name": imageName,
                            "src": src,
                            "type": 'resize'
                        };
                        self.postMessage(message);   // message the main thread
                    });
            }).catch(function (err) {
                console.error(err);
            });
        }

        if (resizeMode["contain"]) {
            Jimp.read(data.images[i]).then(function (img) {
                self.postMessage(i);
                img.contain(width, height, halign | valign)
                    .quality(quality)
                    .getBase64(Jimp.AUTO, function (err, src) {
                        if (presetName) presetName = presetName.toLowerCase().trim();
                        let message = {
                            "presetName": presetName,
                            "name": imageName,
                            "src": src,
                            "type": 'resize'
                        };
                        self.postMessage(message);   // message the main thread
                    });
            }).catch(function (err) {
                console.error(err);
            });
        }
    }
});