// Copyright 2022, Celzero Pvt Ltd.
import * as buf from '../base/buf.js';
import * as log from '../base/log.js';

// adopted from: github.com/dpikalov/hotp-totp/blob/a32f28f/index.js
// SPDX-License-Identifier: MIT
// Copyright 2020 dpikalov

export {verify, get};

async function verify(key, otp, expiryMs) {
    const [expected1, expected2] = await get2(key, expiryMs);
    return expected1 === otp || expected2 === otp;
}

// time-based otp
async function get(key, expiryMs) {
    const c = Math.floor(Date.now() / expiryMs);
    return hotp(key, c);
}

async function get2(key, expiryMs) {
    const c = Math.floor(Date.now() / expiryMs);
    const one = await hotp(key, c);
    const two = await hotp(key, c - 1);
    return [one, two];
}

// hmac-based otp www.rfc-editor.org/rfc/rfc4226
async function hotp(key, counter) {
    log.d("hotp with counter:", counter);
    // HOTP(K, C) = truncate(HMAC(K, C))
    const sig = await crypto.subtle.sign('HMAC', key, msg(counter));

    const h = buf.toBytes(sig);
    const otp = truncate(h);

    // return 6 digits, padded with leading zeros
    return otp.toString().padStart(6, '0').slice(-6);
}

// Uint8Array(8)
function msg(counter) {
    const pairs = counter.toString(16).padStart(16, '0').match(/..?/g);
    const array = pairs.map(v => parseInt(v, 16));
    return buf.fromArr(array);
}

// Number
function truncate(hs) {
    const offset = hs[19] & 0b1111; // 0 to 15
    return ((hs[offset] & 0x7f) << 24) | (hs[offset + 1] << 16) | (hs[offset + 2] << 8) | hs[offset + 3];
}
