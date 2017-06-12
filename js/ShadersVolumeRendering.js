/* jshint esversion: 6 */
/**
 * @author Vincent Dumestre
 * @author Nathan Krupa
 */

function ShadersVolumeRendering(){

    this.firstPassVertex = `
        varying vec3 worldSpaceCoords;
        void main() {
            worldSpaceCoords = position ; //move it from [-0.5;0.5] to [0,1]
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`;

    this.firstPassFragment = `
        varying vec3 worldSpaceCoords;
        void main() {
            gl_FragColor = vec4(worldSpaceCoords.x , worldSpaceCoords.y, worldSpaceCoords.z, 1);
        }`;


    this.secondPassVertex = `
        varying vec3 worldSpaceCoords;
        varying vec4 projectedCoords;
        void main() {
            worldSpaceCoords = (modelMatrix * vec4(position , 1.0)).xyz;
            gl_Position = projectionMatrix *  modelViewMatrix * vec4(position, 1.0);
            projectedCoords =  projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`;


    this.secondPassFragment = `
        varying vec3 worldSpaceCoords;
        varying vec4 projectedCoords;
        uniform sampler2D tex;
        uniform float steps;
        uniform float alphaCorrection;
        uniform float widthDataTex;
        uniform float heightDataTex;
        uniform float minData;
        uniform float maxData;
        uniform vec3 size;
        uniform sampler2D transfertTex;
        uniform sampler2D dataTex;

        const int MAX_STEPS = 4096;


        vec4 transform(float intensity){
            vec4 color;
            color = texture2D(transfertTex,vec2(0.99*(intensity-minData)/(maxData-minData),0.5));
            return color;

        }

        float getIntensity(vec3 position){
            float intensity;
            intensity = texture2D(dataTex,
                                  vec2((1.+2.*mod(((size.y-position.y-1.)+size.y*floor(position.x+size.x*floor(position.z))),widthDataTex))/(2.*widthDataTex),
                                     (1.+2.*floor(((size.y-position.y-1.)+size.y*floor(position.x+size.x*floor(position.z)))/widthDataTex))/(2.*heightDataTex)
                                 )
                             ).a;
            return intensity;
        }

        vec3 changeCoordinates(vec3 position){
            vec3 new = vec3(0.,0.,0.);
            new.x = position.x + (size.x / 2.);
            new.y = position.y + (size.y / 2.);
            new.z = position.z + (size.z / 2.);
            return new;
        }


        void main(void) {
            //Transform the coordinates it from [-1;1] to [0;1]
            vec2 texc = vec2(((projectedCoords.x / projectedCoords.w) + 1.0) / 2.0,
                             ((projectedCoords.y / projectedCoords.w) + 1.0) / 2.0);
            //The back position is the world space position stored in the texture.
            vec3 backPos = texture2D(tex, texc).xyz;
            //The front position is the world space position of the second render pass.
            vec3 frontPos = worldSpaceCoords;
            //The direction from the front position to back position.
            vec3 dir = backPos - frontPos;
            float rayLength = length(dir);
            //Calculate how long to increment in each step.
            float delta = 1.0 / steps;
            //The increment in each direction for each step.
            vec3 deltaDirection = dir * delta;
            float deltaDirectionLength = length(deltaDirection);
            //Start the ray casting from the front position.
            vec3 currentPosition = frontPos;
            //The color accumulator.
            vec4 accumulatedColor = vec4(0.0);
            //The alpha value accumulated so far.
            float accumulatedAlpha = 0.0;
            //How long has the ray travelled so far.
            float accumulatedLength = 0.0;


            vec4 colorSample;
            float alphaSample;
            //Perform the ray marching iterations
            for (int i = 0; i < MAX_STEPS; i++) {
                //Get the voxel intensity value from the 3D texture.
                colorSample = transform(getIntensity(changeCoordinates(currentPosition)));
                //Allow the alpha correction customization.
                alphaSample = colorSample.a * alphaCorrection;
                //Applying this effect to both the color and alpha accumulation results in more realistic transparency.
                alphaSample *= (1.0 - accumulatedAlpha);

                //Perform the composition.
                accumulatedColor += colorSample * alphaSample;
                //Store the alpha accumulated so far.
                accumulatedAlpha += alphaSample;
                //Advance the ray.
                currentPosition += deltaDirection;
                accumulatedLength += deltaDirectionLength;
                //If the length traversed is more than the ray length, or if the alpha accumulated reaches 1.0 then exit.
                if (accumulatedAlpha >= 1.0) {
                    //  accumulatedColor = vec4(1.,1.,0.,1.);
                    break;
                }
                if ( accumulatedLength >= rayLength) {
                    //accumulatedColor = vec4(0.,1.,1.,1.);
                    break;
                }
            }
            gl_FragColor  = accumulatedColor;
        }`;


}
