import * as UTILS from '../../libs/utils.js';
import * as MV from '../../libs/MV.js' // imports from the libraries

/** @type {WebGLRenderingContext} */

const table_width = 3.0;
const grid_spacing = 0.05;
const MAX_CHARGES = 30;
const ANGLE = 0.02; 

let gl;
let table_height;
let vertices = [];
// Necessita de ser atualizado regularmente pelo facto das cargas estarem em movimento.
let position = []; // Guarda as posições das cargas. 
let electronsV = [];
let protonsV = [];

var hidden = false;
var program;
var aBuffer;
var tbw;
var tbh;
var colour;
var vel = 0.05;
var velLoc;
var totalCharges;

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
    gl.uniform1f(velLoc, 0); // puts the angle of Vert of rotation to 0.
    gl.uniform1f(tbw, table_width);
    gl.uniform1f(tbh, table_height);
    gl.uniform4f(colour, 1.0, 0.0, 1.0, 0.0); // a colour fica com uma cor uniforme   
    gl.drawArrays(gl.POINTS, 0, vertices.length); //gl.points -> draw a single dot
    // starts in 0 and ends in the last index of vertices array
    gl.uniform1f(velLoc, vel);

    // gl.uniform4fv(colour, [1.0, 1.0, 1.0, 1.0]); [0.0, 1.0, 0.0, 1.0]
    if(!hidden) {
        gl.uniform4f(colour, 0.0, 1.0, 0.0, 1.0); // a colour fica com uma cor uniforme -> verde (p. charges)
        for(let i = 0; i < electronsV.length; i++) {
            var x = electronsV[i][0]; // gl_Position.z = 0.0;
            var y = electronsV[i][1]; // gl_Position.w = 1.0;
            // gl_Position.x = -s * vPosition.y/(table_height/2.0) + c * vPosition.x/(table_width/2.0);
            electronsV[i][0]= - Math.sin(vel) * y + Math.cos(vel) * x;
            // gl_Position.y = s * vPosition.x/(table_width/2.0) + c * vPosition.y/(table_height/2.0);
            electronsV[i][1]= Math.sin(vel) * x + Math.cos(vel) * y; 
        }
        gl.bufferSubData(gl.ARRAY_BUFFER, vertices.length * MV.sizeof["vec2"], MV.flatten(electronsV));
        gl.drawArrays(gl.POINTS, vertices.length, Math.min(electronsV.length, MAX_CHARGES/2));

        gl.uniform4f(colour, 1.0, 0.0, 0.0, 1.0); // a colour fica com uma cor uniforme -> vermelha (n. charges)
        for(let i = 0; i < protonsV.length; i++) {
            var x = protonsV[i][0]; // gl_Position.z = 0.0;
            var y = protonsV[i][1]; // gl_Position.w = 1.0;
            // gl_Position.x = -s * vPosition.y/(table_height/2.0) + c * vPosition.x/(table_width/2.0);
            protonsV[i][0]= - Math.sin(-vel) * y + Math.cos(-vel) * x;
            // gl_Position.y = s * vPosition.x/(table_width/2.0) + c * vPosition.y/(table_height/2.0);
            protonsV[i][1]= Math.sin(-vel) * x + Math.cos(-vel) * y; 
        }
        gl.bufferSubData(gl.ARRAY_BUFFER, vertices.length * MV.sizeof["vec2"]+
        (MAX_CHARGES/2) * MV.sizeof["vec2"], MV.flatten(protonsV));
        gl.drawArrays(gl.POINTS, vertices.length + MAX_CHARGES/2.0, Math.min(protonsV.length, MAX_CHARGES/2));
    }
    
    // gl.uniform1f(velLoc, -vel); // mete velocidade no vertice de rotacao -> proctons
    // gl.drawArrays(mode, ,..first (starting index in the arrays).., count(number of indices to be rendered);
    // gl.drawArrays(gl.POINTS, vertices.length, protonsV.length, MAX_CHARGES); // desenha um ponto que e aloca a localizaçao na 
    // 1a pos do array electrons e tem como maximo size MAX_CHARGES
    
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
    
    for(let x = -1.5; x <= 1.5; x = Number(Number(x + grid_spacing).toFixed(2))) {
        for(let y = -table_height/2; y <= table_height/2; y =  Number(Number(y + grid_spacing).toFixed(2))) {
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
    gl.bufferData(gl.ARRAY_BUFFER, vertices.length * MV.sizeof["vec2"] + MAX_CHARGES * MV.sizeof["vec2"], gl.STATIC_DRAW);
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

    document.body.onkeyup = function(event) {
        if(hidden == false) {
            if(event.code === 'Space') 
                hidden = true;
        }
        else if(hidden == true) {
            if(event.code === 'Space')
                hidden = false;
        }
    }

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
                let ev = electronsV.length % (MAX_CHARGES/2.0);
                gl.bufferSubData(gl.ARRAY_BUFFER, vertices.length * MV.sizeof["vec2"] + 
                ev * MV.sizeof["vec2"], MV.flatten(MV.vec2(x,y)));
                electronsV.push(MV.vec2(x,y)); // o evento é guardado no array electronsV, que guarda os vertices q foram clicados
            }
            else {
                let ep = protonsV.length % (MAX_CHARGES/2.0);
                gl.bufferSubData(gl.ARRAY_BUFFER, vertices.length * MV.sizeof["vec2"] + 
                MAX_CHARGES/2 * MV.sizeof["vec2"] +
                ep * MV.sizeof["vec2"], MV.flatten(MV.vec2(x,y)));
                protonsV.push(MV.vec2(x,y)); // o evento é guardado no array protonsV, que guarda os vertices q foram clicados
            }
            console.log("Clicked at (" + x + "," + y + ")"); // insere um eletrão com o shift 
            totalCharges ++;
        }
        else 
            alert("Máximo de cargas foi atingido");
    });
    window.requestAnimationFrame(animate);
}

UTILS.loadShadersFromURLS(["shader.vert", "shader.frag"]).then(s => setup(s));