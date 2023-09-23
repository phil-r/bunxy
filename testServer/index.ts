import Bun from 'bun';

// It's a very simple server that just responds with the request body, headers, etc.
// It can be tested with curl:
// curl -X POST -d '{"foo":"bar"}' -H "Content-Type: application/json" http://localhost:9090 | jq

export default Bun.serve({
  port: 9090,
  development: true,
  async fetch(req) {
    // TODO: better type for response
    const response: any = {};
    response.method = req.method;
    response.url = req.url;
    response.body = await req.text();
    response.headers = req.headers;

    return new Response(JSON.stringify(response), {
      headers: {
        'content-type': 'application/json',
      },
    });
  },
});
