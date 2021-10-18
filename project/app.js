import * as UTILS from '../../libs/utils.js';
import * as MV from '../../libs/MV.js' // imports from the libraries

/** @type {WebGLRenderingContext} */

const table_width = 3.0;
const grid_spacing = 0.05;
const MAX_DOTS = 10;
const MAX_CHARGES = 10;

let gl;
let table_height;
let vertices = [];
// Necessita de ser atualizado regularmente pelo facto das cargas estarem em movimento.
let position = []; // Guarda as posições das cargas. 
let direction = true; // global initialisation

var draw = [];
var program;
var aBuffer;
var tbw;
var tbh;
var colour;
var vel = 0.0;
var velLoc;
var totalCharges;
var electrons;
var protons;

/**
 * canvas.width/canvas.height = table.width/table.height;
 * A separação entre pontos adjacentes será de 0.05 metros,
 * ou seja, 5 centímetros. 
 */

function animate(time) {

    // this function is called after the web refresh
    window.requestAnimationFrame(animate);

    // drawing code
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    vel += 0.05;

    gl.uniform1f(tbw, table_width);
    gl.uniform1f(tbh, table_height);

    gl.uniform4fv(colour, [1.0, 1.0, 1.0, 1.0]); // a colour fica com uma cor uniforme
    gl.uniform1f(velLoc, 0);
    // starts in 0 and ends in the last index of vertices array
    gl.drawArrays(gl.POINTS, 0, vertices.length); //gl.points -> draw a single dot
    gl.uniform4fv(colour, [1.0, 0.0, 1.0, 1.0]);
    // gl.drawArrays(mode, ,..first (starting index in the arrays).., count(number of indices to be rendered);
    gl.uniform1f(velLoc, vel);
    gl.drawArrays(gl.POINTS, vertices.length, draw.length, MAX_DOTS); 
    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    /**
    // envia cada uma das posições das cargas para o vertex shader
    for(let i = 0; i < MAX_CHARGES; i++) {
        // o tamanho do vector terá que ser conhecido em tempo de compilação, pelo que terá que ser uma constante.
        const uPosition = gl.getUniformLocation(program, "uPosition[" + i + "]"); // passa do programa para a posição da uPosition do shader.vert
        // a posicao fica na posicao i do vetor position, que é atualizado
        gl.uniform2fv(uPosition, MV.flatten(position[i]));
    }
    **/
}

// setup -> Função invocada na chamada colocada no final do script, após carregamento dos shaders
function setup(shaders) {
    // setup
    const canvas = document.getElementById("gl-canvas");
    canvas.width = window.innerWidth; // canvas fica do tamanho da tela do computador
    canvas.height = window.innerHeight; 
    totalCharges = 0;
    electrons = 0;
    protons = 0;

    gl = UTILS.setupWebGL(canvas);

    table_height = (table_width * canvas.height)/canvas.width;
    // Função auxiliar que devolve um programa GLSL a partir do código fonte dos seus shaders.
    program = UTILS.buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    
    // Definição do visor dentro do Canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Cor com que se limpa o ecrã
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    window.addEventListener("resize", function() {
        // canvas fica do tamanho da tela do computador
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        table_height = (table_width * canvas.height)/canvas.width;
        // World Coordinates, que contém todos os objetos que pretendemos ver desenhados no viewport
        gl.viewport(0, 0, canvas.width, canvas.height);
    });

    // getUniformLocation -> passa do program para as var/cons
    tbw = gl.getUniformLocation(program, "table_width");
    tbh = gl.getUniformLocation(program, "table_height");
    colour = gl.getUniformLocation(program, "colour");
    velLoc = gl.getUniformLocation(program, "uVel");
    
    // faz o espaçamento de 0.05 metros entre os vértices e limita o x entre -1.5 a 1.5
    for(let x = -1.5; x <= 1.5; x += grid_spacing) {
        for(let y = -table_height/2; y <= table_height/2; y += grid_spacing) {
            vertices.push(MV.vec2(x, y));
        }
    }

    // Criação e preenchimento dum buffer no GPU com os dados dos vértices.  
    aBuffer = gl.createBuffer();
    // torna o buffer ativo
    // Array guarda valores e não indices -> guarda dados de vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
    // preenche um buffer com dados -> gl.bufferData(target, size, usage);
    // tamanho do buffer vai ser do dos vértices com os dos novos vértices(atraves do MAX_DOTS) 
    gl.bufferData(gl.ARRAY_BUFFER, vertices.length * MV.sizeof["vec2"] + MAX_DOTS * MV.sizeof["vec2"], gl.STATIC_DRAW);
    // gl.bufferSubData(target, offset, ArrayBuffer srcData);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(vertices)); // cria outro buffer com outro tipo de data para ser guardada
    //1o buffer -> guarda todos os pontos || 2o buffer -> gurada todos antes das alteracoes
    
    // -> vai buscar ao vertex shader a vPosition -> descreve quais e como os dados se encontram 
    // armazenados no buffer
    const vPosition = gl.getAttribLocation(program, "vPosition");
    // descreve o layout de cada um dos atributos dentro de um buffer 
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);  
    // enables individual attributes so that they can be used
    gl.enableVertexAttribArray(vPosition);

    canvas.addEventListener("click", function(event) {
        // Start by getting x and y coordinates inside the canvas element

        var cx = canvas.width/2.0; // ponto central do eixo do x na tela
        var cy = canvas.height/2.0; // ponto central do eixo do y na tela

        var x = event.offsetX; // x onde se clica
        var y = event.offsetY; // y onde se clica
        
        // canvas.width/canvas.height = table.width/table.height
        // table height = table.width * canvas.height / canvas.width
        
        if(y < cy) {
            y = (cy - event.offsetY) * (table_height/2.0) / (cy);
        }
        else {
            y = (event.offsetY - cy) * (-table_height/2.0) / (cy);
        }
        
        if(x < cx) {
            x = (- cx + event.offsetX) * (-table_width/2.0) / (-cx);
        }
        else {
            x = (event.offsetX - cx) * (table_width/2.0) / (cx);
        }

        if(totalCharges < MAX_CHARGES) {
            if(event.shiftKey) {
                console.log("(" + x + "," + y + ")"); // insere um eletrão com o shift
                electrons++;
                totalCharges ++;
            }
            else {
                totalCharges ++;
                protons++;
                console.log("(" + x + "," + y + ")"); // insere um protão com o click normal
                
            }
        }
        
    console.log("Click at (" + x + ", " + y + ")");
    
    gl.bufferSubData(gl.ARRAY_BUFFER, vertices.length* MV.sizeof["vec2"] + 
    (draw.length % MAX_DOTS)*MV.sizeof["vec2"], MV.flatten(MV.vec2(x,y)));
    draw.push(MV.vec2(x,y)); // o evento é guardado no array draw, que guarda os vertices q foram clicados
    });
    
    window.requestAnimationFrame(animate);
}

UTILS.loadShadersFromURLS(["shader.vert", "shader.frag"]).then(s => setup(s));


