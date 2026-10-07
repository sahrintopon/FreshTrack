/*
=================================================================
FRESHTRACK - FOOD EXPIRY TRACKER
APP.JS
=================================================================

PURPOSE
-------
This file contains the main JavaScript logic for FreshTrack.

PROGRAM FLOW
------------
1. Select HTML elements using querySelector().
2. GET the current food records from the public JSONBin REST API.
3. Store the records in the foods ARRAY.
4. Each food record is stored as an OBJECT.
5. Calculate whether each item is Fresh, Expiring Soon or Expired.
6. Display food cards dynamically in the DOM.
7. Support full CRUD: Create, Read, Update and Delete.
8. Search by Food Name OR Product Code.
9. Prevent duplicate Product Codes.
10. PUT the updated foods array back to JSONBin after CRUD changes.

ASSESSMENT CONCEPT MAP
----------------------
ARRAY                -> foods
OBJECT               -> each food record
LOOPS                -> forEach()
BRANCHING             -> if / else if / else
COMPARISON            -> <, <=, ===, !==
LOGICAL OPERATORS     -> && and ||
CUSTOM FUNCTIONS      -> calculateStatus(), displayFoods(), etc.
DOM SELECTION         -> querySelector(), querySelectorAll()
DOM MANIPULATION      -> textContent, innerHTML, classList, appendChild()
EVENTS                -> submit, click, input
CRUD                  -> Add, Display, Edit, Delete
JSON                  -> JSON.stringify(), response.json()
ASYNC                 -> async / await
AJAX / REST API       -> fetch() through FreshTrackAPI
HTTP GET              -> Load the latest FreshTrack inventory
HTTP PUT              -> Save Create / Update / Delete changes

IMPORTANT STRUCTURED PROGRAMMING EXAMPLE
----------------------------------------
buildMessage() RETURNS a value that is used as an argument
inside another function:

showToast(
    buildMessage(...)
);
=================================================================
*/


/* =============================================================
   SECTION 1 - SELECT HTML ELEMENTS
   ============================================================= */

const foodForm = document.querySelector("#food-form");
const productCode = document.querySelector("#product-code");
const foodName = document.querySelector("#food-name");
const foodCategory = document.querySelector("#food-category");
const foodQuantity = document.querySelector("#food-quantity");
const foodExpiry = document.querySelector("#food-expiry");
const foodStorage = document.querySelector("#food-storage");
const foodNotes = document.querySelector("#food-notes");

const foodGrid = document.querySelector("#food-grid");
const emptyMessage = document.querySelector("#empty-message");

const totalCount = document.querySelector("#total-count");
const freshCount = document.querySelector("#fresh-count");
const expiringCount = document.querySelector("#expiring-count");
const expiredCount = document.querySelector("#expired-count");

const formTitle = document.querySelector("#form-title");
const saveButton = document.querySelector("#save-button");
const cancelButton = document.querySelector("#cancel-button");

const searchInput = document.querySelector("#search-input");
const filterButtons = document.querySelectorAll(".filter-button");

const topAddButton = document.querySelector("#top-add-button");
const heroAddButton = document.querySelector("#hero-add-button");

const refreshApiButton = document.querySelector("#refresh-api-button");
const apiResult = document.querySelector("#api-result");
const toast = document.querySelector("#toast");


/* =============================================================
   SECTION 2 - APPLICATION STATE
   =============================================================

   foods
   -----
   An ARRAY containing food OBJECTS.

   Example object:
   {
       id: 123456,
       productCode: "BEEF001",
       name: "Beef",
       category: "Meat",
       quantity: 2,
       expiryDate: "2026-10-10",
       storage: "Freezer",
       notes: "For dinner"
   }

   editingId
   ---------
   null means CREATE mode.
   An existing ID means UPDATE mode.

   selectedFilter
   --------------
   Stores the currently selected status filter.
   ============================================================= */

let foods = [];
let editingId = null;
let selectedFilter = "All";


/* =============================================================
   SECTION 3 - REST API LOAD / SAVE HELPERS
   =============================================================

   FreshTrackAPI is defined in api.js.

   GET:
   loadFoodsFromAPI() retrieves the latest JSONBin record.

   PUT:
   saveFoodsToAPI() replaces the JSONBin record with the current
   foods array after Create, Update or Delete.
   ============================================================= */

async function loadFoodsFromAPI() {
    apiResult.textContent =
        "GET in progress: loading inventory from JSONBin...";

    try {
        foods = await FreshTrackAPI.loadFoods();

        apiResult.textContent =
            `GET successful: loaded ${foods.length} food item(s) from JSONBin.`;

        displayFoods();
        return true;
    }

    catch (error) {
        apiResult.textContent =
            `GET failed: ${error.message}`;

        showToast("Could not load FreshTrack data from JSONBin.");
        displayFoods();
        return false;
    }
}


