// iluminacao aplicada ao nivel dos fragmentos - They are interpolated between the defined vertices following specific rules.
// Pixel shader -> The fragment shader takes care of how the pixels between the vertices look.
//  the image is calculated and the pixels between the vertices are filled in or "coloured". 
precision highp float;
uniform vec4 colour;

void main() {
    gl_FragColor = colour;
}
