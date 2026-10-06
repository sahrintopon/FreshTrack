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
2. Load food records from localStorage.
3. Store records in the foods ARRAY.
4. Each food record is stored as an OBJECT.
5. Calculate whether each item is Fresh, Expiring Soon or Expired.
6. Display food cards dynamically in the DOM.
7. Support full CRUD: Create, Read, Update and Delete.
8. Search by Food Name OR Product Code.
9. Prevent duplicate Product Codes.
10. Demonstrate asynchronous REST API GET and POST requests.

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
JSON                  -> JSON.parse(), JSON.stringify(), response.json()
ASYNC                 -> async / await
AJAX / REST API       -> fetch()
HTTP GET              -> fetch(url)
HTTP POST             -> fetch(url, { method: "POST" })

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
   =============================================================
   querySelector() selects ONE element.
   querySelectorAll() selects MULTIPLE elements.
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

const toast = document.querySelector("#toast");

const getButton = document.querySelector("#get-button");
const postButton = document.querySelector("#post-button");
const apiResult = document.querySelector("#api-result");


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

let foods = JSON.parse(
    localStorage.getItem("freshTrackFoods")
) || [];

let editingId = null;
let selectedFilter = "All";


/* =============================================================
   SECTION 3 - SAVE DATA TO LOCAL STORAGE
   =============================================================

   localStorage only stores text.
   JSON.stringify() converts the foods array into JSON text.
   ============================================================= */

function saveFoodData() {
    localStorage.setItem(
        "freshTrackFoods",
        JSON.stringify(foods)
    );
}


/* =============================================================
   SECTION 4 - PRODUCT CODE NORMALISATION
   =============================================================

   PURPOSE:
   Keep Product Codes consistent.

   Example:
   " beef001 " -> "BEEF001"

   trim() removes extra spaces.
   toUpperCase() converts letters to capital letters.
   ============================================================= */

function normalizeProductCode(code) {
    return code.trim().toUpperCase();
}


/* =============================================================
   SECTION 5 - CHECK FOR DUPLICATE PRODUCT CODE
   =============================================================

   PURPOSE:
   Prevent two different food records from using the same code.

   some() checks whether AT LEAST ONE object matches the condition.

   When editing:
   food.id !== editingId allows the record to keep its own code.

   ASSESSMENT CONCEPTS:
   - Array method
   - Function
   - Parameter
   - Return value
   - Logical operator &&
   - Comparison operators === and !==
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
   =============================================================

   INPUT:
   expiryDate, for example "2026-10-10"

   PROCESS:
   1. Get today's date.
   2. Convert expiryDate into a Date object.
   3. Calculate the difference in days.
   4. Use branching to decide the status.

   RULES:
   daysLeft < 0  -> Expired
   daysLeft <= 3 -> Expiring Soon
   otherwise     -> Fresh

   OUTPUT:
   An OBJECT containing status and daysLeft.
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
   =============================================================

   The function receives a category and RETURNS an image path.
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
   =============================================================

   Example:
   "2026-10-06" -> "6 Oct 2026"
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
   =============================================================

   PROCESS:
   1. Clear existing cards.
   2. Read the search text.
   3. Filter by food name OR product code.
   4. Filter by status.
   5. Loop through matching food objects.
   6. Create HTML cards dynamically.
   7. Append cards into #food-grid.
   8. Refresh the dashboard statistics.

   ASSESSMENT CONCEPTS:
   - READ in CRUD
   - filter()
   - forEach()
   - || logical OR
   - && logical AND
   - DOM manipulation
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
   =============================================================

   forEach() loops through the foods array.
   textContent modifies four DOM elements.
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

   EVENT:
   submit

   CREATE:
   editingId === null

   UPDATE:
   editingId contains an existing ID

   PRODUCT CODE VALIDATION:
   The code is normalised first and duplicate codes are rejected.
   ============================================================= */

foodForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const normalizedCode = normalizeProductCode(
        productCode.value
    );

    /*
    If another food record already uses this code,
    show a message and STOP the submit function with return.
    */
    if (isDuplicateProductCode(normalizedCode)) {
        showToast(
            `Product Code ${normalizedCode} is already in use.`
        );

        productCode.focus();
        return;
    }

    /*
    OBJECT:
    The form values are grouped into one foodData object.
    */
    const foodData = {
        productCode: normalizedCode,
        name: foodName.value.trim(),
        category: foodCategory.value,
        quantity: Number(foodQuantity.value),
        expiryDate: foodExpiry.value,
        storage: foodStorage.value,
        notes: foodNotes.value.trim()
    };

    /* ------------------------- CREATE ------------------------- */
    if (editingId === null) {
        foodData.id = Date.now();

        foods.push(foodData);

        showToast(
            buildMessage(
                foodData.name,
                "added"
            )
        );
    }

    /* ------------------------- UPDATE ------------------------- */
    else {
        const index = foods.findIndex(function (food) {
            return food.id === editingId;
        });

        if (index !== -1) {
            foods[index] = {
                id: editingId,
                ...foodData
            };

            showToast(
                buildMessage(
                    foodData.name,
                    "updated"
                )
            );
        }
    }

    saveFoodData();
    resetForm();
    displayFoods();
});


