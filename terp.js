'use strict';

var dbg = 0;

var Tau = 2 * Math.PI;

function makeMachine(program, bot) {
    var q = [];
    function toString() {
        return program.toString() + ' / ' + q.toString();
    }
    function receive(message) {
        q.push(message);
    }
    function run(nsteps) {
        for (; 0 < nsteps; --nsteps) {
            if (dbg) console.log('q', q);
            if (!step())
                return false;
        }
        return true;
    }
    function step() {
        for (var i = 0; i < q.length; ++i) {
            var qi = q[i];
            switch (qi) {
            case 'b':
            case 'f':
            case 'l':
            case 'r': {
                q.splice(i, i+1);
                bot[qi]();
                return true;
            }
            case '0':
            case '1': {
                var d = parseInt(qi);
                var replacement = program[d].split('');
                q.splice.apply(q, [i, i+1].concat(replacement)); // wow that was ugly
                return true;
            }
            }
        }
        return false;
    }
    return {
        receive: receive,
        run: run,
        step: step,
        toString: toString,
    };
}

function makeBot(x, y, heading, stepping) {
    function step(distance) {
        ctx.moveTo(x, y);
        x += distance * Math.cos(heading);
        y += distance * Math.sin(heading);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    function forward() {
        if (dbg) console.log('forward');
        step(stepping);
    }
    function backward() {
        if (dbg) console.log('backward');
        step(-stepping);
    }
    function left() {
        if (dbg) console.log('left');
        heading += Tau/16;
    }
    function right() {
        if (dbg) console.log('right');
        heading -= Tau/16;
    }
    return {
        f: forward,
        b: backward,
        l: left,
        r: right,
    };
}

var m;
var ctx;
var aProgram;

function start() {
    var width = canvas.width;
    var height = canvas.height;
    ctx = canvas.getContext('2d');
    ctx.translate(width/2, height/2);
    ctx.scale(width/2, -height/2);
    ctx.lineWidth = 2/width;

    aProgram = [program0.value, program1.value];
    var bot = makeBot(0, 0, Tau/4, 20/width);
    m = makeMachine(aProgram, bot);

    program0.onchange = function() { aProgram[0] = program0.value; }
    program1.onchange = function() { aProgram[1] = program1.value; }
    program2.onchange = function() { aProgram[2] = program2.value; }
    program3.onchange = function() { aProgram[3] = program3.value; }

    send0.onclick = function() { m.receive('0'); };
    send1.onclick = function() { m.receive('1'); };
    send2.onclick = function() { m.receive('2'); };
    send3.onclick = function() { m.receive('3'); };

    animating(tick);
}

function tick() {
    m.run(1);
}
