const cfdefault = {
  asOrganization: "",
  asn: 0,
  colo: "",
  country: "",
}
const xfwfor = "X-Forwarded-For";
const cfcip = "CF-Connecting-IP";
const noip = "0"

async function handle(req) {
  const url = req.url;

  // developers.cloudflare.com/workers/runtime-apis/request
  const cf = getcf(req);
  const ips = getips(req);

  return respond(cf.asOrganization, cf.city, cf.country, cf.colo, ips);
}

function respond(isp, city, nation, colo, proto, ips) {
  const res = {
    isp: isp,
    ips: ips,
    addr: city + ", " + nation,
    proto: proto
    dc: colo,
  };
  const json = JSON.stringify(res);
  return new Response(json, {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  })
}

// developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties
function getcf(r) {
  if (r == null || r.cf == null) {
    return cfdefault;
  }
  return r.cf;
}

// developers.cloudflare.com/fundamentals/get-started/reference/http-request-headers
function getips(r) {
  if (r == null || r.headers == null) {
    return noip;
  }
  const h = r.headers
  if (h.has(xfwfor)) {
    // csv: "ip1,ip2,ip3" where ip1 is the client, ip2/ip3 are the proxies
    return h.get(xfwfor);
  }
  if (h.has(cfcip)) {
    return h.get(cfcip);
  }
  return noip;
}

export default {
  async fetch(req, env, ctx) {
    return handle(req);
  },
}

