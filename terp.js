'use strict';

var dbg = 0;
var maxInterval = 4 * 60;  // in frames, normally 60 frames/second

var schedule = requestAnimationFrame;
var Tau = 2 * Math.PI;

function makeBot(program, turtle) {
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
                turtle[qi]();
                return true;
            }
            case '0': case '1': case '2': case '3': case '4':
            case '5': case '6': case '7': case '8': case '9': {
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
        turtle: turtle,
    };
}

function makeTurtle(x, y, heading, stepping) {
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
        show: show,
        f: forward,
        b: backward,
        l: left,
        r: right,
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
            bot.receive('' + i);
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

        turtleCtx.clearRect(0, 0, width, height);
        bot.turtle.show();
    }
    ++nticks;
    schedule(tick);
}