/* =============================================================
   SECTION 14 - RETURN VALUE USED AS ANOTHER FUNCTION ARGUMENT
   =============================================================

   buildMessage() RETURNS a string.

   Example:
   buildMessage("Milk", "added")
   returns:
   "Milk was successfully added."

   That return value is used directly as the argument of showToast().
   ============================================================= */

function buildMessage(foodNameValue, action) {
    return `${foodNameValue} was successfully ${action}.`;
}


/* =============================================================
   SECTION 15 - TOAST NOTIFICATION
   =============================================================

   DOM MANIPULATION:
   - textContent
   - classList.add()
   - classList.remove()
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
   =============================================================

   One click listener is attached to #food-grid instead of adding
   a separate listener to every dynamically created card.
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
   =============================================================

   find() searches the foods array for the matching object.
   The object's properties are copied back into the form fields.
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

   filter() creates a new array WITHOUT the selected record.
   ============================================================= */

function deleteFood(id) {
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

    foods = foods.filter(function (food) {
        return food.id !== id;
    });

    saveFoodData();
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
   =============================================================

   The input event runs every time the user types.
   displayFoods() then performs the search again.
   ============================================================= */

searchInput.addEventListener("input", function () {
    displayFoods();
});


/* =============================================================
   SECTION 22 - FILTER BUTTON EVENTS
   =============================================================

   forEach() loops through all filter buttons and attaches
   a click event listener to each button.
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
   =============================================================

   The same function is REUSED by two different click events.
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
   SECTION 24 - REST API GET REQUEST
   =============================================================

   THIS IS ASSESSMENT EVIDENCE FOR:
   - asynchronous programming
   - AJAX
   - HTTP GET
   - JSON
   - REST API

   KEYWORDS TO EXPLAIN:
   async
       Marks the event handler as asynchronous.

   fetch()
       Sends the HTTP request.

   await
       Waits until the Promise completes.

   response.json()
       Converts the JSON response into a JavaScript object.

   GET
       No method is supplied, so fetch() uses GET automatically.
   ============================================================= */

getButton.addEventListener("click", async function () {
    apiResult.textContent = "Sending GET request...";

    try {
        const response = await fetch(
            "https://jsonplaceholder.typicode.com/posts/1"
        );

        if (!response.ok) {
            throw new Error("GET request failed.");
        }

        const data = await response.json();

        apiResult.textContent =
            `GET successful. Record ${data.id}: ${data.title}`;
    }

    catch (error) {
        apiResult.textContent =
            "GET request failed. Please check your internet connection.";
    }
});


/* =============================================================
   SECTION 25 - REST API POST REQUEST
   =============================================================

   THIS IS ASSESSMENT EVIDENCE FOR:
   - asynchronous programming
   - AJAX
   - HTTP POST
   - JavaScript object
   - JSON.stringify()
   - response.json()
   - REST API

   FreshTrack-specific demonstration data is used so the example
   is easier to explain during the lecturer oral clarification.

   IMPORTANT:
   JSONPlaceholder is a TEST API. It simulates creating a record
   and returns a response, but it does not permanently save it.
   ============================================================= */

postButton.addEventListener("click", async function () {
    apiResult.textContent = "Sending POST request...";

    /*
    JAVASCRIPT OBJECT that will be sent to the REST API.
    */
    const dataToSend = {
        productCode: "DEMO001",
        foodName: "FreshTrack Demo Food",
        category: "Others",
        quantity: 1,
        source: "FreshTrack API demonstration"
    };

    try {
        const response = await fetch(
            "https://jsonplaceholder.typicode.com/posts",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },

                /*
                JSON.stringify() converts the JavaScript object
                into JSON text before it is transmitted.
                */
                body: JSON.stringify(dataToSend)
            }
        );

        if (!response.ok) {
            throw new Error("POST request failed.");
        }

        const data = await response.json();

        apiResult.textContent =
            `POST successful. Demo record ID: ${data.id}`;
    }

    catch (error) {
        apiResult.textContent =
            "POST request failed. Please check your internet connection.";
    }
});


/* =============================================================
   SECTION 26 - START APPLICATION
   =============================================================

   displayFoods() runs immediately when app.js loads.
   It displays saved data and updates the statistics dashboard.
   ============================================================= */

displayFoods();
