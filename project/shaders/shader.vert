#define COLOUMB 8.988e9
#define TWOPI 6.28318530718
attribute vec4 vPosition;
uniform float table_width, table_height;
const int MAX_CHARGES=30;
uniform vec3 uPosition[MAX_CHARGES];
varying vec4 fcolor;

// convert angle to hue; returns RGB
// colors corresponding to (angle mod TWOPI):
// 0=red, PI/2=yellow-green, PI=cyan, -PI/2=purple
vec3 angle_to_hue(float angle) {
  angle /= TWOPI;
  return clamp((abs(fract(angle+vec3(3.0, 2.0, 1.0)/3.0)*6.0-3.0)-1.0), 0.0, 1.0);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 colorize(vec2 f)
{
    float a = atan(f.y, f.x);
    return vec4(angle_to_hue(a-TWOPI), 1.0);
}

void main()
{
    vec2 sumDirections;
    gl_PointSize = 4.0;

    if(vPosition.z == 0.0){
        gl_Position = vPosition / vec4(table_width/2.0,table_height/2.0,1.0,1.0);
        fcolor = vec4(0.0,0.0,0.0,1.0);
    }
    else{
        //calculate the sum of all forces that are being applied in the vertex
        for(int i = 0; i < MAX_CHARGES; i++) {
            vec2 direction = vec2(vPosition.x - uPosition[i].x, vPosition.y - uPosition[i].y);
            float d = distance(vec2(vPosition.x, vPosition.y), vec2(uPosition[i].x, uPosition[i].y));
            float eletric_field = (COLOUMB * uPosition[i].z) / (d*d);
            sumDirections += (direction * eletric_field);
        }   

        if(length(sumDirections) > 0.25) sumDirections = normalize(sumDirections) * 0.25;

        float adjusted_x = (vPosition.x + sumDirections.x)/(table_width/2.0);
        float adjusted_y = (vPosition.y + sumDirections.y)/(table_height/2.0);
        
        gl_Position = vec4(adjusted_x, adjusted_y, 1.0, 1.0); 
        fcolor = colorize(vec2(sumDirections.x, sumDirections.y));
     }
}
