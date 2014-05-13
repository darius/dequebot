'use strict';

var dbg = 0;
var maxInterval = 4 * 60;  // in frames, normally 60 frames/second

var schedule = requestAnimationFrame;
var Tau = 2 * Math.PI;

function makeBot(program, turtle) {
    var q = [];
    function clear() {
        q = [];
    }
    function reset() {
        clear();
        turtle.reset();
    }
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
            case '<':
            case '>': {
                q.splice(i, i+1);
                turtle[qi]();
                return true;
            }
            case 'A': case 'C': case 'E': case 'G': case 'I':
            case 'B': case 'D': case 'F': case 'H': case 'J': {
                var d = qi.charCodeAt(0) - 65; // 'A'
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
        turtle: turtle,
        clear: clear,
        reset: reset,
    };
}

function makeTurtle(x0, y0, heading0, stepping) {
    var x = x0, y = y0, heading = heading0;
    function reset() {
        x = x0; y = y0; heading = heading0;
    }
    function show() {
        if (dbg) console.log('turtle show', x, y, heading);
        var h = stepping / 2; // for now
        turtleCtx.beginPath();
        turtleCtx.moveTo(x + h * Math.cos(heading + Tau/3),
                         y + h * Math.sin(heading + Tau/3));
        turtleCtx.lineTo(x + h * Math.cos(heading),
                         y + h * Math.sin(heading));
        turtleCtx.lineTo(x + h * Math.cos(heading - Tau/3),
                         y + h * Math.sin(heading - Tau/3));
        turtleCtx.stroke();
    }
    function step(distance) {
        ctx.beginPath();
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
        heading -= Tau/16;      // (left-handed coordinate system)
    }
    function right() {
        if (dbg) console.log('right');
        heading += Tau/16;      // (left-handed coordinate system)
    }
    return {
        reset: reset,
        show: show,
        f: forward,
        b: backward,
        '<': left,
        '>': right,
    };
}

var ctx, turtleCtx;
var running, interval;
var aProgram;
var bot;
var width, height;

function start() {
    width = canvas.width;
    height = canvas.height;

    ctx = canvas.getContext('2d');

    turtleCtx = turtling.getContext('2d');
    turtleCtx.strokeStyle = 'red';

    var turtle = makeTurtle(width/2, height/2, -Tau/4, 20);

    var i;
    aProgram = [];
    codeboxes.forEach(function(box, i) {
        aProgram.push(box.value);
        box.onchange = function() { aProgram[i] = box.value; }    
    });
    senders.forEach(function(button, i) {
        button.onclick = function() {
            bot.receive(String.fromCharCode(65+i)); // A, B, C, ...
            botstate.innerHTML = bot.showState();
        };
    });

    faster.onclick = function() {
        interval = Math.max(1, parseInt(interval/2));
        speedbumped();
    };
    slower.onclick = function() {
        interval = Math.min(maxInterval, interval*2);
        speedbumped();
    };
    pause.onclick = function() {
        running = !running;
        pause.innerHTML = (running ? 'Pause' : 'Play');
        if (running) {
            nticks = 0;
            schedule(tick);
        }
    }
    function speedbumped() {
        faster.disabled = (interval === 1);
        slower.disabled = (interval === maxInterval);
        nticks = 0;
    }
    doF.onclick     = function() { turtle.f();    reshowTurtle(); };
    doB.onclick     = function() { turtle.b();    reshowTurtle(); };
    doLeft.onclick  = function() { turtle['<'](); reshowTurtle(); };
    doRight.onclick = function() { turtle['>'](); reshowTurtle(); };

    clear.onclick = function() { bot.clear(); };
    reset.onclick = function() {
        bot.reset();
        ctx.clearRect(0, 0, width, height);
        reshowTurtle();
    };

    bot = makeBot(aProgram, turtle);
    running = true;
    interval = 30;
    speedbumped();
    schedule(tick);
}

var nticks = 0;

function tick() {
    if (!running) return;
    if (nticks % interval === 0) {
        bot.run(1);
        botstate.innerHTML = bot.showState();
        reshowTurtle();
    }
    ++nticks;
    schedule(tick);
}

function reshowTurtle() {
    turtleCtx.clearRect(0, 0, width, height);
    bot.turtle.show();
}
