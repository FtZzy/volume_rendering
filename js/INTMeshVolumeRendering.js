/* jshint esversion: 6 */
/**
 *
 * A THREE.Mesh Object to represent VolumeRendering, must be the last object added to the scene
 *
 * @class INTMeshVolumeRendering
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Camera} Camera
 * @param {THREE.Vector3} size - size of the box for the volume rendering
 * @param {number} [steps = 50]
 * @param {number} [alphaCorrection = 0.2]
 *
 * @author Vincent Dumestre
 * @author Nathan Krupa
 */
function INTMeshVolumeRendering( renderer, camera, size, steps, alphaCorrection ) {

    if ( renderer === undefined || camera === undefined || size === undefined ) {

        console.error( "INTMeshVolumeRendering : renderer, camera and size must be declared." );

    }

    // Apply Mesh constructor to extend a Mesh object
    THREE.Mesh.apply( this );

    this.type = 'MeshVolumeRendering';

    this._renderer = renderer;
    this._camera = camera;
    this._size = size;
    this._steps = steps !== undefined ? steps : 50;
    this._alphaCorrection = alphaCorrection !== undefined ? alphaCorrection : 0.2;
    this._data ;
    this._dataTextureHeight ;
    this._dataTextureWidth ;

    //Import shaders
    this._shaders = new ShadersVolumeRendering();

    this.geometry ;
    this._material ;

    this._rtTexture;
    this._sceneFirstPass;


    this._init();

}

// Import THREE.Mesh prototype
INTMeshVolumeRendering.prototype = Object.create( THREE.Mesh.prototype );

INTMeshVolumeRendering.prototype.constructor = INTMeshVolumeRendering;


//============================================================================
// Public functions
//============================================================================

    /**
     * Add Data to the Mesh VolumeRendering, and display it.
     * If dataMin and dataMax are not declared, will run a function to calculate them.
     *
     * @param {Float32Array} data - Raw data, value mush be order like depth,Xline,Inline
     * @param {number} [dataMin] - Minimum value of the dataset
     * @param {number} [dataMax] - Maximum value of the dataset
     */
INTMeshVolumeRendering.prototype.addData = function( data, dataMin, dataMax ) {

        if ( data === undefined ) {

                console.error( "INTMeshVolumeRendering : you must include a dataArray" );
                return;

        }

        this._data = data;
        if ( dataMin === undefined || dataMax === undefined ) {

            this._updateDataMinAndDataMax();

        } else {

            this._dataMin = dataMin;
            this._dataMax = dataMax;
            this._material.uniforms.minData.value = this._dataMin;
            this._material.uniforms.maxData.value = this._dataMax;

        }
        this._fillDataArrayForTexture();
        this._generateDataTexture();

    };


/**
  * Update the transfert function in the Volume Rendering.
  *
  * @param {Array} color - Array of CSS color ( like "rgba(x,x,x,x)" or "#ff00fc" or "0xff00fc" )
  * @param {Array} colorpos - Array of position of the color in {@link color}.
  *
  * @return {canvas} Return the canvas use to generate the transfert function in order to display it.
  */
INTMeshVolumeRendering.prototype.updateTransferFunction = function( color, colorpos ) {

    var canvas = document.createElement( 'canvas' );
    canvas.height = 8;
    canvas.width = 256;
    var ctx = canvas.getContext( '2d' );
    var grd = ctx.createLinearGradient( 0, 0, canvas.width - 1 , canvas.height - 1 );
    for ( var i = 0; i < color.length; i++ ) {
        grd.addColorStop( colorpos[i], color[i] );
    }
    ctx.fillStyle = grd;
    ctx.fillRect( 0, 0, canvas.width - 1 , canvas.height - 1 );

    var transfertTexture = new THREE.Texture( canvas );
    transfertTexture.wrapS = transfertTexture.wrapT = THREE.ClampToEdgeWrapping;
    transfertTexture.needsUpdate = true;
    this._material.uniforms.transfertTex.value = transfertTexture;

    return canvas;

};

/**
  * Set the number of steps used in the volume rendering
  *
  * @param {number} steps - Number of steps used in the volume rendering
  */
INTMeshVolumeRendering.prototype.setSteps = function ( steps ) {

    this._material.uniforms.steps.value = steps;

};

/**
  * Get the number of steps used in the volume rendering
  *
  * @return {number}  Number of steps used in the volume rendering
  */
INTMeshVolumeRendering.prototype.getSteps = function () {

    return this._material.uniforms.steps.value;

};

/**
  *  Set the alpha use to correct the volume rendering
  *
  * @param {number} alpha - Alpha used to correct the volume rendering
  */
INTMeshVolumeRendering.prototype.setAlphaCorrection = function ( alpha ) {

    this._material.uniforms.alphaCorrection.value = alpha;

};

/**
  *  Set the alpha use to correct the volume rendering
  *
  * @return {number}  Alpha used to correct the volume rendering
  */
INTMeshVolumeRendering.prototype.getAlphaCorrection = function () {

    return this._material.uniforms.alphaCorrection.value;

};

//============================================================================
// Private functions
//============================================================================

/**
  * Init function, create the geometry, rendertarget and generate the material needed and chnage the property for material.
  *
  * @private
  */
