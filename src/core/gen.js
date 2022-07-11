import * as encdec from './etm.js';
import * as cx from '../base/crypto.js';
import * as log from "../base/log.js";

export {magiclink, verify};
const info = cx.ctx("magiclink");

async function magiclink(env, txt, adstr, expiry) {
    // const salt = await cx.rand(16);
    const aeskey = await cx.hkdfaes(env, info);
    const mackey = await cx.hkdfhmac(env, info);

    const out = encdec.etm(txt, adstr, aeskey, mackey, expiry);
    // msg, sig, iv, ad, salt, timestamp
    const [{m, s, i, a, r}, t] = await out;

    return `m=${m}&s=${s}&i=${i}&r=${r}&t=${t}`;
}

// env, msg, sig, iv, ad, salt, timestamp
async function verify(env, msg, sig, iv, adStr, salt, ts) {
    const aeskey = await cx.hkdfaes(env, info);
    const mackey = await cx.hkdfhmac(env, info);

    const out = encdec.mtd(msg, adStr, sig, salt, iv, aeskey, mackey, ts);
    const [txt, reason] = await out;
    if (!txt) {
        log.w(`gen.verify err: ${reason}`);
        return null;
    }
    return txt;
}