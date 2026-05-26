

import server from '../dist/server/server.js';

export default async function(request) {
  return server.fetch(request, {}, {});
}
