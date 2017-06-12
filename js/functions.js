/* jshint esversion: 6 */

/**
 * Get the color table with red, green and blue values and create the string
 * with the rgb format.
 *
 * @return {string}  String with the rgb value.
 */
Array.prototype.toRGB = function() {

    if ( this.length == 3 ) {

        result = "rgb(" + Math.round( this[ 0 ] ) +
                    "," + Math.round( this[ 1 ] ) +
                    "," + Math.round( this[ 2 ] ) + ")";

    } else {

        result = "rgb( 0, 0, 0 )";

    }

    return result;

};


/**
 * Get the color table (with red, green and blue values) and the alpha value.
 * Create the string with the rgba format.
 *
 * @param {number} alpha - Alpha value used for the opacity. Transparent if no indicated.
 *
 * @return {string}  String with the rgba value.
 */
Array.prototype.toRGBA = function( alpha = 0 ) {

    /* Take color table, the alpha and return rgba format. */
    if ( this.length == 3 ) {

        result = "rgba(" + Math.round( this[ 0 ] ) +
                    "," + Math.round( this[ 1 ] ) +
                    "," + Math.round( this[ 2 ] ) +
                    "," + alpha + ")";

    } else {

        result = "rgba( 0, 0, 0, " + alpha + " )";

    }

    return result;

};
