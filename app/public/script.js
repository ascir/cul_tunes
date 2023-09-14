const pageviewsCount = document.getElementById('pageviews-count');
var dish = document.getElementById("dish");
var submitDishBtn = document.getElementById("submitDishBtn");
var submitCuisineBtn = document.getElementById("submitCuisineBtn");
const resultsContainer = document.getElementById("results");


let counterUpdated = false;
updateCounter();

function submitDish() {
    userInput = dish.value.trim();
    if (userInput == "") {
        alert("Please enter a dish or ingredient.");
    }
    else {
        alert("User entered: " + userInput)
        fetch(`/api/cook-and-play/?dish=${userInput}`)
            .then(res => res.json())
            .then(data => {
                console.log(data)
                resultsContainer.textContent = data;
            })
            .catch(error => {
                resultsContainer.textContent = "No recipes found ☹️"
            });
    }
}

function submitCuisine() {
    userInput = cuisine.value.trim();
    if (userInput == "--- Choose a Countrys ---") {
        alert("Please choose an option.");
    }
    else {
        alert("User chose: " + userInput)
    }
}

function updateCounter() {
    if (!counterUpdated) {
        fetch('/api/page-views') // Dynamic request with URL parameter
            .then(res => res.json())
            .then(data => {
                pageviewsCount.textContent = data.pageviews; // Display pageviews to user
            })
            .catch(error => {
                console.log(error)
                pageviewsCount.textContent = "Cannot fetch pageviews ☹️"
            });
        counterUpdated = true;
    }

}