attribute vec4 vPosition;
uniform float table_width;
uniform float table_height;
uniform float uTheta;
const int MAX_CHARGES=20;
uniform vec2 uPosition[MAX_CHARGES];


void main()
{
    float s = sin( uTheta );
    float c = cos( uTheta);
    float y = vPosition.y/(table_height/2.0);   
    float x = vPosition.x/(table_width/2.0);
    gl_PointSize = 5.0;

    gl_Position.x = -s*y + c*x;
    gl_Position.y = s*x + c*y;
    gl_Position.z = 0.0;
    gl_Position.w = 1.0;

}