async function saveFoodsToAPI(actionName) {
    apiResult.textContent =
        `PUT in progress: saving ${actionName} to JSONBin...`;

    try {
        foods = await FreshTrackAPI.saveFoods(foods);

        apiResult.textContent =
            `PUT successful: ${actionName} saved to JSONBin.`;

        return true;
    }

    catch (error) {
        apiResult.textContent =
            `PUT failed: ${error.message}`;

        return false;
    }
}


/* =============================================================
   SECTION 4 - PRODUCT CODE NORMALISATION
   ============================================================= */

function normalizeProductCode(code) {
    return code.trim().toUpperCase();
}


/* =============================================================
   SECTION 5 - CHECK FOR DUPLICATE PRODUCT CODE
   =============================================================

   some() checks whether at least one food object already uses
   the same Product Code.

   When editing, food.id !== editingId allows the record to keep
   its own code.
   ============================================================= */

function isDuplicateProductCode(code) {
    const normalizedCode = normalizeProductCode(code);

    return foods.some(function (food) {
        const existingCode = normalizeProductCode(
            food.productCode || ""
        );

        return (
            existingCode === normalizedCode
            &&
            food.id !== editingId
        );
    });
}


/* =============================================================
   SECTION 6 - CALCULATE EXPIRY STATUS
   ============================================================= */

function calculateStatus(expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate + "T00:00:00");
    expiry.setHours(0, 0, 0, 0);

    const difference = expiry.getTime() - today.getTime();

    const daysLeft = Math.ceil(
        difference / (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) {
        return {
            status: "Expired",
            daysLeft: daysLeft
        };
    }

    else if (daysLeft <= 3) {
        return {
            status: "Expiring Soon",
            daysLeft: daysLeft
        };
    }

    else {
        return {
            status: "Fresh",
            daysLeft: daysLeft
        };
    }
}


/* =============================================================
   SECTION 7 - RETURN CSS CLASS FOR STATUS
   ============================================================= */

function getStatusClass(status) {
    if (status === "Fresh") {
        return "status-fresh";
    }

    else if (status === "Expiring Soon") {
        return "status-warning";
    }

    else {
        return "status-expired";
    }
}


/* =============================================================
   SECTION 8 - SELECT IMAGE BY FOOD CATEGORY
   ============================================================= */

function getFoodImage(category) {
    if (category === "Fruit") {
        return "images/apple.jpg";
    }

    else if (category === "Vegetables") {
        return "images/vegetables.jpg";
    }

    else if (category === "Dairy") {
        return "images/milk.jpg";
    }

    else if (category === "Meat") {
        return "images/meat.jpg";
    }

    else if (category === "Bakery") {
        return "images/bread.jpg";
    }

    else if (category === "Frozen") {
        return "images/frozen.jpg";
    }

    else if (category === "Drinks") {
        return "images/drinks.jpg";
    }

    else {
        return "images/others.jpg";
    }
}


/* =============================================================
   SECTION 9 - FORMAT DATE
   ============================================================= */

