import * as buf from "./buf.js";

export {hkdfaes, hkdfhmac, hkdfhotp, aes128, rand, ctx};

// ref: gist.github.com/geekman/f9735602f744ebe5fa812f8ba17518c4
async function hkdf(sk) {
    return await crypto.subtle.importKey(
      'raw',
      sk,
      'HKDF',
      false, // extractable? always false for use as derivedKey
      ['deriveKey'], // usage
    );
}

async function dangeroushmac(sk) {
    return await crypto.subtle.importKey(
      'raw',
      sk,
      hmac256opts(),
      false, // extractable? can be true for sign, verify
      ['sign', 'verify'], // usage
    );
}

// salt for hkdf may be zero: stackoverflow.com/a/64403302
async function hkdfhmac(skmac, usectx, salt = new Uint8Array()) {
    const dk = await hkdf(skmac);
    return await crypto.subtle.deriveKey(
        hkdf256(salt, usectx),
        dk,
        hmac256opts(),
        false, // extractable? can be true for sign, verify
        ['sign', 'verify'], // usage
    );
}

async function hkdfaes(skaes, usectx, salt = new Uint8Array()) {
    const dk = await hkdf(skaes);
    return await crypto.subtle.deriveKey(
        hkdf256(salt, usectx),
        dk,
        aes128opts(),
        false, // extractable? can be true for encrypt, decrypt
        ['encrypt', 'decrypt'], // usage
    );
}

async function hkdfhotp(skotp, usectx, salt = new Uint8Array()) {
    const dk = await hkdf(skotp);
    return await crypto.subtle.deriveKey(
        hkdf256(salt, usectx),
        dk,
        hmacsha1opts(),
        false,
        ['sign', 'verify'],
    );
}

function aes128(iv, ad) {
    return {name:'AES-GCM', iv: iv, additionalData: ad};
}

function aes128opts() {
    return {name:'AES-GCM', length: 128};
}

function hmac256opts() {
    return {name:'HMAC', hash:'SHA-256'};
}

function hmacsha1opts() {
    return {name:'HMAC', hash:'SHA-1'};
}

function hkdf256(salt, usectx) {
    return {name:'HKDF', hash:'SHA-256', salt: salt, info: usectx};
}

async function rand(bytes = 16) {
    return await crypto.getRandomValues(new Uint8Array(bytes));
}

function ctx(strctx) {
    if (!strctx) return null;
    return buf.fromStr(strctx);
}
