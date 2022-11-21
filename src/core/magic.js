import * as m from "../assets/mailhtml.js";
import * as gen from "./gen.js";
import * as log from "../base/log.js";
import * as res from "../base/res.js";
import * as req from "../base/req.js";
import * as buf from "../base/buf.js";

const MAILCHANNELS = "https://api.mailchannels.net/tx/v1/send";

export {send, recvlink, recvcode};

function validemail(id) {
    return id && id.indexOf("@") > 1 && id.indexOf(".") > 3;
}

async function recvcode(request, env, ctx) {
  const url = new URL(request.url);

  // m: msg, s: sig, i: iv, r: salt, t: timestamp
  // ad is implicitly generated from req
  const params = url.searchParams;
  const code = params.get("c");
  const salt = params.get("r");
  const email = params.get("e");
  const origin = req.originStr(url);

  if (!code || !salt || !email) {
    throw new Error("missing params");
  }

  const ok = await gen.verifycode(env, origin, email, code, salt);

  if (ok) {
    log.d("otp verification suceeded:", email);
    return res.w302("youareinotp");
  } else {
    return res.w302("tryagainotp")
  }
}

  async function recvlink(request, env, ctx) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!token) {
      throw new Error("missing token");
    }

    // m: msg, s: sig, i: iv, r: salt, t: timestamp
    // ad is implicitly generated from req
    const params = tokenToParams(token);
    const m = params.get("m");
    const s = params.get("s");
    const i = params.get("i");
    const r = params.get("r");
    const t = params.get("t");
    const adStr = req.infoStr(request);
    const origin = req.originStr(url);

    if (!m || !s || !i || !r || !t) {
      throw new Error("missing params");
    }

    const email = await gen.verifylink(env, origin, m, s, i, adStr, r, t);

    if (validemail(email)) {
      log.d("link verification suceeded:", email);
      return res.w302("youareinlink");
    } else {
      return res.w302("tryagainlink")
    }

  }

  async function send(request, env, ctx) {
    const url = new URL(request.url);

    const path = url.pathname.split("/");
    if (path.length <= 2) {
      return res.w503();
    }

    const mailwho = path[2];
    if (!validemail(mailwho)) {
      return res.w504();
    }
    // ex: "Jon Snow <king@north.tld>"
    const sender = env.SENDER.split("<");
    // "Jon Snow " => "Jon Snow"
    const namefrom = sender[0].trim();
    // "king@north.tld>" => "king@north.tld"
    const mailfrom = sender[1].slice(0, -1);
    if (!validemail(mailfrom)) {
        return res.w504();
    }

    const adStr = req.infoStr(request);
    const origin = req.originStr(url);

    const [searchparams, otp] = await gen.magiclink(env, origin, mailwho, adStr);
    const additionalInfo = req.infoStrWithDate(request);
    const token = "token=" + paramsToToken(searchparams);

    log.d(mailwho, "mc", otp, "ml", searchparams, "with", additionalInfo, "as", token);

    const mailreq = new Request(MAILCHANNELS, {
      method: 'POST',
      headers: res.jsonHeaders(),
      body: JSON.stringify({
        personalizations: [mailto(env, mailwho, mailfrom)],
        from: {
          email: mailfrom,
          name: namefrom,
        },
        subject: `Your login code is ${otp}`,
        content: [
          {
            type: 'text/html',
            value: m.loginemail(env, token, otp, mailwho, additionalInfo),
          },
        ],
      }),
    });

    if (env.ACTUALLY_SEND_EMAILS) {
        // redirect with a link with salt to validate magiccode
        const r = await fetch(mailreq);
        if (r.ok) return res.w302("signup");
        else return res.w302("tryagain");
    } else {
        return res.w302("signup");
    }
  }

  function mailto(env, toaddr, fromaddr) {
    const pk = dkimPk(env);
    // mailchannels.zendesk.com/hc/en-us/articles/7122849237389
    return pk != null
      ? {
          to: [{ email: toaddr, name: '' }],
          dkim_domain: hostname(fromaddr),
          dkim_selector: dkimSelector(env),
          dkim_private_key: pk,
        }
      : {
        to: [{ email: toaddr, name: '' }],
        };
  }

  function dkimPk(env) {
    return env.DKIM_PK_MC_RDNS || null;
  }

  function dkimSelector(env) {
    return env.DKIM_SELECTOR || "mc";
  }

  // extract hostname from email address
  function hostname(emailId) {
    const parts = emailId.split("@");
    if (parts.length < 2) {
      throw new Error("invalid email id");
    }
    return parts[1];
  }

  function paramsToToken(p) {
    const t = buf.asB64(buf.fromStr(p));
    return t;
  }

  function tokenToParams(t) {
    const p = buf.asStr(buf.fromB64(t));
    return new URLSearchParams(p);
  }
