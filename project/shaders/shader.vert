#define TWOPI 6.28318530718

attribute vec4 vPosition; // position of a point
const float COLOUMB = 8.99 * pow(10.0, 9.0);
const int MAX_CHARGES=20;
uniform float table_width;
uniform float table_height;
uniform vec3 uPosition[MAX_CHARGES]; // position (width, height, electron\\procton) of a charge
varying vec4 varyingColour;

/** COLORIZE FUNCTION **/

// 0=red, PI/2=yellow-green, PI=cyan, -PI/2=purple
vec3 angle_to_hue(float angle) { // convert angle to hue; returns RGB
  angle /= TWOPI; // colors corresponding to (angle mod TWOPI):
  return clamp((abs(fract(angle+vec3(3.0, 2.0, 1.0)/3.0)*6.0-3.0)-1.0), 0.0, 1.0);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 colorize(vec2 f) {
    float a = atan(f.y, f.x);
    return vec4(angle_to_hue(a-TWOPI), 1.0);
}

void main() {
    
    float electricField;
    vec2 sumElectricFields;
    float r; // distance from the point where the field is estimated and the point where the charge is located. 
    
    gl_PointSize = 4.0;
    
    if(vPosition.z == 0.0) { // does not move
        gl_Position = vPosition / vec4(table_width/2.0, table_height/2.0, 1.0, 1.0);
        varyingColour = vec4(0.0, 0.0, 0.0, 1.0); // the grid background colour is black
    }

    else if(vPosition.z == 1.0) { // points from the grid which move
        for(int i = 0; i < MAX_CHARGES; i++) {
            // E = Ke q / (r * r)
            r = distance(vec2(vPosition.x, vPosition.y), vec2(uPosition[i].x, uPosition[i].y));
            electricField = (COLOUMB * uPosition[i].z) / (r * r);
            // segment -> the straight line joining the place where the charge is and the point where the field is to be determined. 
            vec2 segment = vec2(vPosition.x - uPosition[i].x, vPosition.y - uPosition[i].y);
            // normalize -> in order to prevent the segment from being too large
            normalize(segment);
            // the force to which the point is being subjected (The segment will change due to the electric fields of the charges) 
            sumElectricFields += (electricField * segment);
        }
        sumElectricFields *= 0.00000000005; // for the charger to have a lesser impact  
        if(length(sumElectricFields) > 0.25) 
        sumElectricFields = normalize(sumElectricFields) * 0.25;
        // colorizes the line until the point which is enforced to move to a new place 
        varyingColour = colorize(vec2(sumElectricFields.x / (table_width/2.0), sumElectricFields.y / (table_width/2.0)));
        gl_Position = vec4((vPosition.x + sumElectricFields.x) / (table_width/2.0), 
                    (vPosition.y + sumElectricFields.y) / (table_height/2.0), 1.0, 1.0);    
    }
}
