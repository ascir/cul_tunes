
const pageviewsCount = document.getElementById('pageviews-count');
var dish = document.getElementById("dish");
var submitDishBtn = document.getElementById("submitDishBtn");
var submitCuisineBtn = document.getElementById("submitCuisineBtn");
const resultsContainer = document.getElementById("results");
const loadingSpinner = document.querySelector('.spinner-border');
const modal = document.getElementById('recipeModal');
const modalInstructions = document.getElementById('recipeInstructions');
const modalYoutubeLink = document.getElementById('recipeYoutubeLink');


let counterUpdated = false;
console.log(counterUpdated);
updateCounter();
console.log(counterUpdated);


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

function submitDish() {
    userInput = dish.value.trim();
    if (userInput == "") {
        alert("Please enter a dish or ingredient.");
    }
    else {
        resultsContainer.innerHTML = '';
        fetch(`/api/cook-and-play/?dish=${userInput}`)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error("API request failed");
                }
            })
            .then(data => {
                fetchDataAndPopulate(data);
            })
            .catch(error => {
                console.log(error);
                resultsContainer.innerHTML = '<h4>No recipes found ☹️</h4>';
            });
    }
}

function submitCuisine() {
    userInput = cuisine.value.trim();
    if (userInput == "--- Choose a Country ---") {
        alert("Please choose an option.");
    }
    else {
        alert("User chose: " + userInput)
    }
}

async function fetchDataAndPopulate(responseData) {
    // Remove loading spinner
    if (loadingSpinner) {
        loadingSpinner.remove();
    }

    responseData.recipesWithAlbums.forEach((data) => {
        // Create a new jumbotron for each group
        const jumbotron = document.createElement('div');
        jumbotron.classList.add('jumbotron');

        // Create a row for recipe and album cards
        const row = document.createElement('div');
        row.classList.add('row');

        // Create and append recipe card
        const recipeCard = createRecipeCard(data);
        row.appendChild(recipeCard);

        // Create and append album cards
        data.albums.forEach((album) => {
            const albumCard = createAlbumCard(album);
            row.appendChild(albumCard);
        });

        // Append the row to the jumbotron
        jumbotron.appendChild(row);

        // Append the jumbotron to the results container
        resultsContainer.appendChild(jumbotron);
    });

    // Add event listener to the "View Instructions" button
    const viewInstructionsButtons = document.querySelectorAll('[data-toggle="modal"]');
    viewInstructionsButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const instructions = button.getAttribute('data-instructions');
            const youtubeLink = button.getAttribute('data-youtube');
            modalInstructions.textContent = instructions;
            modalYoutubeLink.href = youtubeLink;
        });
    });
}

function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.classList.add('col-md-6', 'mb-3');
    card.innerHTML = `
        <div class="card">
            <img src="${recipe.thumbnail}" class="card-img-top" alt="${recipe.meal} width="500" height="500">
            <div class="card-body">
                <h3 class="card-title">${recipe.meal}</h3>
                <button class="btn btn-primary" data-toggle="modal" data-target="#recipeModal" data-instructions="${recipe.instructions}" data-youtube="${recipe.youtube}">View Instructions</button>
            </div>
        </div>
    `;
    return card;
}

// Function to create an album card
function createAlbumCard(album) {
    const card = document.createElement('div');
    card.classList.add('col-md-3', 'mb-3', 'album-card');
    card.innerHTML = `
        <div class="card">
            <img src="${album.image}" class="card-img-top" alt="${album.name}">
            <div class="card-body">
                <h4 class="card-title">${album.name}</h4>
                <h5 class="card-text">${album.artist}</h5>
                <a href="${album.url}" class="btn btn-primary" target="_blank">Listen Now</a>
            </div>
        </div>
    `;
    return card;
}

