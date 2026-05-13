importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux/dist/index.js");

const bareMux = new BareMux.BareMuxClient();
let wispUrl = null; // Store wispUrl received from main thread

self.onmessage = async (event) => {
    if (event.data && event.data.type === 'SET_WISP_URL') {
        wispUrl = event.data.wispUrl;
        console.log(`bareworker.js: Received WISP URL: ${wispUrl}`);
        try {
            // Set the transport using the received wispUrl
            await bareMux.setTransport(
                "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@latest/dist/index.mjs",
                [{ wisp: wispUrl }]
            );
            console.log("bareworker.js: BareMux transport set successfully.");
        } catch (error) {
            console.error("bareworker.js: Error setting BareMux transport:", error);
        }
    }
};

// Expose bareMux client for Scramjet (if Scramjet needs to talk to it directly in worker context)
self.bareMuxClient = bareMux;

// Handle fetch events by using the BareMux client's request handler
// This part might be more complex depending on how BareMuxClient is intended to be used directly in worker
// For now, assuming Scramjet will handle the actual fetch via bareMuxClient.fetch later.
// The primary goal here is to get BareMuxClient initialized with its transport.
