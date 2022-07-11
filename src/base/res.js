export {w200, w204, w302, w404, w503, w504, w529};
export {corsHeaders, json, jsonHeaders};

function json(x) {
    return Response(JSON.stringify(x), {
        headers: jsonHeaders(),
      })
}

function jsonHeaders() {
    return {
        'content-type': 'application/json;charset=UTF-8',
    };
}
function corsHeaders() {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    };
  }
  
  function w302(redirect) {
    return new Response("Thank you", {
      status: 302, // not found
      headers: {location: redirect},
    });
  }
  
  function w404() {
    return new Response(null, {
      status: 404, // not found
      headers: corsHeaders(),
    });
  }
  
  function w503() {
    return new Response(null, {
      status: 503,
      headers: corsHeaders(),
    });
  }
  
  function w504() {
    return new Response(null, {
      status: 504,
      headers: corsHeaders(),
    });
  }
  
  function w529() {
    return new Response(null, {
      status: 529,
      headers: corsHeaders(),
    });
  }
  
  function w204() {
    return new Response(null, {
      status: 204, // no content
      headers: corsHeaders(),
    });
  }
  
  function w200() {
    return new Response("OK", {
      status: 200,
      headers: corsHeaders(),
    });
  }
