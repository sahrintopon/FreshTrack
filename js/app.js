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
When FreshTrack opens:

1. JavaScript selects important HTML elements.
2. Previously saved food is loaded from localStorage.
3. The foods array stores all food records.
4. displayFoods() displays those records.
5. calculateStatus() checks each expiry date.
6. updateStatistics() updates the dashboard.


WHEN THE USER ADDS FOOD
-----------------------
1. User fills in the form.
2. The submit event occurs.
3. JavaScript creates a food OBJECT.
4. The object is added to the foods ARRAY.
5. Data is saved in localStorage.
6. The food cards are displayed again.


WHEN THE USER EDITS FOOD
------------------------
1. User clicks Edit.
2. JavaScript finds the correct food object.
3. Its values are placed back into the form.
4. editingId stores the food ID.
5. The user changes the information.
6. The food object is updated.


WHEN THE USER DELETES FOOD
--------------------------
1. User clicks Delete.
2. JavaScript asks for confirmation.
3. filter() creates a new array without that item.
4. localStorage is updated.
5. The interface refreshes.


=================================================================
ASSESSMENT CONCEPT MAP
=================================================================

ARRAY
-----
foods


OBJECT
------
Each food record is an object.

Example:

{
    id: 123,
    name: "Milk",
    category: "Dairy",
    quantity: 1,
    expiryDate: "2026-10-10",
    storage: "Fridge",
    notes: "Opened today"
}


LOOPS
-----
forEach()


BRANCHING
---------
if
else if
else


COMPARISON OPERATORS
--------------------
<
<=
===
!==


LOGICAL OPERATORS
-----------------
&&
||


CUSTOM FUNCTIONS
----------------
calculateStatus()
getStatusClass()
getFoodImage()
formatDate()
getExpiryMessage()
displayFoods()
updateStatistics()
saveFoodData()
startEditing()
deleteFood()
resetForm()
buildMessage()
showToast()
scrollToForm()


DOM SELECTION
-------------
document.querySelector()
document.querySelectorAll()


DOM MANIPULATION
----------------
textContent
innerHTML
classList.add()
classList.remove()
appendChild()
value


EVENT HANDLERS
--------------
submit
click
input


CRUD
----
CREATE = Add Food
READ   = Display Food
UPDATE = Edit Food
DELETE = Delete Food


LOCAL STORAGE
-------------
localStorage.getItem()
localStorage.setItem()


JSON
----
JSON.parse()
JSON.stringify()
response.json()


ASYNCHRONOUS PROGRAMMING
------------------------
async
await


AJAX / REST API
---------------
fetch()


HTTP GET
--------
fetch(url)


HTTP POST
---------
fetch(url, {
    method: "POST"
})


FUNCTION RETURN VALUE USED AS ANOTHER FUNCTION ARGUMENT
-------------------------------------------------------
showToast(
    buildMessage(...)
)

buildMessage() returns a string.

That returned string becomes the argument supplied
to showToast().
=================================================================
*/



/* =============================================================
   SECTION 1 - SELECT HTML ELEMENTS
   =============================================================

   JavaScript needs references to HTML elements before
   it can interact with them.

   document.querySelector() returns ONE matching element.

   document.querySelectorAll() returns MULTIPLE matching elements.

   After selecting an element, JavaScript can:

   - Read its value
   - Change its text
   - Change its CSS classes
   - Listen for events
   ============================================================= */


const foodForm =
    document.querySelector("#food-form");


const foodName =
    document.querySelector("#food-name");


const foodCategory =
    document.querySelector("#food-category");


const foodQuantity =
    document.querySelector("#food-quantity");


const foodExpiry =
    document.querySelector("#food-expiry");


const foodStorage =
    document.querySelector("#food-storage");


const foodNotes =
    document.querySelector("#food-notes");


const foodGrid =
    document.querySelector("#food-grid");


const emptyMessage =
    document.querySelector("#empty-message");


const totalCount =
    document.querySelector("#total-count");


const freshCount =
    document.querySelector("#fresh-count");


const expiringCount =
    document.querySelector("#expiring-count");


const expiredCount =
    document.querySelector("#expired-count");


const formTitle =
    document.querySelector("#form-title");


const saveButton =
    document.querySelector("#save-button");


const cancelButton =
    document.querySelector("#cancel-button");


