precision highp float;
uniform vec4 color;

void main()
{
    vec2 fragmentPosition = 2.0*gl_PointCoord - 1.0;
    float distance = length(fragmentPosition);
    if (distance > 0.6) {
        discard;
    }
    
    if(color.x == 0.0) {
        if(fragmentPosition.y < 0.1 && fragmentPosition.y > -0.1 && fragmentPosition.x < 0.4 
        && fragmentPosition.x > -0.4) 
            discard;
        if(fragmentPosition.x < 0.1 && fragmentPosition.x > -0.1 && fragmentPosition.y < 0.4 
        && fragmentPosition.y > -0.4) 
            discard;
    }
    else{
        if(fragmentPosition.y < 0.1 && fragmentPosition.y > -0.1 && fragmentPosition.x < 0.4 
        && fragmentPosition.x > -0.4) 
            discard;
    }
    gl_FragColor = color; 
}