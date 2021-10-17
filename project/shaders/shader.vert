attribute vec4 vPosition;
uniform float table_width;
uniform float table_height;

void main()
{
    gl_PointSize = 4.0;
    gl_Position = vPosition / vec4(table_width/2.0, table_height/2.0, 1.0, 1.0);
}