const searchInput =
    document.querySelector("#search-input");



/*
querySelectorAll() returns all elements that use
the .filter-button CSS class.

This produces a collection of four filter buttons.
*/

const filterButtons =
    document.querySelectorAll(
        ".filter-button"
    );


const topAddButton =
    document.querySelector("#top-add-button");


const heroAddButton =
    document.querySelector("#hero-add-button");


const toast =
    document.querySelector("#toast");


const getButton =
    document.querySelector("#get-button");


const postButton =
    document.querySelector("#post-button");


const apiResult =
    document.querySelector("#api-result");



/* =============================================================
   SECTION 2 - APPLICATION STATE / DATA
   =============================================================

   "State" means data currently being used by the application.

   FreshTrack has three important state variables:

   foods
   editingId
   selectedFilter
   ============================================================= */


/*
foods is an ARRAY.

Each item inside the array is a food OBJECT.

Before creating an empty array, we first check localStorage
for food saved during a previous visit.

localStorage.getItem()
retrieves stored text.

JSON.parse()
converts JSON text back into a JavaScript array.

|| []

means:

If there is no saved food, use an empty array instead.
*/

let foods =
    JSON.parse(
        localStorage.getItem(
            "freshTrackFoods"
        )
    ) || [];



/*
editingId controls whether the form is performing:

CREATE
or
UPDATE.

null:
No existing food is being edited.

Number:
Contains the ID of the food being edited.
*/

let editingId = null;



/*
The default status filter is All.

Therefore every food item is visible
when FreshTrack first opens.
*/

let selectedFilter =
    "All";



/* =============================================================
   SECTION 3 - SAVE FOOD DATA
   =============================================================

   localStorage allows food records to remain available
   after the browser page is refreshed.

   localStorage only stores strings.

   Therefore:

   JSON.stringify()

   converts the JavaScript foods array into JSON text.
   ============================================================= */

function saveFoodData() {


    localStorage.setItem(

        "freshTrackFoods",

        JSON.stringify(
            foods
        )

    );

}



/* =============================================================
   SECTION 4 - CALCULATE FOOD EXPIRY STATUS
   =============================================================

   PURPOSE
   -------
   Determine whether a food is:

   Fresh
   Expiring Soon
   Expired


   INPUT
   -----
   expiryDate

   Example:

   "2026-10-10"


   PROCESS
   -------
   1. Get today's date.
   2. Convert expiryDate into a Date object.
   3. Calculate the difference between the dates.
   4. Convert milliseconds into days.
   5. Use if / else branching to determine status.


   RULES
   -----
   daysLeft < 0

       Expired


   daysLeft <= 3

       Expiring Soon


   Otherwise

       Fresh


   OUTPUT
   ------
   The function RETURNS an OBJECT.

   Example:

   {
       status: "Fresh",
       daysLeft: 7
   }


   ASSESSMENT CONCEPTS
   -------------------
   - Function
   - Parameter
   - Return value
   - Object
   - Branching
   - Comparison operators
   ============================================================= */

function calculateStatus(expiryDate) {


    /*
    Create today's date.
    */

    const today =
        new Date();



    /*
    Remove hours, minutes, seconds and milliseconds.

    This means we compare calendar dates
    rather than exact times.
    */

    today.setHours(
        0,
        0,
        0,
        0
    );



    /*
    Convert the expiry date from the form into
    a JavaScript Date object.

    Adding T00:00:00 treats it as local midnight.
    */

    const expiry =
        new Date(
            expiryDate + "T00:00:00"
        );


    expiry.setHours(
        0,
        0,
        0,
        0
    );



    /*
    Subtract today's date from the expiry date.

    JavaScript Date subtraction produces milliseconds.
    */

    const difference =
        expiry.getTime()
        -
        today.getTime();



    /*
    Convert milliseconds into days.

    1000 milliseconds = 1 second
    60 seconds = 1 minute
    60 minutes = 1 hour
    24 hours = 1 day
    */

    const daysLeft =
        Math.ceil(

            difference
            /
            (
                1000
                *
                60
                *
                60
                *
                24
            )

        );



    /*
    BRANCH 1

    Comparison operator:
    <
    */

    if (daysLeft < 0) {


        return {

            status:
                "Expired",

            daysLeft:
                daysLeft

        };

    }



    /*
    BRANCH 2

    Comparison operator:
    <=
    */

    else if (daysLeft <= 3) {


        return {

            status:
                "Expiring Soon",

            daysLeft:
                daysLeft

        };

    }



    /*
    BRANCH 3

    Anything more than 3 days away is Fresh.
    */

    else {


        return {

            status:
                "Fresh",

            daysLeft:
                daysLeft

        };

    }

}



