attribute vec4 chargesPosition;
uniform float table_width;
uniform float table_height;

void main() {
    gl_PointSize = 10.0;
    gl_Position = chargesPosition / vec4(table_width/2.0, table_height/2.0, 1.0, 1.0); 
}
