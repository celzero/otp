export { relevel, d, i, e, w };

export { debug, info, warn, error };

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
      break;
    default:
      level = defaultLevel;
      break;
  }
  console.log("log:relevel", level);
}

function d(...r) {
  if (level <= debug) {
    console.debug(...r);
  }
}

function i(...r) {
  if (level <= info) {
    console.log(...r);
  }
}

function w(...r) {
  if (level <= warn) {
    console.warn(...r);
  }
}

function e(...r) {
  if (level <= error) {
    console.error(...r);
  }
}
