export { info, infoStrWithDate, infoStr, originStr, nowstr };
export { optionsRequest, getOrPostRequest };

const xfwfor = "X-Forwarded-For";
const cfcip = "CF-Connecting-IP";
const noip = "0";
const cfdefault = {
  asOrganization: "",
  asn: 0,
  colo: "",
  country: "",
  httpProtocol: "",
};

// developers.cloudflare.com/workers/runtime-apis/request
function info(req) {
  const cf = getcf(req);
  const ips = getips(req);
  return assoc(
    cf.asOrganization,
    cf.city,
    cf.country,
    cf.colo,
    cf.httpProtocol,
    ips
  );
}

function infoStrWithDate(req) {
  return infoStr(req) + "; " + nowstr();
}

function infoStr(req) {
  const f = info(req);
  return f.ips + " (" + f.addr + ")";
}

// proto:host.tld/path?query=param#hash -> proto:host.tld
function originStr(url) {
  if (!url || !url.origin) return "";
  return url.origin;
}

function nowstr() {
  const d = new Date();
  return (
    "on " +
    d.getUTCFullYear() +
    "/" +
    d.getUTCMonth() +
    "/" +
    d.getUTCDate() +
    " at " +
    d.getUTCHours() +
    ":" +
    d.getUTCMinutes() +
    " (GMT)"
  );
}

function assoc(isp, city, nation, colo, proto, ips) {
  return {
    isp: isp,
    ips: ips,
    addr: city + ", " + nation,
    proto: proto,
    dc: colo,
  };
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
  const h = r.headers;
  if (h.has(xfwfor)) {
    // csv: "ip1,ip2,ip3" where ip1 is the client, ip2/ip3 are the proxies
    return h.get(xfwfor);
  }
  if (h.has(cfcip)) {
    return h.get(cfcip);
  }
  return noip;
}

function optionsRequest(request) {
  return request.method === "OPTIONS";
}

function getOrPostRequest(request) {
  return request.method === "GET" || request.method === "POST";
}
