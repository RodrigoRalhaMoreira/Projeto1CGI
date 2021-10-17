import * as UTILS from '../../libs/utils.js';
import * as MV from '../../libs/MV.js'

/** @type {WebGLRenderingContext} */
let gl;
/** @type {WebGLBuffer} */
var aBuffer;

const table_width = 3.0;
let table_height;
let grid_spacing = 0.05;
let vertices = [];
var program;
var tw;
var th;
var drawVertice = [];
var color;
const MAX_DOTS = 30;

function animate(time)
{
    // No proximo refrescamente quero que esta funcao seja chamada
    window.requestAnimationFrame(animate);

    // Drawing code
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.uniform1f(tw, table_width);
    gl.uniform1f(th, table_height);
    gl.uniform4fv(color, [1.0,1.0,1.0,1.0]);
    gl.drawArrays(gl.POINTS, 0, vertices.length);

    gl.uniform4fv(color, [1.0,0.0,0.0,1.0]);
    gl.drawArrays(gl.POINTS, vertices.length, Math.min(drawVertice.length), MAX_DOTS);
}

function setup(shaders)
{
    const canvas = document.getElementById("gl-canvas");
    gl = UTILS.setupWebGL(canvas);

    program = UTILS.buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    //canvas adjustment
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    table_height = table_width * canvas.height / canvas.width;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    //creating vertices
    for(let x = -1.5; x <= 1.5; x = Number(Number(x+grid_spacing).toFixed(2))) {
        for(let y = -table_height/2; y <= table_height/2; y = Number(Number(y+grid_spacing).toFixed(2))) {
            vertices.push(MV.vec2(x,y));
        }
    }

    //creating the buffer with the size of the number of vertices plus the ones to be created
    aBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices.length*MV.sizeof["vec2"] + MAX_DOTS*MV.sizeof["vec2"], gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(vertices));

    //
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    tw = gl.getUniformLocation(program, "table_width");
    th = gl.getUniformLocation(program, "table_height");
    color = gl.getUniformLocation(program, "color");

    window.addEventListener("resize", function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        table_height = table_width * canvas.height / canvas.width;
        gl.viewport(0,0,gl.canvas.width, gl.canvas.height);
     });

    canvas.addEventListener("click", function(event) {
        // Start by getting x and y coordinates inside the canvas element
        var centralX = canvas.width/2;
        var centralY = canvas.height/2;
        var x = event.offsetX;
        var y = event.offsetY;
        
        if(x < centralX) {
            x = (-centralX + event.offsetX) * (-table_width/2) / (-centralX);
        }
        else {
            x = (event.offsetX - centralX) * (table_width/2) / (centralX); 
        }

        if(y < centralY) {
            y = (centralY - event.offsetY) * (table_height/2) / (centralY);
        }
        else {
            y = (event.offsetY - centralY) * (-table_height/2) / (centralY); 
        }

        console.log("Click at (" + x + ", " + y + ")");

        gl.bufferSubData(gl.ARRAY_BUFFER, vertices.length*MV.sizeof["vec2"] + (drawVertice.length % MAX_DOTS)*MV.sizeof["vec2"], MV.flatten(MV.vec2(x,y)));
        drawVertice.push(MV.vec2(x,y));
    }); 

    window.requestAnimationFrame(animate);
}

UTILS.loadShadersFromURLS(["shader.vert", "shader.frag"]).then(s => setup(s));
