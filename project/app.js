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
var proton = [];
var electron = [];
var color;
const MAX_CHARGES = 30;
var angle = 0.05;
var draw_moving_points = true;
var vPosition;
var drawn_protons = 0;
var drawn_electrons = 0;
var opacity = 1.0;

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

    gl.uniform4fv(color, [0.5,0.3,1.0,opacity]);
    for(let i = 0; i < electron.length; i++){
        var s = Math.sin( angle );
        var c = Math.cos( angle );
        var y = electron[i][1];  
        var x = electron[i][0];
        electron[i][0] = -s*y + c*x;
        electron[i][1] = s*x + c*y;
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, vertices.length*MV.sizeof["vec2"], MV.flatten(electron));
    if (draw_moving_points) {gl.drawArrays(gl.POINTS, vertices.length, Math.min(electron.length, MAX_CHARGES/2.0));}

    gl.uniform4fv(color, [1.0,0.0,0.0,opacity]);
    for(let i = 0; i < proton.length; i++){
        var s = Math.sin( -angle );
        var c = Math.cos( -angle );
        var y = proton[i][1];  
        var x = proton[i][0];
        proton[i][0] = -s*y + c*x;
        proton[i][1] = s*x + c*y;
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, vertices.length*MV.sizeof["vec2"] + (MAX_CHARGES/2.0) *MV.sizeof["vec2"], MV.flatten(proton));
    if (draw_moving_points) gl.drawArrays(gl.POINTS, vertices.length + MAX_CHARGES/2.0, Math.min(proton.length, MAX_CHARGES/2.0));
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
    for(let x = -(table_width/2); x <= (table_width/2); x = Number(Number(x+grid_spacing).toFixed(2))) {
        for(let y = -table_height/2; y <= table_height/2; y = Number(Number(y+grid_spacing).toFixed(2))) {
            vertices.push(MV.vec2(x,y));
        }
    }

    //creating the buffer with the size of the number of vertices plus the ones to be created
    aBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices.length*MV.sizeof["vec2"] + MAX_CHARGES*MV.sizeof["vec2"], gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(vertices));
    
    //
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    //uniform variables
    tw = gl.getUniformLocation(program, "table_width");
    th = gl.getUniformLocation(program, "table_height");
    color = gl.getUniformLocation(program, "color");

    //event listeners

    window.addEventListener("resize", function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        table_height = table_width * canvas.height / canvas.width;
        gl.viewport(0,0,gl.canvas.width, gl.canvas.height);
     });

    canvas.addEventListener("click", function(event) {
        // Start by getting x and y coordinates inside the canvas element
        var x = (event.offsetX / canvas.width - 1 / 2) * table_width;
        var y = -(event.offsetY / canvas.height - 1 / 2) * table_height;

        if(event.shiftKey) {
            let electron_position = drawn_electrons % (MAX_CHARGES/2);
            let bufferPlace = vertices.length*MV.sizeof["vec2"] + electron_position*MV.sizeof["vec2"];
            gl.bufferSubData(gl.ARRAY_BUFFER, bufferPlace, MV.flatten(MV.vec2(x,y)));
            electron.splice(electron_position, 1, MV.vec2(x,y));
            drawn_electrons++;
        }
        else{
            let proton_position = drawn_protons % (MAX_CHARGES/2);
            let bufferPlace =  vertices.length*MV.sizeof["vec2"] + (MAX_CHARGES/2)*MV.sizeof["vec2"] + proton_position * MV.sizeof["vec2"];
            gl.bufferSubData(gl.ARRAY_BUFFER, bufferPlace, MV.flatten(MV.vec2(x,y)));
            proton.splice(proton_position, 1, MV.vec2(x,y));
            drawn_protons++;
        }
    }); 

    document.addEventListener("keyup", event => {
        if (event.code === "Space") {
           draw_moving_points = !draw_moving_points;
        }
    });

    window.requestAnimationFrame(animate);
}

UTILS.loadShadersFromURLS(["shader.vert", "shader.frag"]).then(s => setup(s));
