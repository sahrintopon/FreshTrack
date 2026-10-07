/*
=================================================================
FRESHTRACK - REAL REST API HELPERS
API.JS
=================================================================

PURPOSE
-------
Keep the external REST API code separate from the main CRUD logic.

REAL PUBLIC APIs USED
---------------------
1. Open Food Facts
   GET a real food product by barcode.

2. ntfy
   POST a real expiry reminder message.

This file uses only Vanilla JavaScript and fetch().
=================================================================
*/

(function (globalObject) {
    "use strict";

    const OPEN_FOOD_FACTS_URL =
        "https://world.openfoodfacts.org/api/v3/product";

    const NTFY_TOPIC_URL =
        "https://ntfy.sh/freshtrack-bells-demo-7f3c9a2e";


    /* =========================================================
       MAP OPEN FOOD FACTS CATEGORY -> FRESHTRACK CATEGORY
       =========================================================
       Open Food Facts can return many detailed category names.
       FreshTrack uses a smaller category list, so this function
       maps the API text into one of the application's categories.
       ========================================================= */

    function mapCategory(categories) {
        const value = String(categories || "").toLowerCase();

        if (/beverage|drink|juice|water|soda|coffee|tea/.test(value)) {
            return "Drinks";
        }

        if (/milk|dairy|cheese|yogurt/.test(value)) {
            return "Dairy";
        }

        if (/vegetable/.test(value)) {
            return "Vegetables";
        }

        if (/fruit/.test(value)) {
            return "Fruit";
        }

        if (/meat|beef|chicken|poultry|fish|seafood/.test(value)) {
            return "Meat";
        }

        if (/bread|bakery|pastry|cake/.test(value)) {
            return "Bakery";
        }

        if (/frozen/.test(value)) {
            return "Frozen";
        }

        return "Others";
    }


    /* =========================================================
       OPEN FOOD FACTS - HTTP GET
       =========================================================
       INPUT:
       A barcode such as 3017624010701.

       PROCESS:
       1. Build the REST endpoint URL.
       2. fetch() sends a GET request because no method is supplied.
       3. await waits for the asynchronous response.
       4. response.json() converts JSON into a JavaScript object.
       5. Return only the fields FreshTrack needs.
       ========================================================= */

    async function lookupProduct(barcode, fetchFunction) {
        const code = String(barcode || "").trim();

        if (code === "") {
            throw new Error("Enter a product barcode or code first.");
        }

        const runFetch = fetchFunction || globalObject.fetch;

        if (typeof runFetch !== "function") {
            throw new Error("Fetch is not available in this browser.");
        }

        const fields = "product_name,brands,categories";

        const url =
            `${OPEN_FOOD_FACTS_URL}/${encodeURIComponent(code)}`
            + `?fields=${fields}`;

        const response = await runFetch(url);

        if (!response.ok) {
            throw new Error("Open Food Facts GET request failed.");
        }

        const data = await response.json();

        if (!data.product) {
            throw new Error("No Open Food Facts product was found for this barcode.");
        }

        const product = data.product;

        return {
            code: code,
            name: product.product_name || "",
            brand: product.brands || "",
            categories: product.categories || "",
            category: mapCategory(product.categories)
        };
    }


    /* =========================================================
       NTFY - HTTP POST
       =========================================================
       ntfy accepts a plain-text HTTP POST body.

       FreshTrack sends only generic food reminder information.
       No name, email, address or other personal data is sent.
       ========================================================= */

    async function sendReminder(food, fetchFunction) {
        if (!food || !food.name || !food.expiryDate) {
            throw new Error("Food name and expiry date are required.");
        }

        const runFetch = fetchFunction || globalObject.fetch;

        if (typeof runFetch !== "function") {
            throw new Error("Fetch is not available in this browser.");
        }

        const message =
            `FreshTrack reminder: ${food.name} expires on ${food.expiryDate}.`;

        const response = await runFetch(
            NTFY_TOPIC_URL,
            {
                method: "POST",
                body: message
            }
        );

        if (!response.ok) {
            throw new Error("ntfy POST request failed.");
        }

        return response.json();
    }


    /*
    One object groups the API functions together.
    app.js uses FreshTrackAPI.lookupProduct() and
    FreshTrackAPI.sendReminder().
    */
    const FreshTrackAPI = {
        lookupProduct: lookupProduct,
        sendReminder: sendReminder,
        mapCategory: mapCategory
    };


    /* Browser: make the helper object available to app.js. */
    globalObject.FreshTrackAPI = FreshTrackAPI;


    /* Node.js: export the same object so automated tests can run. */
    if (typeof module !== "undefined" && module.exports) {
        module.exports = FreshTrackAPI;
    }

})(typeof window !== "undefined" ? window : globalThis);
