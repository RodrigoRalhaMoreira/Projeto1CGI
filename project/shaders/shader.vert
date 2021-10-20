#define COLOUMB 8.988e9
attribute vec4 vPosition;
uniform float table_width, table_height;
const int MAX_CHARGES=30;
uniform vec2 uPosition[MAX_CHARGES];
uniform float positive_charges, negative_charges;

void main()
{
    vec2 normalized_direction;
    vec2 sumDirections;
    gl_PointSize = 4.0;
    if(vPosition.z == 0.0){
        gl_Position = vPosition / vec4(table_width/2.0,table_height/2.0,1.0,1.0);
    }
    else{
        float charge_value = 1.0;
        float inc = 0.0;
        for(int i = 0; i < MAX_CHARGES; i++) {
            vec2 declive = vec2(vPosition.x - uPosition[i][0], vPosition.y - uPosition[i][1]);
            normalized_direction = normalize(declive);
            float d = distance(vec2(vPosition.x, vPosition.y), vec2(uPosition[i][0], uPosition[i][1]));
            if(inc > positive_charges) charge_value = -1.0;
            float eletric_field = COLOUMB * charge_value / d;
            normalized_direction *= eletric_field;
            sumDirections += normalized_direction;
            inc++;
        }
        sumDirections = sumDirections * 0.0000000000001;
        float adjusted_x = (vPosition.x + sumDirections.x)/(table_width/2.0);
        float adjusted_y = (vPosition.y + sumDirections.y)/(table_height/2.0);
        gl_Position = vec4(adjusted_x, adjusted_y, 1.0, 1.0); 
     }
}
