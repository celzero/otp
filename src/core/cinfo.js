import * as req from "../base/req.js";
import * as res from "../base/res.js";

export { handle };

async function handle(request) {
  const f = req.info(request);
  return res.json(f);
}
