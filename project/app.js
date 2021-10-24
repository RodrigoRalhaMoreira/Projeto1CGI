/* 
authors:
    Rodrigo Moreira 57943
    Dinis Silvestre 58763
version: 1.0
date: 22/10/2021
*/

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
const grid_spacing = 0.05;
let table_height;

//uniform locations
var v_position, charges_position,charges_color;

//points 
const MAX_CHARGES = 30;
const angle = 0.02;
const CHARGE_VALUE = 0.000000000010;
const MIN_MULTIPLIER = 0.05;
const MAX_MULTIPLIER = 1.1;
var length_multiplier = 0.05;
var direction = true;
let vertices = [], proton = [], electron = [], charges_pos = [];
var draw_moving_points = true;
var drawn_protons = 0;
var drawn_electrons = 0;

function establish_location(program, uniform_variable, buffer) {

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    uniform_variable = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(uniform_variable, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(uniform_variable);

    return uniform_variable;
}

function adjust_charge_position (arr, angle) {
    //for each charge, it will suffer a rotation from its original position that depends on the given angle
    for(let i = 0; i < arr.length; i++){
        var s = Math.sin( angle );
        var c = Math.cos( angle );
        var y = arr[i][1];  
        var x = arr[i][0];
        arr[i][0] = -s*y + c*x;
        arr[i][1] = s*x + c*y;
        arr[i][2] = CHARGE_VALUE * length_multiplier;
    }
    return arr;
}
function animate(time)
{
    // No proximo refrescamente quero que esta funcao seja chamada
    window.requestAnimationFrame(animate);

    // Drawing grid
    gl.clear(gl.COLOR_BUFFER_BIT);

    //establish the position of the grid vertices
    v_position = establish_location(program, v_position, grid_buffer);

    charges_pos = electron.concat(proton);
    for(let i=0; i<MAX_CHARGES && i<charges_pos.length; i++) {
        const uPosition = gl.getUniformLocation(program, "uPosition[" + i + "]");
        gl.uniform3fv(uPosition, MV.flatten(charges_pos[i]));
    }
    
    gl.drawArrays(gl.LINES, 0, vertices.length);
    
    // Drawing charges

    //establish the position of the charges vertices
    charges_position = establish_location(charges_program, charges_position, charges_buffer);
    
    //adjust the positions of the charges
    electron = adjust_charge_position(electron, -angle);
    proton = adjust_charge_position(proton, angle);

    //Put the new positions of the charges in the buffer
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(electron));
    gl.bufferSubData(gl.ARRAY_BUFFER,(MAX_CHARGES/2.0) * MV.sizeof["vec3"], MV.flatten(proton));

    //Spacebar changes the value of this variable to draw or not draw the charges
    if (draw_moving_points) {
        gl.uniform4fv(charges_color, [0.73,0.1,0.14,1.0]);
        gl.drawArrays(gl.POINTS, 0, electron.length);
        gl.uniform4fv(charges_color, [0.0,0.52,0.2,1.0]);
        gl.drawArrays(gl.POINTS, MAX_CHARGES/2.0, proton.length);
    }

    if(direction) length_multiplier += 0.01;
    else length_multiplier -= 0.01;
    if(length_multiplier > MAX_MULTIPLIER) direction = false;
    if(length_multiplier < MIN_MULTIPLIER) direction = true;
}

function setup(shaders)
{
    const canvas = document.getElementById("gl-canvas");
    gl = UTILS.setupWebGL(canvas);

    //building the 2 programs: one for the grid and the other for the charges
    program = UTILS.buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    charges_program = UTILS.buildProgramFromSources(gl, shaders["charges.vert"], shaders["charges.frag"]);

    //uniform variables
    let grid_tw = gl.getUniformLocation(program, "table_width");
    let grid_th = gl.getUniformLocation(program, "table_height");
    let charges_tw = gl.getUniformLocation(charges_program, "table_width");
    let charges_th = gl.getUniformLocation(charges_program, "table_height");
    charges_color = gl.getUniformLocation(charges_program, "color");

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

    //creating vertices for the grid
    for(let x = -(table_width/2); x <= (table_width/2); x = Number(Number(x+grid_spacing).toFixed(2))) {
        for(let y = -table_height/2; y <= table_height/2; y = Number(Number(y+grid_spacing).toFixed(2))) {
            var num1 = ((Math.random()-0.5)*2*0.02);//random position between -0.02 and 0.02
            var num2 = ((Math.random()-0.5)*2*0.02);
            vertices.push(MV.vec3(x + num1,y + num2,0.0)); 
            vertices.push(MV.vec3(x + num1,y + num2,1.0)); 
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
        gl.uniform1f(grid_th, table_height);
        //table_width is always the same no matter what the height so we do not change it.
        gl.useProgram(charges_program);
        gl.uniform1f(charges_th, table_height);
     });

    canvas.addEventListener("click", function(event) {
        // Start by getting x and y coordinates inside the canvas element
        var x = (event.offsetX / canvas.width - 1 / 2) * table_width;
        var y = -(event.offsetY / canvas.height - 1 / 2) * table_height;

        //we do this so when we exceed the amount of charges of one electron or proton, it re-writes over the oldest charge of that type
        if(event.shiftKey) {
            let electron_position = drawn_electrons % (MAX_CHARGES/2); 
            electron.splice(electron_position, 1, MV.vec3(x,y, -CHARGE_VALUE));
            drawn_electrons++;
        }
        else{
            let proton_position = drawn_protons % (MAX_CHARGES/2);
            proton.splice(proton_position, 1, MV.vec3(x,y,CHARGE_VALUE));
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
