/*
=================================================================
FRESHTRACK - FOOD EXPIRY TRACKER
APP.JS
=================================================================

STUDENT EXPLANATION
-------------------
This is the main JavaScript file for my FreshTrack application.

My program flow is:
1. Select the HTML elements I need with querySelector().
2. GET the saved foods from JSONBin.
3. Store them in the foods array.
4. Work with each food as a JavaScript object.
5. Calculate Fresh, Expiring Soon or Expired.
6. Display the food cards in the DOM.
7. Let the user Create, Read, Update and Delete food.
8. Search/filter the array.
9. Prevent duplicate Product Codes.
10. PUT the changed foods array back to JSONBin.

ASSESSMENT EXAMPLES IN THIS FILE
--------------------------------
Array                -> foods
Object               -> each food record / foodData
Loop                  -> forEach()
Branching             -> if / else if / else
Comparison            -> <, <=, ===, !==
Logical operators     -> && and ||
Custom functions      -> calculateStatus(), displayFoods(), etc.
DOM selection         -> querySelector(), querySelectorAll()
DOM manipulation      -> textContent, innerHTML, classList, appendChild()
Events                -> submit, click, input
CRUD                  -> Add, Display, Edit, Delete
JSON                  -> JSON.stringify(), response.json() in api.js
Async                  -> async / await
REST API              -> JSONBin through FreshTrackAPI
HTTP GET              -> load inventory
HTTP PUT              -> save CRUD changes

STRUCTURED PROGRAMMING EXAMPLE
------------------------------
buildMessage() returns a string and I pass that returned value into
showToast(). This shows one function's return value being used as the
argument of another function.
=================================================================
*/


/* =============================================================
   1. SELECT HTML ELEMENTS
   =============================================================
   I save references to the HTML elements so I can read form values,
   listen for events and change the page with JavaScript.
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
   2. APPLICATION STATE
   =============================================================
   foods is my main ARRAY. Each item inside it is an OBJECT.

   Example food object:
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

   editingId:
   - null = the form is creating a new food.
   - an ID = the form is editing an existing food.

   selectedFilter stores All, Fresh, Expiring Soon or Expired.
   ============================================================= */

let foods = [];
let editingId = null;
let selectedFilter = "All";


/* =============================================================
   3. LOAD / SAVE USING THE REST API
   =============================================================
   FreshTrackAPI comes from api.js.

   loadFoodsFromAPI() = GET the latest array from JSONBin.
   saveFoodsToAPI()   = PUT the current array back to JSONBin.

   try/catch lets me handle API errors without crashing the page.
   ============================================================= */

