type ReqModResult = {
  url?: URL;
  headers?: Headers;
  body?: string;
  method?: string;
};
export type ReqMod = (
  req: Request,
  body: string,
) => Promise<ReqModResult> | ReqModResult;

type ResModResult = Response | Promise<Response>;
export type ResMod = (res: Response) => ResModResult;

export type ProxyOptions = {
  target: string;
  log?: boolean;
  reqMod?: ReqMod;
  resMod?: ResMod;
  updateOrigin?: boolean;
  verboseFetch?: boolean;
};

export const createProxy = ({
  target,
  log,
  reqMod,
  resMod,
  updateOrigin = true,
  verboseFetch = false,
}: ProxyOptions) => {
  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch (e) {
    throw new Error('Invalid target, malformed target url');
  }

  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    throw new Error(
      'Invalid target, only http and https protocols are supported',
    );
  }

  const proxy = async (req: Request) => {
    let url = new URL(req.url);
    url.hostname = targetUrl.hostname;
    url.port = targetUrl.port;
    log && console.log('Proxying to', url.toString());
    let headers = req.headers;

    headers.set('host', targetUrl.host);
    // reset origin header if it's present. Helpful to prevent CORS issues.
    // Can be disabled with updateOrigin: false and updated with reqMod if more fine-grained control is needed.
    if (headers.has('origin') && updateOrigin) {
      headers.set('origin', targetUrl.origin);
    }

    let method = req.method;
    let body = await req.text();

    if (reqMod) {
      const {
        url: modURL,
        headers: modHeaders,
        body: modBody,
        method: modMethod,
      } = await reqMod(req, body);
      if (modURL) {
        url = modURL;
      }
      if (modHeaders) {
        headers = modHeaders;
      }
      if (modBody) {
        body = modBody;
      }
      if (modMethod) {
        method = modMethod;
      }
    }

    const result = await fetch(url, {
      method,
      headers,
      // body: req.body, // doesn't work(as of bun v1.0.4), ideally we'd like to just pass the body through
      body,
      verbose: verboseFetch,
    });

    if (resMod) {
      return resMod(result);
    }

    return result;
  };

  log && console.log(`Proxy for target ${target} created.`);

  return proxy;
};