function formatDate(dateValue) {
    const date = new Date(dateValue + "T00:00:00");

    return date.toLocaleDateString(
        "en-SG",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


/* =============================================================
   SECTION 10 - CREATE EXPIRY MESSAGE
   ============================================================= */

function getExpiryMessage(daysLeft) {
    if (daysLeft < 0) {
        return `${Math.abs(daysLeft)} day(s) overdue`;
    }

    else if (daysLeft === 0) {
        return "Expires today";
    }

    else if (daysLeft === 1) {
        return "1 day remaining";
    }

    else {
        return `${daysLeft} days remaining`;
    }
}


/* =============================================================
   SECTION 11 - DISPLAY FOOD (READ IN CRUD)
   ============================================================= */

function displayFoods() {
    foodGrid.innerHTML = "";

    const searchText = searchInput
        .value
        .toLowerCase()
        .trim();

    const visibleFoods = foods.filter(function (food) {
        const foodStatus = calculateStatus(food.expiryDate);

        const nameMatches = food.name
            .toLowerCase()
            .includes(searchText);

        const codeMatches = (food.productCode || "")
            .toLowerCase()
            .includes(searchText);

        const matchesSearch = nameMatches || codeMatches;

        const matchesFilter = (
            selectedFilter === "All"
            ||
            foodStatus.status === selectedFilter
        );

        return matchesSearch && matchesFilter;
    });

    if (visibleFoods.length === 0) {
        emptyMessage.classList.remove("hidden");
    }

    else {
        emptyMessage.classList.add("hidden");
    }

    visibleFoods.forEach(function (food) {
        const foodStatus = calculateStatus(food.expiryDate);

        const card = document.createElement("article");
        card.className = "food-card";

        card.innerHTML = `
            <img
                class="food-card-image"
                src="${getFoodImage(food.category)}"
                alt="${food.name}"
            >

            <div class="food-card-content">
                <div class="food-card-header">
                    <div>
                        <h3>${food.name}</h3>
                        <p class="food-category">${food.category}</p>
                        <p class="food-category">
                            Code: ${food.productCode || "Not assigned"}
                        </p>
                    </div>

                    <span class="status ${getStatusClass(foodStatus.status)}">
                        ${foodStatus.status}
                    </span>
                </div>

                <div class="food-detail">
                    <span>Expiry</span>
                    <strong>${formatDate(food.expiryDate)}</strong>
                </div>

                <div class="food-detail">
                    <span>Remaining</span>
                    <strong>${getExpiryMessage(foodStatus.daysLeft)}</strong>
                </div>

                <div class="food-detail">
                    <span>Quantity</span>
                    <strong>${food.quantity}</strong>
                </div>

                <div class="food-detail">
                    <span>Storage</span>
                    <strong>${food.storage}</strong>
                </div>

                ${
                    food.notes
                    ? `<div class="food-notes">📝 ${food.notes}</div>`
                    : ""
                }
            </div>

            <div class="card-actions">
                <button
                    class="edit-button"
                    data-id="${food.id}"
                    type="button"
                >
                    ✏ Edit
                </button>

                <button
                    class="delete-button"
                    data-id="${food.id}"
                    type="button"
                >
                    🗑 Delete
                </button>
            </div>
        `;

        foodGrid.appendChild(card);
    });

    updateStatistics();
}


/* =============================================================
   SECTION 12 - UPDATE DASHBOARD STATISTICS
   ============================================================= */

function updateStatistics() {
    let fresh = 0;
    let expiring = 0;
    let expired = 0;

    foods.forEach(function (food) {
        const status = calculateStatus(food.expiryDate);

        if (status.status === "Fresh") {
            fresh++;
        }

        else if (status.status === "Expiring Soon") {
            expiring++;
        }

        else {
            expired++;
        }
    });

    totalCount.textContent = foods.length;
    freshCount.textContent = fresh;
    expiringCount.textContent = expiring;
    expiredCount.textContent = expired;
}


/* =============================================================
   SECTION 13 - CREATE / UPDATE FOOD
   =============================================================

   The form uses one SUBMIT event for two CRUD operations.

   CREATE:
   editingId === null

   UPDATE:
   editingId contains an existing food ID.

   After the array changes, FreshTrack sends a real HTTP PUT to
   JSONBin. If the PUT fails, the previous array is restored.
   ============================================================= */

foodForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const normalizedCode = normalizeProductCode(
        productCode.value
    );

    if (isDuplicateProductCode(normalizedCode)) {
        showToast(
            `Product Code ${normalizedCode} is already in use.`
        );

        productCode.focus();
        return;
    }

    const foodData = {
        productCode: normalizedCode,
        name: foodName.value.trim(),
        category: foodCategory.value,
        quantity: Number(foodQuantity.value),
        expiryDate: foodExpiry.value,
        storage: foodStorage.value,
        notes: foodNotes.value.trim()
    };

    const previousFoods = foods.map(function (food) {
        return { ...food };
    });

    let actionWord = "";
    let apiAction = "";

    /* ------------------------- CREATE ------------------------- */
    if (editingId === null) {
        foodData.id = Date.now();
        foods.push(foodData);
        actionWord = "added";
        apiAction = `CREATE of ${foodData.name}`;
    }

    /* ------------------------- UPDATE ------------------------- */
    else {
        const index = foods.findIndex(function (food) {
            return food.id === editingId;
        });

        if (index === -1) {
            showToast("The selected food item could not be found.");
            return;
        }

        foods[index] = {
            id: editingId,
            ...foodData
        };

        actionWord = "updated";
        apiAction = `UPDATE of ${foodData.name}`;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    const saved = await saveFoodsToAPI(apiAction);

    saveButton.disabled = false;

    if (!saved) {
        foods = previousFoods;
        displayFoods();

        saveButton.textContent =
            editingId === null ? "Add Item" : "Save Changes";

        showToast("Changes were not saved because the API request failed.");
        return;
    }

    showToast(
        buildMessage(
            foodData.name,
            actionWord
        )
    );

    resetForm();
    displayFoods();
});


/* =============================================================
   SECTION 14 - RETURN VALUE USED AS ANOTHER FUNCTION ARGUMENT
   ============================================================= */

function buildMessage(foodNameValue, action) {
    return `${foodNameValue} was successfully ${action}.`;
}


/* =============================================================
   SECTION 15 - TOAST NOTIFICATION
   ============================================================= */

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(function () {
        toast.classList.remove("show");
    }, 2500);
}


