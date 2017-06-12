# Volume Rendering

I completed my internship at Interactive Network Technologies (INT) with Vincent Dumestre. Our first mission was to accomplish a volume rendering with WebGL and Three.js. They agreed to publish this part under LICENSE.


## USE

If you want to test our program you just need to download this repository.
```
$ git clone https://github.com/FtZzy/volume-rendering.git
```
Open `index.html` with your favorite browser. However, your browser has to support WebGL.

Actually you see:
* a fps monitor
* a button to choose a file
* a GUI controller
* a black screen

The monitor displays the _fps_ by default. You can have the _ping_, the _allocated memory_ or custom informations if you click on it.

Next, you have to load a file! Before that please unzip `data.zip` and the file **'velocity'**. With the first button choose _velocity_ in the directory `data` and select 'Load'. Wait a couple of seconds and a cube will appear. You can move the object or zoom with the mouse.

Finally, we get the Graphical User Interface (GUI). The GUI controller represents the transfer function: you can change number of steps (higher is the number better is the result, but lower are the _fps_), the alpha correction that change the general opacity, the colors, their relative transparency and position. The position allows to display values more than others (the colors are linear between two). You can show or hide the panel with `h`.


## DATA

For the moment it just works with one data format: that of **velocity**. If you want change it you have to modify  `LoadFile.js`.


## TODO

1. Improve actual result
1. Do a depth buffer
1. Add lights
1. Change `LoadFile.js`
1. Hide colors inside the cube
1. Make it nicer


# Bibliography

* [https://github.com/mrdoob/three.js](https://github.com/mrdoob/three.js)
* [https://github.com/mrdoob/stats.js/](https://github.com/mrdoob/stats.js/)
* [https://github.com/dataarts/dat.gui](https://github.com/dataarts/dat.gui)
* [https://github.com/mattdesl/three-orbit-controls](https://github.com/mattdesl/three-orbit-controls)
* [https://github.com/lebarba/WebGLVolumeRendering](https://github.com/lebarba/WebGLVolumeRendering)



# LICENSE
Copyright (c) 2017 Interactive Network Technologies