/* =============================================================
   SECTION 5 - RETURN CSS CLASS FOR STATUS
   =============================================================

   PURPOSE
   -------
   Return the CSS class that controls the colour
   of the food status badge.

   Fresh
       Green

   Expiring Soon
       Yellow

   Expired
       Red


   ASSESSMENT CONCEPTS
   -------------------
   - Function
   - Parameter
   - Return value
   - Branching
   - Comparison operator ===
   ============================================================= */

function getStatusClass(status) {


    if (status === "Fresh") {


        return "status-fresh";

    }


    else if (
        status === "Expiring Soon"
    ) {


        return "status-warning";

    }


    else {


        return "status-expired";

    }

}



/* =============================================================
   SECTION 6 - SELECT IMAGE BASED ON CATEGORY
   =============================================================

   PURPOSE
   -------
   Each food category is linked to an image.

   Example:

   Apple + Fruit
       apple.jpg

   Beef + Meat
       meat.jpg

   Milk + Dairy
       milk.jpg


   INPUT
   -----
   category


   OUTPUT
   ------
   A string containing an image file path.


   ASSESSMENT CONCEPTS
   -------------------
   - Custom function
   - Parameter
   - Return value
   - Branching
   - Comparison operator
   ============================================================= */

function getFoodImage(category) {


    if (category === "Fruit") {


        return "images/apple.jpg";

    }


    else if (
        category === "Vegetables"
    ) {


        return "images/vegetables.jpg";

    }


    else if (
        category === "Dairy"
    ) {


        return "images/milk.jpg";

    }


    else if (
        category === "Meat"
    ) {


        return "images/meat.jpg";

    }


    else if (
        category === "Bakery"
    ) {


        return "images/bread.jpg";

    }


    else if (
        category === "Frozen"
    ) {


        return "images/frozen.jpg";

    }


    else if (
        category === "Drinks"
    ) {


        return "images/drinks.jpg";

    }


    /*
    If no earlier category matched,
    the category must be Others.
    */

    else {


        return "images/others.jpg";

    }

}



/* =============================================================
   SECTION 7 - FORMAT DATE
   =============================================================

   PURPOSE
   -------
   Convert the date stored by the HTML date input into
   a more readable display format.


   INPUT
   -----
   2026-10-06


   OUTPUT EXAMPLE
   --------------
   6 Oct 2026
   ============================================================= */

function formatDate(dateValue) {


    const date =
        new Date(
            dateValue + "T00:00:00"
        );


    return date.toLocaleDateString(

        "en-SG",

        {

            day:
                "numeric",

            month:
                "short",

            year:
                "numeric"

        }

    );

}



/* =============================================================
   SECTION 8 - CREATE EXPIRY MESSAGE
   =============================================================

   PURPOSE
   -------
   Create a user-friendly message describing
   how much time remains before expiry.


   EXAMPLES
   --------
   -2
       "2 day(s) overdue"

   0
       "Expires today"

   1
       "1 day remaining"

   5
       "5 days remaining"


   ASSESSMENT CONCEPTS
   -------------------
   - Branching
   - Comparison operators
   - Function return values
   ============================================================= */

function getExpiryMessage(daysLeft) {


    if (daysLeft < 0) {


        return (
            `${Math.abs(daysLeft)} day(s) overdue`
        );

    }


    else if (daysLeft === 0) {


        return "Expires today";

    }


    else if (daysLeft === 1) {


        return "1 day remaining";

    }


    else {


        return (
            `${daysLeft} days remaining`
        );

    }

}



/* =============================================================
   SECTION 9 - DISPLAY FOOD
   =============================================================

   CRUD OPERATION
   --------------
   READ


   PURPOSE
   -------
   Read food objects from the foods array
   and display them on the webpage.


   PROCESS
   -------
   1. Clear existing cards.
   2. Read search text.
   3. Filter food by search and status.
   4. Loop through matching food.
   5. Create HTML cards.
   6. Append cards into #food-grid.
   7. Update dashboard statistics.


   ASSESSMENT CONCEPTS
   -------------------
   - READ
   - Loop
   - Array
   - Object
   - filter()
   - forEach()
   - Logical operators
   - DOM manipulation
   - Function calls
   ============================================================= */

