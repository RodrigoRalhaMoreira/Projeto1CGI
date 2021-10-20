attribute vec4 chargesPosition;
const int MAX_CHARGES=20;
// uniform vec2 electronPos[MAX_CHARGES]; // position (width, height) of a charge
// uniform vec2 protonPos[MAX_CHARGES];
uniform float table_width;
uniform float table_height;

// uniform float charge = 0.1;
// const float COLOUMB = 8.99 * pow(10.0, 9.0);
/**
vec2 magneticArray = vec2(0.0, 0.0);

float distance(vec2 pos) {
    float xDistance = vPosition.x - pos.x;
    float yDistance = vPosition.y - pos.y;

    return sqrt(xDistance * xDistance + yDistance * yDistance);
}

void calculate() {
    for(int i = 0; i <; i++) {
        float radius = ca
    }
}
**/

void main() {
    gl_PointSize = 4.0;
    gl_Position = chargesPosition / vec4(table_width/2.0, table_height/2.0, 1.0, 1.0); 
}
