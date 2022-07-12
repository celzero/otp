import * as m from "../assets/mailhtml.js";
import * as gen from "./gen.js";
import * as log from "../base/log.js";
import * as res from "../base/res.js";
import * as req from "../base/req.js";

const MAILCHANNEL = "https://api.mailchannels.net/tx/v1/send";
const actuallySendEmails = true; // debug: false

export {send, recv};

function validemail(id) {
    return id && id.indexOf("@") > 1 && id.indexOf(".") > 3;
  }
  
  async function recv(request, env, ctx) {
    const url = new URL(request.url);
  
    // m: msg, s: sig, i: iv, r: salt, t: timestamp
    // ad is implicitly generated from req
    const params = url.searchParams;
    const m = params.get("m");
    const s = params.get("s");
    const i = params.get("i");
    const r = params.get("r");
    const t = params.get("t");
    const adStr = req.infoStr(request);
  
    if (!m || !s || !i || !r || !t) {
      throw new Error("missing params");
    }
  
    const email = await gen.verify(env, m, s, i, adStr, r, t);
  
    if (validemail(email)) {
      log.d("verification suceeded:", email);
      return res.w302("youarein");
    } else {
      return res.w302("tryagain")
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
  
    const searchparams = await gen.magiclink(env, mailwho, req.infoStr(request));
    const additionalInfo = req.infoStrWithDate(request);
    log.d(mailwho, "gen magiclink", searchparams, "with", additionalInfo);
  
    const mailreq = new Request(MAILCHANNEL, {
      method: 'POST',
      headers: res.jsonHeaders(),
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: mailwho, name: '' }],
          },
        ],
        from: {
          email: mailfrom,
          name: namefrom,
        },
        subject: 'Your login code is...',
        content: [
          {
            type: 'text/html',
            value: m.loginemail(env, searchparams, mailwho, additionalInfo),
          },
        ],
      }),
    });

    if (actuallySendEmails && env.ACTUALLY_SEND_EMAILS) {
        const r = await fetch(mailreq);
        if (r.ok) return res.w302("signup");
        else return res.w302("tryagain");
    } else {
        return res.w302("signup");
    }
  }
