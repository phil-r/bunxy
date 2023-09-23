export type ProxyOptions = {
  target: string;
  log?: boolean;
};

export const createProxy = ({ target, log }: ProxyOptions) => {
  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch (e) {
    throw new Error('Invalid target, malformed target url');
  }

  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    throw new Error(
      'Invalid target, only http and https protocals are supported',
    );
  }

  const proxy = async (req: Request) => {
    const url = new URL(req.url);
    url.hostname = targetUrl.hostname;
    url.port = targetUrl.port;
    log && console.log('Proxying to', url.toString());
    const headers = req.headers;

    headers.set('host', targetUrl.host);
    // reset origin header if it's present
    // TODO: maybe this should be configurable?
    if (headers.has('origin')) {
      headers.set('origin', targetUrl.origin);
    }

    return fetch(url, {
      method: req.method,
      headers: req.headers,
      // body: req.body, // doesn't work, ideally we'd like to just pass the body through
      body: await req.text(),
    });
  };

  log && console.log(`Proxy for target ${target} created.`);

  return proxy;
};
