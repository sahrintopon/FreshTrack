/*
=================================================================
FRESHTRACK - JSONBIN REST API HELPER
API.JS
=================================================================

STUDENT EXPLANATION
-------------------
I keep the REST API code in this file so it is separate from the
main FreshTrack CRUD code in app.js.

FreshTrack stores one JSON object in JSONBin:

{
    "foods": [ ... ]
}

I use two HTTP methods:
GET  -> load the latest food list from JSONBin.
PUT  -> save the full updated food list after Create, Update or Delete.

The bin is public for this assessment, so I do not store a Master Key
or private API key in my GitHub code.
=================================================================
*/

(function (globalObject) {
    "use strict";

    /*
    This is the ID of my public FreshTrack JSONBin record.
    It identifies the bin, but it is not a private password or key.
    */
    const BIN_ID = "6ac5cba7ac6210605a1b27b7";

    // I build the main API URL once so I can reuse it below.
    const BIN_URL =
        `https://api.jsonbin.io/v3/b/${BIN_ID}`;


    /* =========================================================
       CHECK THAT fetch() IS AVAILABLE
       =========================================================
       I normally use the browser's fetch(). The optional parameter
       also makes this helper easier to test without changing the
       real browser request code.
       ========================================================= */

    function getFetch(fetchFunction) {
        const runFetch = fetchFunction || globalObject.fetch;

        if (typeof runFetch !== "function") {
            throw new Error("Fetch is not available in this browser.");
        }

        return runFetch;
    }


    /* =========================================================
       HTTP GET - LOAD FOOD DATA
       =========================================================
       How I explain this:
       1. fetch() calls the JSONBin /latest endpoint.
       2. I do not specify a method, so fetch() uses GET.
       3. await waits for the asynchronous server response.
       4. response.json() changes the JSON response into a JS object.
       5. I return only the foods array for app.js to use.
       ========================================================= */

    async function loadFoods(fetchFunction) {
        const runFetch = getFetch(fetchFunction);

        const response = await runFetch(
            `${BIN_URL}/latest`
        );

        // A non-2xx response is treated as an API error.
        if (!response.ok) {
            throw new Error(
                `JSONBin GET request failed (${response.status}).`
            );
        }

        const data = await response.json();

        // If the expected foods array is missing, I return an empty array.
        if (
            !data
            || !data.record
            || !Array.isArray(data.record.foods)
        ) {
            return [];
        }

        return data.record.foods;
    }


    /* =========================================================
       HTTP PUT - SAVE FOOD DATA
       =========================================================
       How I explain this:
       1. app.js gives this function the current foods array.
       2. JSON.stringify() converts my JS object into JSON text.
       3. fetch() sends the request with method: "PUT".
       4. JSONBin replaces the stored document with the new version.
       5. I read the JSON response and return the saved foods array.
       ========================================================= */

    async function saveFoods(foods, fetchFunction) {
        // I validate that the value being saved is really an array.
        if (!Array.isArray(foods)) {
            throw new Error("FreshTrack foods must be an array.");
        }

        const runFetch = getFetch(fetchFunction);

        const response = await runFetch(
            BIN_URL,
            {
                method: "PUT",
                headers: {
                    // This tells JSONBin that the request body contains JSON.
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    foods: foods
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `JSONBin PUT request failed (${response.status}).`
            );
        }

        const data = await response.json();

        // If JSONBin returns the saved array, I use that returned version.
        if (
            data
            && data.record
            && Array.isArray(data.record.foods)
        ) {
            return data.record.foods;
        }

        // Fallback: keep the array that was sent if no array is returned.
        return foods;
    }


    /*
    I group the API values/functions into one object.
    app.js can then call FreshTrackAPI.loadFoods() and saveFoods().
    */
    const FreshTrackAPI = {
        BIN_ID: BIN_ID,
        loadFoods: loadFoods,
        saveFoods: saveFoods
    };


    // In the browser, app.js reads this as window.FreshTrackAPI.
    globalObject.FreshTrackAPI = FreshTrackAPI;


    // This export lets the same helper be checked with Node.js tests.
    if (typeof module !== "undefined" && module.exports) {
        module.exports = FreshTrackAPI;
    }

})(typeof window !== "undefined" ? window : globalThis);