async function loadFoodsFromAPI() {
    apiResult.textContent =
        "GET in progress: loading inventory from JSONBin...";

    try {
        // await pauses this async function until the GET finishes.
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
   4. NORMALISE PRODUCT CODE
   =============================================================
   trim() removes spaces at the start/end.
   toUpperCase() makes codes consistent, e.g. " milk001 " becomes
   "MILK001".
   ============================================================= */

function normalizeProductCode(code) {
    return code.trim().toUpperCase();
}


/* =============================================================
   5. CHECK FOR DUPLICATE PRODUCT CODE
   =============================================================
   some() returns true if at least one food already has the code.

   food.id !== editingId means a record can keep its own code while
   it is being edited.

   This section also demonstrates ===, !== and &&.
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
   6. CALCULATE EXPIRY STATUS
   =============================================================
   I compare the expiry date with today's date and calculate daysLeft.

   Rules:
   daysLeft < 0  -> Expired
   daysLeft <= 3 -> Expiring Soon
   otherwise     -> Fresh

   The function returns an OBJECT with both status and daysLeft.
   ============================================================= */

function calculateStatus(expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // T00:00:00 makes the date use local midnight consistently.
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
   7. CHOOSE THE CSS CLASS FOR A STATUS
   =============================================================
   I return a class name so CSS can give each status its own colour.
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
   8. CHOOSE AN IMAGE BY FOOD CATEGORY
   =============================================================
   This function returns the correct local image path.
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
   9. FORMAT THE EXPIRY DATE
   =============================================================
   Example: "2026-10-06" becomes "6 Oct 2026" for easier reading.
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
   10. CREATE A FRIENDLY EXPIRY MESSAGE
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
   11. DISPLAY FOODS - READ IN CRUD
   =============================================================
   This function is the main READ/display step.

   What it does:
   1. Clears old cards.
   2. Reads the search text.
   3. Filters by name/code and status.
   4. Loops through the matching foods with forEach().
   5. Creates a card for each food.
   6. Appends each card into #food-grid.
   7. Updates the dashboard counters.

   This section demonstrates filter(), forEach(), ||, && and DOM
   manipulation.
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

    // Show the empty message only when there are no matching records.
    if (visibleFoods.length === 0) {
        emptyMessage.classList.remove("hidden");
    }

    else {
        emptyMessage.classList.add("hidden");
    }

    visibleFoods.forEach(function (food) {
        const foodStatus = calculateStatus(food.expiryDate);

        // createElement() creates a new DOM element in JavaScript.
        const card = document.createElement("article");
        card.className = "food-card";

        // innerHTML builds the content of each card from the food object.
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

        // appendChild() adds the new card to the page.
        foodGrid.appendChild(card);
    });

    updateStatistics();
}


/* =============================================================
   12. UPDATE DASHBOARD STATISTICS
   =============================================================
   I loop through every food, count each status, then use textContent
   to change the four numbers shown in the HTML dashboard.
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
   13. CREATE / UPDATE FOOD
   =============================================================
   One submit event handles two CRUD operations.

   CREATE:
   editingId === null, so I add a new object with push().

   UPDATE:
   editingId contains an ID, so I find that object and replace it.

   I copy foods into previousFoods before changing anything. If the
   JSONBin PUT fails, I restore this copy so the screen does not show
   data that was not really saved.
   ============================================================= */

foodForm.addEventListener("submit", async function (event) {
    // preventDefault() stops the normal HTML form page refresh.
    event.preventDefault();

    const normalizedCode = normalizeProductCode(
        productCode.value
    );

    // Stop the submit if another record already uses this code.
    if (isDuplicateProductCode(normalizedCode)) {
        showToast(
            `Product Code ${normalizedCode} is already in use.`
        );

        productCode.focus();
        return;
    }

    // I group all current form values into one JavaScript object.
    const foodData = {
        productCode: normalizedCode,
        name: foodName.value.trim(),
        category: foodCategory.value,
        quantity: Number(foodQuantity.value),
        expiryDate: foodExpiry.value,
        storage: foodStorage.value,
        notes: foodNotes.value.trim()
    };

    // Make a backup in case the remote PUT request fails.
    const previousFoods = foods.map(function (food) {
        return { ...food };
    });

    let actionWord = "";
    let apiAction = "";

    /* ------------------------- CREATE ------------------------- */
    if (editingId === null) {
        // Date.now() gives the new record a simple unique numeric ID.
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

    // Disable the button while waiting for JSONBin.
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    const saved = await saveFoodsToAPI(apiAction);

    saveButton.disabled = false;

    // If PUT failed, restore the original array and stop here.
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
   14. FUNCTION RETURN VALUE USED BY ANOTHER FUNCTION
   =============================================================
   buildMessage() returns a string. I use that returned string as the
   argument passed into showToast(buildMessage(...)).
   ============================================================= */

function buildMessage(foodNameValue, action) {
    return `${foodNameValue} was successfully ${action}.`;
}


/* =============================================================
   15. TOAST NOTIFICATION
   =============================================================
   textContent changes the message and classList adds/removes the
   CSS class that makes the toast visible.
   ============================================================= */

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    // setTimeout removes the toast automatically after 2.5 seconds.
    setTimeout(function () {
        toast.classList.remove("show");
    }, 2500);
}


/* =============================================================
   16. EDIT / DELETE EVENT DELEGATION
   =============================================================
   Food cards are created dynamically, so I put one click listener on
   #food-grid. I check which button was clicked using classList.
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
   17. START EDITING - UPDATE IN CRUD
   =============================================================
   find() gets the selected food object. I copy its values back into
   the form, change editingId, then change the form to Edit mode.
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
   18. DELETE FOOD - DELETE IN CRUD
   =============================================================
   I first ask the user to confirm. filter() then creates a new array
   without the selected ID. After that, PUT saves the new array.

   If PUT fails, I restore the backup array.
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
   19. RESET FORM
   =============================================================
   After saving or cancelling, I clear the form and return it to
   Create mode by setting editingId back to null.
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
   20. CANCEL EDIT EVENT
   ============================================================= */

cancelButton.addEventListener("click", function () {
    resetForm();
});


/* =============================================================
   21. SEARCH EVENT
   =============================================================
   The input event runs every time I type in the search box, then
   displayFoods() filters and redraws the visible cards.
   ============================================================= */

searchInput.addEventListener("input", function () {
    displayFoods();
});


/* =============================================================
   22. FILTER BUTTON EVENTS
   =============================================================
   querySelectorAll() gave me multiple buttons, so I use forEach()
   to attach a click event to every filter button.
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
   23. SCROLL TO THE FORM
   =============================================================
   I reuse the same custom function for both Add Food buttons.
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
   24. MANUAL REST API GET BUTTON
   =============================================================
   FreshTrack already performs GET when it starts. This button lets
   me trigger GET again during the lecturer demonstration and show
   the request in the browser Network tab.
   ============================================================= */

refreshApiButton.addEventListener("click", async function () {
    refreshApiButton.disabled = true;
    refreshApiButton.textContent = "Refreshing...";

    await loadFoodsFromAPI();

    refreshApiButton.disabled = false;
    refreshApiButton.textContent = "Refresh Inventory (GET)";
});


/* =============================================================
   25. START THE APPLICATION
   =============================================================
   I first draw the empty/current screen, then await the JSONBin GET.
   When GET finishes, loadFoodsFromAPI() redraws the saved inventory.
   ============================================================= */

async function startApplication() {
    displayFoods();
    await loadFoodsFromAPI();
}


startApplication();