function displayFoods() {


    /*
    DOM MANIPULATION

    Clear everything currently displayed
    inside the food grid.
    */

    foodGrid.innerHTML =
        "";



    /*
    Get the search text.

    toLowerCase()
    makes searching case-insensitive.

    trim()
    removes unwanted spaces.
    */

    const searchText =
        searchInput
            .value
            .toLowerCase()
            .trim();



    /*
    filter() creates a NEW ARRAY.

    Only food matching BOTH:
    - Search
    - Status filter

    will remain.
    */

    const visibleFoods =
        foods.filter(

            function (food) {


                /*
                calculateStatus() returns an OBJECT.
                */

                const foodStatus =
                    calculateStatus(
                        food.expiryDate
                    );



                /*
                SEARCH CONDITION

                includes() checks whether the food name
                contains the search text.
                */

                const matchesSearch =
                    food.name
                        .toLowerCase()
                        .includes(
                            searchText
                        );



                /*
                FILTER CONDITION

                || means OR.

                The food is displayed when:

                selectedFilter is All

                OR

                the food status matches the selected filter.
                */

                const matchesFilter =

                    selectedFilter
                    ===
                    "All"

                    ||

                    foodStatus.status
                    ===
                    selectedFilter;



                /*
                && means AND.

                BOTH search and filter conditions
                must be true.
                */

                return (

                    matchesSearch

                    &&

                    matchesFilter

                );

            }

        );



    /*
    EMPTY STATE

    If there are zero matching food records,
    show the empty message.
    */

    if (
        visibleFoods.length === 0
    ) {


        emptyMessage
            .classList
            .remove(
                "hidden"
            );

    }


    else {


        emptyMessage
            .classList
            .add(
                "hidden"
            );

    }



    /*
    LOOP

    forEach() runs once for every food object
    inside visibleFoods.
    */

    visibleFoods.forEach(

        function (food) {


            const foodStatus =
                calculateStatus(
                    food.expiryDate
                );



            /*
            DOM MANIPULATION

            Create a new <article> element.
            */

            const card =
                document.createElement(
                    "article"
                );



            /*
            DOM MANIPULATION

            Change the className property.
            */

            card.className =
                "food-card";



            /*
            DOM MANIPULATION

            innerHTML inserts HTML into the new article.

            ${...}
            inserts JavaScript values into the HTML template.
            */

            card.innerHTML = `

                <img
                    class="food-card-image"
                    src="${getFoodImage(food.category)}"
                    alt="${food.name}"
                >


                <div class="food-card-content">


                    <div class="food-card-header">


                        <div>

                            <h3>
                                ${food.name}
                            </h3>


                            <p class="food-category">
                                ${food.category}
                            </p>

                        </div>


                        <span
                            class="
                                status
                                ${getStatusClass(
                                    foodStatus.status
                                )}
                            "
                        >

                            ${foodStatus.status}

                        </span>


                    </div>



                    <div class="food-detail">

                        <span>
                            Expiry
                        </span>


                        <strong>

                            ${formatDate(
                                food.expiryDate
                            )}

                        </strong>

                    </div>



                    <div class="food-detail">

                        <span>
                            Remaining
                        </span>


                        <strong>

                            ${getExpiryMessage(
                                foodStatus.daysLeft
                            )}

                        </strong>

                    </div>



                    <div class="food-detail">

                        <span>
                            Quantity
                        </span>


                        <strong>
                            ${food.quantity}
                        </strong>

                    </div>



                    <div class="food-detail">

                        <span>
                            Storage
                        </span>


                        <strong>
                            ${food.storage}
                        </strong>

                    </div>



                    ${
                        food.notes
                        ?
                        `

                        <div class="food-notes">

                            📝 ${food.notes}

                        </div>

                        `
                        :
                        ""
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



            /*
            DOM MANIPULATION

            appendChild() inserts the new card
            into the food grid.
            */

            foodGrid.appendChild(
                card
            );

        }

    );



    /*
    Refresh dashboard values.
    */

    updateStatistics();

}



/* =============================================================
   SECTION 10 - UPDATE DASHBOARD STATISTICS
   =============================================================

   PURPOSE
   -------
   Count:

   - Total food
   - Fresh food
   - Expiring Soon food
   - Expired food


   PROCESS
   -------
   1. Start counters at zero.
   2. Loop through foods.
   3. Calculate each food's status.
   4. Increase the matching counter.
   5. Update HTML using textContent.


   ASSESSMENT CONCEPTS
   -------------------
   - Loop
   - Branching
   - Variables
   - Function calls
   - DOM manipulation
   ============================================================= */

function updateStatistics() {


    let fresh =
        0;


    let expiring =
        0;


    let expired =
        0;



    /*
    LOOP through every food item.
    */

    foods.forEach(

        function (food) {


            const status =
                calculateStatus(
                    food.expiryDate
                );



            if (
                status.status
                ===
                "Fresh"
            ) {


                fresh++;

            }


            else if (
                status.status
                ===
                "Expiring Soon"
            ) {


                expiring++;

            }


            else {


                expired++;

            }

        }

    );



    /*
    DOM MANIPULATION

    Four different DOM elements have their
    textContent property changed.
    */

    totalCount.textContent =
        foods.length;


    freshCount.textContent =
        fresh;


    expiringCount.textContent =
        expiring;


    expiredCount.textContent =
        expired;

}



/* =============================================================
   SECTION 11 - CREATE / UPDATE FOOD
   =============================================================

   EVENT
   -----
   submit


   CRUD
   ----
   CREATE
   UPDATE


   HOW THE SAME FORM PERFORMS TWO OPERATIONS
   -----------------------------------------
   editingId === null

       CREATE


   editingId contains an ID

       UPDATE


   ASSESSMENT CONCEPTS
   -------------------
   - Event handler
   - Object
   - Array
   - Branching
   - Function calls
   - CRUD
   ============================================================= */

foodForm.addEventListener(

    "submit",

    function (event) {


        /*
        Normally submitting an HTML form reloads the page.

        preventDefault() stops that behaviour.

        JavaScript can therefore process the form itself.
        */

        event.preventDefault();



        /*
        OBJECT

        Create one foodData object using
        information from the HTML form.
        */

        const foodData = {


            name:
                foodName
                    .value
                    .trim(),


            category:
                foodCategory.value,


            quantity:
                Number(
                    foodQuantity.value
                ),


            expiryDate:
                foodExpiry.value,


            storage:
                foodStorage.value,


            notes:
                foodNotes
                    .value
                    .trim()

        };



        /* =====================================================
           CREATE
           =====================================================

           If editingId is null, this is a new food record.
           ===================================================== */

        if (
            editingId === null
        ) {


            /*
            Date.now() returns the current timestamp.

            It is used here as a simple unique ID.
            */

            foodData.id =
                Date.now();



            /*
            ARRAY MANIPULATION

            push() adds the new food object
            to the foods array.
            */

            foods.push(
                foodData
            );



            /*
            IMPORTANT ASSESSMENT REQUIREMENT

            buildMessage()
            RETURNS a string.

            That return value is immediately used
            as the argument of showToast().

            Function return value
            ->
            argument of another function.
            */

            showToast(

                buildMessage(
                    foodData.name,
                    "added"
                )

            );

        }



        /* =====================================================
           UPDATE
           ===================================================== */

        else {


            /*
            findIndex() searches the foods array.

            It returns the ARRAY INDEX of the object
            whose ID matches editingId.
            */

            const index =
                foods.findIndex(

                    function (food) {


                        return (
                            food.id
                            ===
                            editingId
                        );

                    }

                );



            /*
            Only update if a matching record exists.
            */

            if (index !== -1) {


                /*
                Replace the existing object.

                ...foodData
                copies all properties from foodData.
                */

                foods[index] = {


                    id:
                        editingId,


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



        /*
        Save updated array to localStorage.
        */

        saveFoodData();



        /*
        Return form to normal Add mode.
        */

        resetForm();



        /*
        Re-render food cards and statistics.
        */

        displayFoods();

    }

);



/* =============================================================
   SECTION 12 - BUILD NOTIFICATION MESSAGE
   =============================================================

   PURPOSE
   -------
   Return a message after an action.

   Example:

   buildMessage("Milk", "added")

   RETURNS:

   "Milk was successfully added."


   IMPORTANT
   ---------
   The returned value is used directly as an argument:

   showToast(
       buildMessage(...)
   )
   ============================================================= */

function buildMessage(
    foodName,
    action
) {


    return (
        `${foodName} was successfully ${action}.`
    );

}



/* =============================================================
   SECTION 13 - DISPLAY TOAST NOTIFICATION
   =============================================================

   PURPOSE
   -------
   Display a temporary message after:

   - Adding
   - Updating
   - Deleting


   DOM MANIPULATION
   ----------------
   textContent
   classList.add()
   classList.remove()


   setTimeout()
   ------------
   Runs a function after a delay.
   ============================================================= */

function showToast(message) {


    /*
    Change the text inside the toast.
    */

    toast.textContent =
        message;



    /*
    Add the CSS class that makes it visible.
    */

    toast.classList.add(
        "show"
    );



    /*
    After 2500 milliseconds
    remove the class again.

    2500 ms = 2.5 seconds.
    */

    setTimeout(

        function () {


            toast.classList.remove(
                "show"
            );

        },

        2500

    );

}



/* =============================================================
   SECTION 14 - EDIT AND DELETE EVENT DELEGATION
   =============================================================

   Instead of attaching an event listener to every card,
   one CLICK listener is attached to #food-grid.

   This technique is called EVENT DELEGATION.


   When something inside foodGrid is clicked,
   JavaScript checks whether the clicked element has:

   edit-button

   or

   delete-button


   data-id contains the food object's unique ID.
   ============================================================= */

foodGrid.addEventListener(

    "click",

    function (event) {



        /* =====================================================
           EDIT BUTTON
           ===================================================== */

        if (
            event.target
                .classList
                .contains(
                    "edit-button"
                )
        ) {


            /*
            dataset.id reads:

            data-id="123"

            from the HTML button.
            */

            const id =
                Number(
                    event.target
                        .dataset
                        .id
                );


            startEditing(
                id
            );

        }



        /* =====================================================
           DELETE BUTTON
           ===================================================== */

        if (
            event.target
                .classList
                .contains(
                    "delete-button"
                )
        ) {


            const id =
                Number(
                    event.target
                        .dataset
                        .id
                );


            deleteFood(
                id
            );

        }

    }

);



/* =============================================================
   SECTION 15 - START EDITING FOOD
   =============================================================

   CRUD
   ----
   UPDATE


   PROCESS
   -------
   1. Receive a food ID.
   2. Search foods array using find().
   3. Store the ID in editingId.
   4. Copy the food values into the form.
   5. Change form title to Edit Food Item.
   6. Change button to Save Changes.
   7. Show the Cancel button.
   8. Scroll to the form.


   ASSESSMENT CONCEPTS
   -------------------
   - Function
   - Array.find()
   - Object
   - DOM manipulation
   - Branching
   ============================================================= */

function startEditing(id) {


    /*
    find() returns the first object
    whose ID matches.
    */

    const food =
        foods.find(

            function (food) {


                return (
                    food.id
                    ===
                    id
                );

            }

        );



    /*
    Defensive check.

    If no food object exists,
    stop the function.
    */

    if (!food) {


        return;

    }



    /*
    Save the food ID.

    The form now knows that the next submit
    operation should UPDATE instead of CREATE.
    */

    editingId =
        id;



    /*
    DOM MANIPULATION

    Place the existing food values
    inside the form fields.
    */

    foodName.value =
        food.name;


    foodCategory.value =
        food.category;


    foodQuantity.value =
        food.quantity;


    foodExpiry.value =
        food.expiryDate;


    foodStorage.value =
        food.storage;


    foodNotes.value =
        food.notes;



    /*
    Change visible form text.
    */

    formTitle.textContent =
        "Edit Food Item";


    saveButton.textContent =
        "Save Changes";



    /*
    Display the Cancel button.
    */

    cancelButton
        .classList
        .remove(
            "hidden"
        );



    /*
    Move the user back to the form.
    */

    document
        .querySelector(
            "#food-form-section"
        )
        .scrollIntoView({

            behavior:
                "smooth"

        });

}



/* =============================================================
   SECTION 16 - DELETE FOOD
   =============================================================

   CRUD
   ----
   DELETE


   PROCESS
   -------
   1. Find the selected food.
   2. Ask user for confirmation.
   3. filter() removes the matching food.
   4. Save updated array.
   5. Display updated inventory.
   6. Show notification.


   ASSESSMENT CONCEPTS
   -------------------
   - Array
   - Object
   - find()
   - filter()
   - Branching
   - Comparison operator !==
   - Function calls
   ============================================================= */

function deleteFood(id) {


    const selectedFood =
        foods.find(

            function (food) {


                return (
                    food.id
                    ===
                    id
                );

            }

        );



    /*
    Stop if the food does not exist.
    */

    if (!selectedFood) {


        return;

    }



    /*
    confirm() displays a browser confirmation box.

    It returns:

    true
    if the user clicks OK.

    false
    if the user clicks Cancel.
    */

    const confirmed =
        confirm(

            `Delete ${selectedFood.name}?`

        );



    /*
    If confirmed is false,
    stop here.
    */

    if (!confirmed) {


        return;

    }



    /*
    DELETE OPERATION

    filter() creates a new array.

    Every food is kept EXCEPT
    the food whose ID matches the deleted ID.

    !== means:
    NOT equal.
    */

    foods =
        foods.filter(

            function (food) {


                return (
                    food.id
                    !==
                    id
                );

            }

        );



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
   SECTION 17 - RESET FORM
   =============================================================

   PURPOSE
   -------
   Return the form to normal CREATE mode.

   Used after:

   - Adding food
   - Updating food
   - Cancelling an edit
   ============================================================= */

function resetForm() {


    /*
    Clear the form.
    */

    foodForm.reset();



    /*
    Default quantity should return to 1.
    */

    foodQuantity.value =
        1;



    /*
    null means:
    next submit creates a new food.
    */

    editingId =
        null;



    /*
    Reset visible form text.
    */

    formTitle.textContent =
        "Add Food Item";


    saveButton.textContent =
        "Add Item";



    /*
    Hide the Cancel button.
    */

    cancelButton
        .classList
        .add(
            "hidden"
        );

}



/* =============================================================
   SECTION 18 - CANCEL EDIT EVENT
   =============================================================

   EVENT
   -----
   click

   Clicking Cancel calls resetForm().
   ============================================================= */

cancelButton.addEventListener(

    "click",

    function () {


        resetForm();

    }

);



/* =============================================================
   SECTION 19 - SEARCH EVENT
   =============================================================

   EVENT
   -----
   input


   The input event occurs every time the user types
   inside the search box.

   displayFoods() runs again immediately.

   The filtering logic inside displayFoods()
   decides which cards should remain visible.
   ============================================================= */

searchInput.addEventListener(

    "input",

    function () {


        displayFoods();

    }

);



/* =============================================================
   SECTION 20 - FILTER BUTTON EVENTS
   =============================================================

   filterButtons contains MULTIPLE buttons.

   forEach() loops through the buttons and attaches
   a CLICK event listener to each one.


   When a filter is clicked:

   1. Read data-filter.
   2. Save it in selectedFilter.
   3. Remove active class from all filters.
   4. Add active class to clicked filter.
   5. Run displayFoods().
   ============================================================= */

filterButtons.forEach(

    function (button) {


        button.addEventListener(

            "click",

            function () {



                /*
                dataset.filter reads the HTML:

                data-filter="Fresh"

                for example.
                */

                selectedFilter =
                    button.dataset.filter;



                /*
                Remove active class
                from every button.
                */

                filterButtons.forEach(

                    function (
                        filterButton
                    ) {


                        filterButton
                            .classList
                            .remove(
                                "active"
                            );

                    }

                );



                /*
                Add active class only
                to the clicked button.
                */

                button
                    .classList
                    .add(
                        "active"
                    );



                /*
                Refresh displayed food.
                */

                displayFoods();

            }

        );

    }

);



/* =============================================================
   SECTION 21 - SCROLL TO FOOD FORM
   =============================================================

   PURPOSE
   -------
   Reuse the same function for TWO buttons:

   - Header Add Food
   - Hero Add Food Item


   This demonstrates function reuse.
   ============================================================= */

function scrollToForm() {


    document
        .querySelector(
            "#food-form-section"
        )
        .scrollIntoView({

            behavior:
                "smooth"

        });

}



/*
CLICK EVENT HANDLER
*/

topAddButton.addEventListener(

    "click",

    scrollToForm

);



/*
ANOTHER CLICK EVENT HANDLER

Both buttons reuse scrollToForm().
*/

heroAddButton.addEventListener(

    "click",

    scrollToForm

);



/* =============================================================
   SECTION 22 - AJAX GET REQUEST
   =============================================================

   PURPOSE
   -------
   Demonstrate an asynchronous HTTP GET request.


   IMPORTANT TERMS
   ---------------

   async
       Marks this function as asynchronous.


   fetch()
       Sends an HTTP request.


   await
       Waits for an asynchronous operation to finish.


   response.json()
       Reads the JSON response and converts it
       into a JavaScript object.


   try / catch
       Handles success and errors safely.


   GET
   ---
   Because no method is specified in fetch(),
   GET is used automatically.


   API
   ---
   JSONPlaceholder is a testing REST API.


   ASSESSMENT EVIDENCE
   -------------------
   - Asynchronous programming
   - HTTP
   - AJAX
   - GET
   - JSON
   - REST API
   ============================================================= */

getButton.addEventListener(

    "click",

    async function () {


        /*
        Tell user the request has started.
        */

        apiResult.textContent =
            "Sending GET request...";



        try {


            /*
            ASYNCHRONOUS GET REQUEST

            JavaScript waits here until
            the server responds.
            */

            const response =
                await fetch(

                    "https://jsonplaceholder.typicode.com/posts/1"

                );



            /*
            Check whether the HTTP request succeeded.
            */

            if (!response.ok) {


                throw new Error(
                    "GET request failed."
                );

            }



            /*
            Parse JSON response.

            response.json() is also asynchronous,
            so await is used again.
            */

            const data =
                await response.json();



            /*
            DOM MANIPULATION

            Display information returned by the API.
            */

            apiResult.textContent =

                `GET successful. Record ${data.id}: ${data.title}`;

        }



        catch (error) {


            apiResult.textContent =
                "GET request failed. Please check your internet connection.";

        }

    }

);



/* =============================================================
   SECTION 23 - AJAX POST REQUEST
   =============================================================

   PURPOSE
   -------
   Demonstrate sending JSON data to a REST API
   using HTTP POST.


   PROCESS
   -------
   1. Create a JavaScript object.
   2. Convert object into JSON using JSON.stringify().
   3. Send data using fetch().
   4. Wait for response.
   5. Convert response JSON back into JavaScript.
   6. Display result.


   HTTP METHOD
   -----------
   POST


   ASSESSMENT EVIDENCE
   -------------------
   - Asynchronous programming
   - HTTP POST
   - AJAX
   - JSON
   - REST API
   - JavaScript Object
   ============================================================= */

postButton.addEventListener(

    "click",

    async function () {


        apiResult.textContent =
            "Sending POST request...";



        /*
        OBJECT

        This is the JavaScript object
        that will be sent to the API.
        */

        const dataToSend = {


            title:
                "FreshTrack Food",


            body:
                "Food expiry tracker demonstration",


            userId:
                1

        };



        try {


            const response =
                await fetch(

                    "https://jsonplaceholder.typicode.com/posts",

                    {


                        /*
                        Tell fetch to use POST.
                        */

                        method:
                            "POST",



                        /*
                        Tell the server that the request body
                        contains JSON.
                        */

                        headers: {


                            "Content-Type":
                                "application/json"

                        },



                        /*
                        Convert JavaScript object
                        into JSON text before sending.
                        */

                        body:
                            JSON.stringify(
                                dataToSend
                            )

                    }

                );



            /*
            Check HTTP success.
            */

            if (!response.ok) {


                throw new Error(
                    "POST request failed."
                );

            }



            /*
            Convert JSON response back
            into JavaScript.
            */

            const data =
                await response.json();



            /*
            Display the returned ID.
            */

            apiResult.textContent =

                `POST successful. New record ID: ${data.id}`;

        }



        catch (error) {


            apiResult.textContent =
                "POST request failed. Please check your internet connection.";

        }

    }

);



/* =============================================================
   SECTION 24 - START THE APPLICATION
   =============================================================

   This is the final statement in app.js.

   When the webpage first loads:

   displayFoods()

   is called immediately.

   This means:

   - Previously saved localStorage food is shown.
   - Statuses are recalculated.
   - Dashboard counters are updated.

   This is the starting point of the application's
   visible behaviour.
   ============================================================= */

displayFoods();