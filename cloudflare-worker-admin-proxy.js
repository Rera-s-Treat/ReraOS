export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Set the target Vercel domain (without protocol/paths)
    const targetHost = "rera-os-admin-web-rerastreat.vercel.app";

    // Update the hostname to point to Vercel production
    url.hostname = targetHost;
    console.log(targetHost)

    // Set the protocol to HTTPS to ensure secure transport
    url.protocol = "https:";

    // Clone the request with the modified URL
    const proxyRequest = new Request(url.toString(), {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
      redirect: 'manual'
    });

    // Crucial: Update the Host header so Vercel can route the request to your service
    proxyRequest.headers.set("Host", targetHost);

    // Fetch from Vercel and return the response back to the client
    return fetch(proxyRequest);
  }
};
