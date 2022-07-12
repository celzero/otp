import * as buf from "./buf.js";

export {hkdfaes, hkdfhmac, aes128, rand, ctx};

// ref: gist.github.com/geekman/f9735602f744ebe5fa812f8ba17518c4
async function hkdf(seed) {
    const sk = buf.fromStr(seed);
    return await crypto.subtle.importKey(
      'raw',
      sk,
      'HKDF',
      false, // extractable? always false for use as derivedKey
      ['deriveKey'], // usage
    );
}

async function dangeroushmac(seed) {
    const sk = buf.fromStr(seed);
    return await crypto.subtle.importKey(
      'raw',
      sk,
      { name: 'HMAC', hash: 'SHA-256' },
      false, // extractable? can be true for sign, verify
      ['sign', 'verify'], // usage
    );
}

// salt for hkdf may be zero: stackoverflow.com/a/64403302
async function hkdfhmac(skmac, usectx, salt = new Uint8Array()) {
    const dk = await hkdf(skmac);
    return await crypto.subtle.deriveKey(
        {name:'HKDF', hash:'SHA-256', salt: salt, info: usectx},
        dk,
        {name:'HMAC', hash:'SHA-256'},
        false, // extractable? can be true for sign, verify
        ['sign', 'verify'], // usage
    );
}

async function hkdfaes(skaes, usectx, salt = new Uint8Array()) {
    const dk = await hkdf(skaes);
    return await crypto.subtle.deriveKey(
        {name:'HKDF', hash:'SHA-256', salt: salt, info: usectx},
        dk,
        {name:'AES-GCM', length: 128},
        false, // extractable? can be true for encrypt, decrypt
        ['encrypt', 'decrypt'], // usage
    );
}

function aes128(iv, ad) {
    return {name:'AES-GCM', iv: iv, additionalData: ad};
}

async function rand(bytes = 16) {
    return await crypto.getRandomValues(new Uint8Array(bytes));
}

function ctx(strctx) {
    if (!strctx) return null;
    return buf.fromStr(strctx);
}
