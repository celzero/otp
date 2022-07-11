
export {relevel, d, i, e, w};

export {debug, info, warn, error};

const debug = 0;
const info = 1;
const warn = 2;
const error = 3;

const defaultLevel = info;
let level = defaultLevel;

function relevel(x) {
    switch (x) {
        case debug:
        case info:
        case warn:
        case error:            
            level = x;
        default:
            level = defaultLevel;
    }
}

function d(...r) {
    if (level >= debug) {
        console.log(...r);
    }
}

function i(...r) {
    if (level >= info) {
        console.log(...r);
    }
}

function w(...r) {
    if (level >= warn) {
        console.log(...r);
    }
}

function e(...r) {
    if (level >= error) {
        console.log(...r);
    }
}