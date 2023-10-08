import Bun from 'bun';

// It's a very simple server that just responds with the same response all the time

export default Bun.serve({
  port: 8484,
  development: true,
  async fetch() {
    return new Response(JSON.stringify({ answer: 42 }), {
      headers: {
        'content-type': 'application/json',
      },
    });
  },
});