INTMeshVolumeRendering.prototype._init = function() {

    // Create the BoxGeometry
    this.geometry = new THREE.BoxGeometry( this._size.x, this._size.y, this._size.z );
    this.geometry.doubleSided = true;

    // Get the screen size
    var screenSize = new THREE.Vector2( window.innerWidth, window.innerHeight );

    // Create the RenderTarget to store the render of the first pass to give it to the second pass
    this._rtTexture = new THREE.WebGLRenderTarget( screenSize.x, screenSize.y,
        {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            generateMipmaps: false
        } );

    // Create the THREE.Scene for the first pas
    this._sceneFirstPass = new THREE.Scene();

    // Get the max size of a texture support by the graphic card for the size of the datatexture
    this._dataTextureWidth = this._renderer.capabilities.maxTextureSize;

    // Generate the stuff needed for the first pass
    this._generateFirstPass();

    // Generate the material of the second pass (use a the material of this Mesh)
    this._generateSecondPassMaterial();

    // Define an object property to force a firstpass render each time "mesh.material" is called e.g. when the mesh is render in the main render.
    Object.defineProperty( this, "material", { get: function () {

            this._renderFirstPass();
        return this._material;

    } } );

};

/**
  * render function for the first pass. Called each time INTMeshVolumeRendering.material is accessed
  *
  * @private
  */
INTMeshVolumeRendering.prototype._renderFirstPass = function() {

    // Render with the renderer given in the conscructor to the RenderTarget ( _rtTexture )
    this._renderer.render( this._sceneFirstPass, this._camera, this._rtTexture, true );

};

/**
  * Create the mesh for the first pass render and add it to the first pass scene
  *
  * @private
  */
INTMeshVolumeRendering.prototype._generateFirstPass = function() {

    // Create the material first pass
     var materialFirstPass = new THREE.ShaderMaterial( {
            vertexShader: this._shaders.firstPassVertex,
            fragmentShader: this._shaders.firstPassFragment,
            side: THREE.BackSide
        } );

    // Mesh the material and the boxgeometry
    var meshFirstPass = new THREE.Mesh( this.geometry, materialFirstPass );

    // Add the mesh to the first pass scene
    this._sceneFirstPass.add( meshFirstPass );

};

/**
  * Create the second pass material
  *
  * @private
  */
INTMeshVolumeRendering.prototype._generateSecondPassMaterial = function() {

    // Create the second pass material
    this._material = new THREE.ShaderMaterial( {
        vertexShader: this._shaders.secondPassVertex,
        fragmentShader: this._shaders.secondPassFragment,
        side: THREE.FrontSide,
        uniforms: {	tex: { type: "t", value: this._rtTexture.texture },     // uniforms are the var given to the shaders
                    steps: { type: "1f", value: this._steps },
                    transfertTex:  { type: "t", value: null },
                    alphaCorrection: { type: "1f" , value: this._alphaCorrection },
                    size : { value: this._size },
                    dataTex: { type: "t", value: this._dataTexture },
                    widthDataTex: { type: "1f" , value: this._dataTextureWidth },
                    heightDataTex : { type: "1f" , value: this._dataTextureHeight },
                    minData : { type: "1f" , value: this._dataMin },
                    maxData : { type: "1f" , value: this._dataMax }
                }
    } );

};

/**
  * Calculate the minimum and maximum values of the dataset and update their values in the material uniform
  *
  * @private
  */
INTMeshVolumeRendering.prototype._updateDataMinAndDataMax = function() {

    this._dataMin = this._data[ 0 ];
    this._dataMax = this._data[ 0 ];

    this._data.forEach( x => {
        this._dataMin = Math.min( x, this._dataMin );
        this._dataMax = Math.max( x, this._dataMax );
    } );

    this._material.uniforms.minData.value = this._dataMin;
    this._material.uniforms.maxData.value = this._dataMax;

};

/**
  * Fill the data array with 0 so the array will be a square.
  *
  * @private
  */
INTMeshVolumeRendering.prototype._fillDataArrayForTexture = function() {

    if ( this._data === undefined ) {

        console.error( "INTMeshVolumeRendering : fillDataArrayForTexture with data undefined." );
        return;

    }

    // Calculate the Height of the dataTexture
    this._dataTextureHeight = Math.ceil( this._data.length / this._dataTextureWidth );

    // Calculate the number of element missing for the texture to be a rectangle
    var restToFill = ( this._dataTextureWidth - ( this._data.length % this._dataTextureWidth ) ) % this._dataTextureWidth;

    // Create a final Array and fill le empty part with 0 so the texture is a rectangle;
    var dataFinal = new Float32Array( this._data.length + restToFill );
    dataFinal.set( this._data );
    dataFinal.fill( 0, this._data.length );
    this._data = dataFinal;

    this._material.uniforms.heightDataTex.value = this._dataTextureHeight;

};

/**
  * Generate the data texture and link it to the material uniform.
  *
  * @private
  */
INTMeshVolumeRendering.prototype._generateDataTexture = function() {

    // Generate the data texture and link it to the material.
    var dataTexture = new THREE.DataTexture( this._data, this._dataTextureWidth, this._dataTextureHeight, THREE.AlphaFormat, THREE.FloatType );
    dataTexture.needsUpdate = true;
    this._material.uniforms.dataTex.value = dataTexture;

};