/* =============================================================
   SECTION 16 - EDIT / DELETE EVENT DELEGATION
   ============================================================= */

foodGrid.addEventListener("click", function (event) {
    if (event.target.classList.contains("edit-button")) {
        const id = Number(event.target.dataset.id);
        startEditing(id);
    }

    if (event.target.classList.contains("delete-button")) {
        const id = Number(event.target.dataset.id);
        deleteFood(id);
    }
});


/* =============================================================
   SECTION 17 - START EDITING (UPDATE IN CRUD)
   ============================================================= */

function startEditing(id) {
    const food = foods.find(function (foodItem) {
        return foodItem.id === id;
    });

    if (!food) {
        return;
    }

    editingId = id;

    productCode.value = food.productCode || "";
    foodName.value = food.name;
    foodCategory.value = food.category;
    foodQuantity.value = food.quantity;
    foodExpiry.value = food.expiryDate;
    foodStorage.value = food.storage;
    foodNotes.value = food.notes || "";

    formTitle.textContent = "Edit Food Item";
    saveButton.textContent = "Save Changes";
    cancelButton.classList.remove("hidden");

    document
        .querySelector("#food-form-section")
        .scrollIntoView({
            behavior: "smooth"
        });
}


/* =============================================================
   SECTION 18 - DELETE FOOD (DELETE IN CRUD)
   =============================================================

   filter() creates a new foods array without the selected object.
   Then a real JSONBin PUT saves the new array remotely.
   ============================================================= */

async function deleteFood(id) {
    const selectedFood = foods.find(function (food) {
        return food.id === id;
    });

    if (!selectedFood) {
        return;
    }

    const confirmed = confirm(
        `Delete ${selectedFood.name}?`
    );

    if (!confirmed) {
        return;
    }

    const previousFoods = foods.map(function (food) {
        return { ...food };
    });

    foods = foods.filter(function (food) {
        return food.id !== id;
    });

    const saved = await saveFoodsToAPI(
        `DELETE of ${selectedFood.name}`
    );

    if (!saved) {
        foods = previousFoods;
        displayFoods();
        showToast("Delete was cancelled because the API request failed.");
        return;
    }

    displayFoods();

    showToast(
        buildMessage(
            selectedFood.name,
            "deleted"
        )
    );
}


/* =============================================================
   SECTION 19 - RESET FORM
   ============================================================= */

function resetForm() {
    foodForm.reset();

    foodQuantity.value = 1;
    editingId = null;

    formTitle.textContent = "Add Food Item";
    saveButton.textContent = "Add Item";
    cancelButton.classList.add("hidden");
}


/* =============================================================
   SECTION 20 - CANCEL EDIT EVENT
   ============================================================= */

cancelButton.addEventListener("click", function () {
    resetForm();
});


/* =============================================================
   SECTION 21 - SEARCH EVENT
   ============================================================= */

searchInput.addEventListener("input", function () {
    displayFoods();
});


/* =============================================================
   SECTION 22 - FILTER BUTTON EVENTS
   ============================================================= */

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        selectedFilter = button.dataset.filter;

        filterButtons.forEach(function (filterButton) {
            filterButton.classList.remove("active");
        });

        button.classList.add("active");
        displayFoods();
    });
});


/* =============================================================
   SECTION 23 - SCROLL TO FORM
   ============================================================= */

function scrollToForm() {
    document
        .querySelector("#food-form-section")
        .scrollIntoView({
            behavior: "smooth"
        });
}


topAddButton.addEventListener("click", scrollToForm);
heroAddButton.addEventListener("click", scrollToForm);


/* =============================================================
   SECTION 24 - MANUAL REST API GET
   =============================================================

   The app automatically performs GET on startup, but this button
   makes the GET operation easy to demonstrate to the lecturer.
   ============================================================= */

refreshApiButton.addEventListener("click", async function () {
    refreshApiButton.disabled = true;
    refreshApiButton.textContent = "Refreshing...";

    await loadFoodsFromAPI();

    refreshApiButton.disabled = false;
    refreshApiButton.textContent = "Refresh Inventory (GET)";
});


/* =============================================================
   SECTION 25 - START APPLICATION
   =============================================================

   This custom async function is called when app.js loads.
   The GET request retrieves the current JSONBin data and then
   displayFoods() renders it in the browser.
   ============================================================= */

async function startApplication() {
    displayFoods();
    await loadFoodsFromAPI();
}


startApplication();
