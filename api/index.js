
import server from '../dist/server/index.js';

export default async function(req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const url = new URL(req.url, `${protocol}://${req.headers.host}`);
    
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else if (value) {
        headers.set(key, value);
      }
    }
    
    const init = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = new ReadableStream({
        start(controller) {
          req.on('data', chunk => controller.enqueue(chunk));
          req.on('end', () => controller.close());
          req.on('error', err => controller.error(err));
        }
      });
      init.duplex = 'half';
    }
    
    const request = new Request(url.href, init);
    const response = await server.fetch(request, process.env, {});
    
    res.statusCode = response.status;
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch(e) {
    console.error(e);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}
