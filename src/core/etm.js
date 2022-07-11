import * as cx from "../base/crypto.js";
import * as buf from "../base/buf.js";

const minExpiryMs = 30 * 60 * 60 * 1000; // 30 minutes

export {etm, mtd};

async function etm(txt, adstr, aeskey, mackey, expiryMs) {
    if (!txt || !mackey || !aeskey) {
        throw new Error("missing sign params");
    }
    if (!expiryMs || expiryMs < minExpiryMs) {
        expiryMs = minExpiryMs;
    }

    const txtbuf = buf.fromStr(txt);
    const ad = buf.fromStr(adstr);
    // though nonces are different to ivs, in our case, they double up as ivs
    // stackoverflow.com/a/24978909 and stackoverflow.com/a/8174158
    const iv = await cx.rand(16);
    const msg = await crypto.subtle.encrypt(cx.aes(iv, ad), aeskey, txtbuf);

    // ref: developers.cloudflare.com/workers/examples/signing-requests
    // no client+server nonces possible, so expiry is our next best bet to prevent infinite replays
    const expiry = Date.now() + expiryMs;
    const salt = await cx.rand(8);
    const fullbuf = buf.cat(buf.toBytes(msg), buf.fromStr(`@${expiry}@`), salt, iv);
    const mac = await crypto.subtle.sign('HMAC', mackey, fullbuf);

    const b64Mac = buf.asB64(mac);
    const b64Msg = buf.asB64(msg);
    const b64Iv = buf.asB64(iv);
    const b64Salt = buf.asB64(salt);
    const b64Ad = buf.asB64(ad);

    return [{m: b64Msg, s: b64Mac, i: b64Iv, a: b64Ad, r: b64Salt}, expiry];
}

async function mtd(b64Msg, adstr, b64Mac, b64Salt, b64Iv, aeskey, mackey, timestamp) {
  if (!b64Mac || !mackey || !aeskey || !timestamp || !b64Msg) {
      throw new Error("missing verify params");
  }

  if (Date.now() > timestamp) {
    const t = new Date(timestamp);
    const reason = `URL expired at ${t}`;
    return [null, reason];
  }

  const mac = buf.fromB64(b64Mac);
  const msg = buf.fromB64(b64Msg);
  const salt = buf.fromB64(b64Salt);
  const iv = buf.fromB64(b64Iv);
  const fullbuf = buf.cat(msg, buf.fromStr(`@${timestamp}@`), salt, iv);

  const yes = await crypto.subtle.verify('HMAC', mackey, mac, fullbuf);
  if (!yes) {
    return [null, "Invalid MAC"];
  }

  const ad = buf.fromStr(adstr);
  const txtbuf = await crypto.subtle.decrypt(cx.aes(iv, ad), aeskey, msg);
  const txt = buf.asStr(txtbuf);

  return [txt, "Valid"];
}
