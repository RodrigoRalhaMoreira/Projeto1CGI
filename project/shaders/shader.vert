// coordenadas dos pontos -> a vertex shader can manipulate the attributes of vertices. 
// propriedades associadas aos vertices
// vec4 is a type representing a 4 dimensional vector. It consists of 4 floating point values. 
// attribute indicates a value that will be passed per vertex. For each attribute you must bind it. 
attribute vec4 vPosition;
// Uniform is a value that is set per draw call

/**
O cálculo do campo elétrico deverá ser feito acumulando os campos individuais gerados por cada carga.
Vetor com as posições das cargas eléctricas criadoras do campo.
Vetor com os valores de cada uma daquelas cargas.
**/

#define TWOPI 6.28318530718
const int MAX_CHARGES=20;
uniform float table_width;
uniform float table_height;
uniform vec2 uPosition[MAX_CHARGES]; // position (width, height) of a charge
uniform float uVel;

void main() {

    gl_PointSize = 4.0;
    gl_Position = vPosition / vec4(table_width/2.0, table_height/2.0, 1.0, 1.0);
    
}

/**
// convert angle to hue; returns RGB
// colors corresponding to (angle mod TWOPI):
// 0=red, PI/2=yellow-green, PI=cyan, -PI/2=purple
vec3 angle_to_hue(float angle) {
  angle /= TWOPI;
  return clamp((abs(fract(angle+vec3(3.0, 2.0, 1.0)/3.0)*6.0-3.0)-1.0), 0.0, 1.0);
}

vec3 hsv2rgb(vec3 c){
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 colorize(vec2 f) {
    float a = atan(f.y, f.x);
    return vec4(angle_to_hue(a-TWOPI), 1.);
}
**/