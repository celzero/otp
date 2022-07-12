import * as encdec from './etm.js';
import * as cx from '../base/crypto.js';
import * as log from "../base/log.js";
import * as buf from "../base/buf.js";

export {magiclink, verify};
const info = cx.ctx("magiclink");

async function magiclink(env, txt, adstr) {
    const expiryMs = env.MAGICLINK_VALIDITY_MINS * 60 * 1000;
    const salt = await cx.rand(16);
    const aeskey = await cx.hkdfaes(env.LWE_SECRET_KEY_AES_A, info, salt);
    const mackey = await cx.hkdfhmac(env.LWE_SECRET_KEY_MAC_A, info, salt);

    const out = encdec.etm(txt, adstr, aeskey, mackey, expiryMs);
    // msg, sig, iv, salt, timestamp
    const [{m, s, i}, t] = await out;

    const r = buf.asB64(salt);
    return `m=${m}&s=${s}&i=${i}&r=${r}&t=${t}`;
}

// env, msg, sig, iv, ad, salt, timestamp
async function verify(env, msg, sig, iv, adStr, salt, ts) {
    const saltBuf = buf.fromB64(salt);
    const aeskey = await cx.hkdfaes(env.LWE_SECRET_KEY_AES_A, info, saltBuf);
    const mackey = await cx.hkdfhmac(env.LWE_SECRET_KEY_MAC_A, info, saltBuf);

    const out = encdec.mtd(msg, adStr, sig, iv, aeskey, mackey, ts);
    const [txt, reason] = await out;
    if (!txt) {
        log.w(`gen.verify err: ${reason}`);
        return null;
    }
    return txt;
}