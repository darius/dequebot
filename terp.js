'use strict';

var dbg = 0;

var Tau = 2 * Math.PI;

function makeMachine(program, bot) {
    var q = [];
    function showState() {
        return q.join('');
    }
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
        showState: showState,
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

var ctx;

var aProgram;
var machine;

function start() {
    var width = canvas.width;
    var height = canvas.height;
    ctx = canvas.getContext('2d');
    ctx.translate(width/2, height/2);
    ctx.scale(width/2, -height/2);
    ctx.lineWidth = 2/width;

    var bot = makeBot(0, 0, Tau/4, 20/width);

    var i;
    aProgram = [];
    codeboxes.forEach(function(box, i) {
        aProgram.push(box.value);
        box.onchange = function() { aProgram[i] = box.value; }    
    });
    senders.forEach(function(button, i) {
        button.onclick = function() { machine.receive('' + i); };
    });

    machine = makeMachine(aProgram, bot);
    animating(tick);
}

var nticks = 0;

function tick() {
    if (nticks % 60 === 0) machine.run(1);
    botstate.innerHTML = machine.showState();
    ++nticks;
}
