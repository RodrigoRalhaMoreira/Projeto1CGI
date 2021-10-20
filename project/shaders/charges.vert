attribute vec4 c_position;
uniform float table_width;
uniform float table_height;

void main()
{   
    gl_PointSize = 16.0;
    gl_Position = c_position / vec4(table_width/2.0,table_height/2.0,1.0,1.0);
}
