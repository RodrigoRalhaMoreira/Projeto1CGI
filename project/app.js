import * as UTILS from '../../libs/utils.js';
import * as MV from '../../libs/MV.js'

/** @type {WebGLRenderingContext} */
let gl;
/** @type {WebGLBuffer} */
var grid_buffer, charges_buffer;

//programs
var program, charges_program;

//table metrics
const table_width = 3.0;
let table_height;
let grid_spacing = 0.05;

//uniform locations
var v_position, charges_position, color, charges_color;

//points 
const MAX_CHARGES = 30;
let vertices = [], proton = [], electron = [], charges_pos = [];
var angle = 0.01;
var draw_moving_points = true;
var drawn_protons = 0;
var drawn_electrons = 0;

function animate(time)
{
    // No proximo refrescamente quero que esta funcao seja chamada
    window.requestAnimationFrame(animate);

    // Drawing code
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, grid_buffer);

    v_position = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(v_position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(v_position);

    gl.uniform4fv(color, [1.0,1.0,1.0,1.0]);
    charges_pos = electron.concat(proton);
    for(let i=0; i<MAX_CHARGES && i<charges_pos.length; i++) {
        const uPosition = gl.getUniformLocation(program, "uPosition[" + i + "]");
        gl.uniform3fv(uPosition, MV.flatten(charges_pos[i]));
    }
    gl.drawArrays(gl.LINES, 0, vertices.length);
    
    gl.useProgram(charges_program);
    gl.bindBuffer(gl.ARRAY_BUFFER, charges_buffer);

    charges_position = gl.getAttribLocation(charges_program, "c_position");
    gl.vertexAttribPointer(charges_position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(charges_position);

    gl.uniform4fv(charges_color, [0.5,0.3,1.0,1.0]);
    for(let i = 0; i < electron.length; i++){
        var s = Math.sin( -angle );
        var c = Math.cos( -angle );
        var y = electron[i][1];  
        var x = electron[i][0];
        electron[i][0] = -s*y + c*x;
        electron[i][1] = s*x + c*y;
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(electron));
    if (draw_moving_points) {gl.drawArrays(gl.POINTS, 0, Math.min(electron.length, MAX_CHARGES/2.0));}

    gl.uniform4fv(charges_color, [1.0,0.0,0.0,1.0]);
    for(let i = 0; i < proton.length; i++){
        var s = Math.sin( angle );
        var c = Math.cos( angle );
        var y = proton[i][1];  
        var x = proton[i][0];
        proton[i][0] = -s*y + c*x;
        proton[i][1] = s*x + c*y;
    }
    gl.bufferSubData(gl.ARRAY_BUFFER,(MAX_CHARGES/2.0) * MV.sizeof["vec3"], MV.flatten(proton));
    if (draw_moving_points) gl.drawArrays(gl.POINTS, MAX_CHARGES/2.0, Math.min(proton.length, MAX_CHARGES/2.0));
}

function setup(shaders)
{
    const canvas = document.getElementById("gl-canvas");
    gl = UTILS.setupWebGL(canvas);

    program = UTILS.buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    charges_program = UTILS.buildProgramFromSources(gl, shaders["charges.vert"], shaders["charges.frag"]);

    //uniform variables
    let grid_tw = gl.getUniformLocation(program, "table_width");
    let grid_th = gl.getUniformLocation(program, "table_height");
    color = gl.getUniformLocation(program, "color");
    let charges_tw = gl.getUniformLocation(charges_program, "table_width");
    let charges_th = gl.getUniformLocation(charges_program, "table_height");
    charges_color = gl.getUniformLocation(charges_program, "ccolor");

    //canvas adjustment
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    table_height = table_width * canvas.height / canvas.width;
    gl.useProgram(program);
    gl.uniform1f(grid_tw, table_width);
    gl.uniform1f(grid_th, table_height);
    gl.useProgram(charges_program);
    gl.uniform1f(charges_tw, table_width);
    gl.uniform1f(charges_th, table_height);

    //clear the canvas 
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    //creating vertices
    for(let x = -(table_width/2); x <= (table_width/2); x = Number(Number(x+grid_spacing).toFixed(2))) {
        for(let y = -table_height/2; y <= table_height/2; y = Number(Number(y+grid_spacing).toFixed(2))) {
            vertices.push(MV.vec3(x + (Math.random()*0.01),y + (Math.random()*0.01),0.0));
            vertices.push(MV.vec3(x + (Math.random()*0.01),y + (Math.random()*0.01),1.0));
        }
    }

    //creating the buffer with the size of the number of vertices for the grid 
    grid_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, grid_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices.length*MV.sizeof["vec3"], gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(vertices));

    //creating the buffer for the charges
    charges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, charges_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_CHARGES*MV.sizeof["vec3"], gl.STATIC_DRAW);

    //event listeners

    window.addEventListener("resize", function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        table_height = table_width * canvas.height / canvas.width;
        gl.viewport(0,0,gl.canvas.width, gl.canvas.height);

        gl.useProgram(program);
        gl.uniform1f(grid_tw, table_width);
        gl.uniform1f(grid_th, table_height);
        gl.useProgram(charges_program);
        gl.uniform1f(charges_tw, table_width);
        gl.uniform1f(charges_th, table_height);
     });

    canvas.addEventListener("click", function(event) {
        // Start by getting x and y coordinates inside the canvas element
        var x = (event.offsetX / canvas.width - 1 / 2) * table_width;
        var y = -(event.offsetY / canvas.height - 1 / 2) * table_height;

        gl.bindBuffer(gl.ARRAY_BUFFER, charges_buffer);
        if(event.shiftKey) {
            let electron_position = drawn_electrons % (MAX_CHARGES/2);
            let bufferPlace = electron_position*MV.sizeof["vec2"];
            //gl.bufferSubData(gl.ARRAY_BUFFER, bufferPlace, MV.flatten(MV.vec2(x,y)));
            electron.splice(electron_position, 1, MV.vec3(x,y, -1.0));
            drawn_electrons++;
        }
        else{
            let proton_position = drawn_protons % (MAX_CHARGES/2);
            let bufferPlace = proton_position * MV.sizeof["vec2"];
           // gl.bufferSubData(gl.ARRAY_BUFFER, bufferPlace, MV.flatten(MV.vec2(x,y)));
            proton.splice(proton_position, 1, MV.vec3(x,y, 1.0));
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

UTILS.loadShadersFromURLS(["shader.vert", "shader.frag", "charges.vert", "charges.frag"]).then(s => setup(s));
