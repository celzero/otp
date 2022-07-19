import * as log from "./base/log.js";
import * as res from "./base/res.js";
import * as req from "./base/req.js";
import * as magiclink from "./core/magic.js";
import * as info from "./core/cinfo.js"

const PATH_MAGICLINK_GEN = "ml";
const PATH_CLIENTINFO = "ci";
const PATH_MAGICLINK_VERIFY = "v";
const PATH_MAGICCODE_VERIFY = "t";

export default {
  async fetch(request, env, ctx) {
    if (req.optionsRequest(request)) return util.res.w204();
    // apparently outlook "scans" incoming links for malicious content
    // ref: news.ycombinator.com/item?id=32081192
    if (!req.getOrPostRequest(request)) return res.w204();

    if (env.DEBUG) {
        log.relevel(log.debug);
        // btoa("b64url-test-aes-key-a") -> YjY0dXJsLXRlc3QtYWVzLWtleS1h
        env.LWE_SECRET_KEY_AES_A = env.LWE_SECRET_KEY_AES_A || "YjY0dXJsLXRlc3QtYWVzLWtleS1h";
        // btoa("mac-key-a-test-b64url") -> bWFjLWtleS1hLXRlc3QtYjY0dXJs
        env.LWE_SECRET_KEY_MAC_A = env.LWE_SECRET_KEY_MAC_A || "bWFjLWtleS1hLXRlc3QtYjY0dXJs";
    }

    // proto:hostname/path/to/file/
    const url = new URL(request.url);
    // ["", "path", "to", "file", ""]
    const path = url.pathname.split("/");
    if (path.length <= 1) {
      // treat as health-check
      return res.w200();
    }

    const w = path[1];
    try {
      if (w === PATH_MAGICLINK_GEN) {
        // auth: send a magiclink
        return await magiclink.send(request, env, ctx);
      } else if (w === PATH_MAGICLINK_VERIFY) {
        // auth: verify a magiclink
        return await magiclink.recvlink(request, env, ctx);
      } else if (w === PATH_MAGICCODE_VERIFY) {
        // auth: verify a magiccode
        return await magiclink.recvcode(request, env, ctx);
      } else if (w === PATH_CLIENTINFO) {
        // info: send client info
        return await info.handle(request);
      } else {
        // err: no such method
        return res.w404();
      }
    } catch (ex) {
      log.e(request.url, ex)
      return res.w529();
    }
  }
}

