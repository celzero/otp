import * as encdec from "./etm.js";
import * as cx from "../base/crypto.js";
import * as log from "../base/log.js";
import * as buf from "../base/buf.js";
import * as totp from "./totp.js";

export { magiclink, verifylink, verifycode };

async function magiclink(env, orig, txt, adstr) {
  const expiryMs = env.MAGICLINK_VALIDITY_MINS * 60 * 1000;
  const salt = await cx.rand(16);
  const info = magctx(orig);
  // otp is independent of associated-data, adStr (which is ip-addr)
  // but depdendent on a user-specific id, like email (txt) in this cast
  const otpinfo = otpctx(orig, txt);

  const aeskey = await cx.hkdfaes(skaes(env), info, salt);
  const mackey = await cx.hkdfhmac(skmac(env), info, salt);
  const otpkey = await cx.hkdfhotp(skmac(env), otpinfo, salt);

  const out1 = totp.get(otpkey, expiryMs);
  const out2 = encdec.etm(txt, adstr, aeskey, mackey, expiryMs);

  // time-based one-time password
  const otp = await out1;
  // msg, sig, iv, salt, timestamp
  const [{ m, s, i }, t] = await out2;

  log.d("gen: magiclink/magiccode done");

  const r = buf.asB64(salt); // rainbow
  // link and code
  return [`m=${m}&s=${s}&i=${i}&r=${r}&t=${t}`, otp];
}

// env, origin, msg, sig, iv, ad, salt, timestamp
async function verifylink(env, orig, msg, sig, iv, adStr, salt, ts) {
  const info = magctx(orig);
  const saltBuf = buf.fromB64(salt);

  const aeskey = await cx.hkdfaes(skaes(env), info, saltBuf);
  const mackey = await cx.hkdfhmac(skmac(env), info, saltBuf);

  const out = encdec.mtd(msg, adStr, sig, iv, aeskey, mackey, ts);
  const [txt, reason] = await out;
  if (!txt) {
    log.w(`gen.verify err: ${reason}`);
    return null;
  }

  log.d("gen: verifylink done");

  return txt;
}

async function verifycode(env, orig, txt, otp, salt) {
  const expiryMs = env.MAGICLINK_VALIDITY_MINS * 60 * 1000;
  const saltBuf = buf.fromB64(salt);
  const otpinfo = otpctx(orig, txt);

  const otpkey = await cx.hkdfhotp(skmac(env), otpinfo, saltBuf);

  log.d("gen: verifycode done");

  return totp.verify(otpkey, otp, expiryMs);
}

function otpctx(origin, txt) {
  return buf.fromStr(origin + ":totp:" + txt);
}

function magctx(origin) {
  return cx.ctx(origin + ":magiclink");
}

function skaes(env) {
  return buf.fromB64(env.LWE_SECRET_KEY_AES_A);
}

function skmac(env) {
  return buf.fromB64(env.LWE_SECRET_KEY_MAC_A);
}
