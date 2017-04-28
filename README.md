# Image resizer
This application resizes images in a easy and fast way. It is developed using the NW.js framework and is mainly based on the powerful <a href="https://github.com/oliver-moran/jimp">JIMP library</a>.

The parameters of the conversion like the size of the image, the quality and so on can be set using an external preset file. In this way the conversion is done using the values passed within the preset files, so the user can easily set all the parameters with a click. The values can be also set from the user interface.

An example of preset.json file is:

    {
      "sizes": {
        "News": {
          "width": 700,
          "height": 500,
          "quality": 60,
          "resizeMode": ["cover"],
          "autoSize": "width"
        },
        "Highlights": {
          "width": 350,
          "height": 300,
          "quality": 60,
          "resizeMode": ["resize"],
          "autoSize": "width"
        }
      }
    }

### Parameters:

* **resizeMode** is the type of resize that is applied. Possible values are resize, cover, contain.
* **autoSize** is used when the resizer auto set the value of one dimension, width or height, according to the aspect ratio of the image. Possible values are none, width, height.

![ImagesResizer](https://github.com/makebit/ImagesResizer/raw/master/docs/ImagesResizerMenu.jpg)


## How to run it?
Clone this repo in your workspace and then install all the dependencies with

    npm install

Then, run the application with <a href="https://nwjs.io/">NW.js</a>



To debug it set the environment variable **NODE_ENV** to '**development**'.

On Windows:

    set NODE_ENV=development

On Linux/Mac:

    NODE_ENV=development