import * as log from "./base/log.js";
import * as res from "./base/res.js";
import * as req from "./base/req.js";
import * as magiclink from "./core/magic.js";
import * as info from "./core/cinfo.js"

const PATH_MAGICLINK_GEN = "ml";
const PATH_CLIENTINFO = "ci";
const PATH_MAGICLINK_VERIFY = "v";

export default {
  async fetch(request, env, ctx) {
    if (req.optionsRequest(request)) return util.res.w204();

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
        return magiclink.send(request, env, ctx);
      } else if (w === PATH_MAGICLINK_VERIFY) {
        // auth: verify a magiclink
        return magiclink.recv(request, env, ctx);
      } else if (w === PATH_CLIENTINFO) {
        // info: send client info
        return info.handle(request);
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

