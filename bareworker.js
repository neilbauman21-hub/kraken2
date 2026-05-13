// Aggressive IndexedDB Cleanup for dedicated worker
(async function cleanupIndexedDB() {
    try {
        const dbNames = await indexedDB.databases();
        for (const dbInfo of dbNames) {
            if (dbInfo.name.startsWith('scramjet') || dbInfo.name.startsWith('BareMux') || dbInfo.name.startsWith('ScramjetData') || dbInfo.name.startsWith('__bare')) {
                console.warn(`bareworker.js: Attempting to delete IndexedDB: ${dbInfo.name}`);
                await new Promise((resolve, reject) => {
                    const req = indexedDB.deleteDatabase(dbInfo.name);
                    req.onsuccess = () => resolve();
                    req.onerror = (event) => reject(event.target.error);
                });
            }
        }
        console.log("bareworker.js: Aggressive IndexedDB cleanup completed.");
    } catch (e) {
        console.error("bareworker.js: Error during aggressive IndexedDB cleanup:", e);
    }
})();

importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@latest/dist/index.js");

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
