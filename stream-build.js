(() => {
  'use strict';
  const files = {"stage.pck":{"size":45543256,"type":"application/octet-stream","chunks":["stage.pck.1.bin","stage.pck.2.bin","stage.pck.3.bin","stage.pck.4.bin","stage.pck.5.bin","stage.pck.6.bin"]},"stage.wasm":{"size":39514754,"type":"application/wasm","chunks":["stage.wasm.1.bin","stage.wasm.2.bin"]}};
  const base = new URL('.', location.href);
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function (request, options) {
    const url = new URL(typeof request === 'string' || request instanceof URL ? request : request.url, location.href);
    const name = url.pathname.slice(base.pathname.length);
    const info = url.origin === base.origin && url.pathname.startsWith(base.pathname) ? files[name] : null;
    if (!info) return nativeFetch(request, options);
    if (typeof DecompressionStream !== 'function') {
      return Promise.reject(new Error('Please open the game in a current version of Safari, Chrome, Firefox or Edge.'));
    }
    let reader = null;
    let next = 0;
    const packed = new ReadableStream({
      async pull(controller) {
        while (!reader) {
          if (next >= info.chunks.length) { controller.close(); return; }
          const part = await nativeFetch(new URL(info.chunks[next++], base), { signal: options?.signal });
          if (!part.ok) throw new Error('A game file did not load. Refresh to try again.');
          reader = part.body.getReader();
        }
        const piece = await reader.read();
        if (piece.done) { reader.releaseLock(); reader = null; return; }
        controller.enqueue(piece.value);
      },
      async cancel(reason) { if (reader) await reader.cancel(reason); }
    });
    return Promise.resolve(new Response(packed.pipeThrough(new DecompressionStream('gzip')), {
      headers: { 'Content-Type': info.type, 'Content-Length': String(info.size) }
    }));
  };
})();