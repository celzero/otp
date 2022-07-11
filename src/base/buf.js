
export {asB64, fromB64, fromStr, asStr, cat, toBytes, eq};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64Url(b) {
    const u = b.replaceAll("+", "-").replaceAll("/", "_");
    const pad = u.indexOf("=");
    return (pad > 0) ? u.slice(0, pad) : u;
}

function undoBase64Url(b) {
    return b.replaceAll("-", "+").replaceAll("_", "/");
}

function byteStringToUint8Array(byteString) {
    const ui = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; ++i) {
      ui[i] = byteString.charCodeAt(i);
    }
    return ui;
}

function uint8ArrayToByteString(ab) {
    return String.fromCharCode(...toBytes(ab));
}

function toBytes(b) {
    if (!b || !b.byteLength || b.byteLength <= 0) return null;
    return new Uint8Array(b);
}

function asB64(ab) {
    return base64Url(btoa(uint8ArrayToByteString(ab)));
}

function fromB64(b64) {
    return byteStringToUint8Array(atob(undoBase64Url(b64)));
}

function fromStr(s) {
    return encoder.encode(s);
}

function asStr(ab) {
    return decoder.decode(ab);
}

function cat(...bs) {
    const b = new Uint8Array(bs.reduce((acc, b) => acc + b.byteLength, 0));
    let i = 0;
    for (const bb of bs) {
        b.set(bb, i);
        i += bb.byteLength;
    }
    return b;
}

function eq(ab1, ab2) {
    const b1 = toBytes(ab1);
    const b2 = toBytes(ab2);
    if (b1.byteLength !== b2.byteLength) {
        return false;
    }
    return b1.every((b, i) => b === b2[i]);
}