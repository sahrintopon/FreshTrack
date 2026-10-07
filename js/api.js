/*
=================================================================
FRESHTRACK - JSONBIN REST API HELPER
API.JS
=================================================================

PURPOSE
-------
Keep the external REST API code separate from the main CRUD logic.

REAL PUBLIC REST API USED
-------------------------
JSONBin.io stores one public JSON document for this assessment.
The document contains:

{
    "foods": [ ... ]
}

FreshTrack uses:
GET  -> read the latest food inventory
PUT  -> replace the public JSON document after Create/Update/Delete

No Master Key or private API key is stored in this project.
=================================================================
*/

(function (globalObject) {
    "use strict";

    /*
    The Bin ID identifies the public FreshTrack JSON document.
    It is not a secret key.
    */
    const BIN_ID = "6ac5cba7ac6210605a1b27b7";

    const BIN_URL =
        `https://api.jsonbin.io/v3/b/${BIN_ID}`;


    /* =========================================================
       HELPER - CHECK FETCH AVAILABILITY
       ========================================================= */

    function getFetch(fetchFunction) {
        const runFetch = fetchFunction || globalObject.fetch;

        if (typeof runFetch !== "function") {
            throw new Error("Fetch is not available in this browser.");
        }

        return runFetch;
    }


    /* =========================================================
       JSONBIN - HTTP GET
       =========================================================

       PROCESS
       -------
       1. fetch() calls /latest.
       2. No method is supplied, so HTTP GET is used.
       3. await waits for the asynchronous response.
       4. response.json() converts JSON text into an object.
       5. Return only record.foods to app.js.
       ========================================================= */

    async function loadFoods(fetchFunction) {
        const runFetch = getFetch(fetchFunction);

        const response = await runFetch(
            `${BIN_URL}/latest`
        );

        if (!response.ok) {
            throw new Error(
                `JSONBin GET request failed (${response.status}).`
            );
        }

        const data = await response.json();

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
       JSONBIN - HTTP PUT
       =========================================================

       INPUT
       -----
       foods: the FreshTrack foods ARRAY.

       PROCESS
       -------
       1. Build a JavaScript object: { foods: foods }.
       2. JSON.stringify() converts it into JSON text.
       3. fetch() sends an HTTP PUT request.
       4. The public bin is updated with the latest CRUD state.
       5. The API response is converted back from JSON.

       SECURITY
       --------
       This public-bin design intentionally sends NO X-Master-Key
       and NO X-Access-Key from the browser.
       ========================================================= */

    async function saveFoods(foods, fetchFunction) {
        if (!Array.isArray(foods)) {
            throw new Error("FreshTrack foods must be an array.");
        }

        const runFetch = getFetch(fetchFunction);

        const response = await runFetch(
            BIN_URL,
            {
                method: "PUT",
                headers: {
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

        if (
            data
            && data.record
            && Array.isArray(data.record.foods)
        ) {
            return data.record.foods;
        }

        return foods;
    }


    const FreshTrackAPI = {
        BIN_ID: BIN_ID,
        loadFoods: loadFoods,
        saveFoods: saveFoods
    };


    /* Browser: app.js reads window.FreshTrackAPI. */
    globalObject.FreshTrackAPI = FreshTrackAPI;


    /* Node.js: allow the same helper to be tested automatically. */
    if (typeof module !== "undefined" && module.exports) {
        module.exports = FreshTrackAPI;
    }

})(typeof window !== "undefined" ? window : globalThis);
