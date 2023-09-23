import Bun from 'bun';
import { createProxy, ProxyOptions } from '..';

export default (options: ProxyOptions) => {
  const proxy = createProxy(options);

  return Bun.serve({
    port: 8080,
    fetch(req) {
      return proxy(req);
    },
  });
};
