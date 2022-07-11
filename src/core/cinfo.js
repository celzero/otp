
import * as req from "../base/req.js";
import * as res from "../base/res.js";

export {handle};

async function handle(req) {
    const f = req.info(req);
    return new res.json(f);
  }
  