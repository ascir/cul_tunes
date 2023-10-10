
const pageviewsCount = document.getElementById('pageviews-count');
var dish = document.getElementById("dish");
var submitDishBtn = document.getElementById("submitDishBtn");
var submitCuisineBtn = document.getElementById("submitCuisineBtn");
const resultsContainer = document.getElementById("results");
const modal = document.getElementById('recipeModal');
const modalInstructions = document.getElementById('recipeInstructions');
const modalYoutubeLink = document.getElementById('recipeYoutubeLink');
const loadingSpinner = document.querySelector('.spinner-border');

let counterUpdated = false;
updateCounter();


function updateCounter() {
    if (!counterUpdated) {
        fetch('/api/page-views') // Dynamic request with URL parameter
            .then(res => {
                if (res.status === 200) {
                    return res.json();
                } else {
                    pageviewsCount.textContent = '92';
                    throw new Error("API request failed");
                }
            })
            .then(data => {
                pageviewsCount.textContent = data.pageviews; // Display pageviews to user
            })
            .catch(error => {
                console.log(error)
                pageviewsCount.textContent = '92'
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
                PopulateApi1(data);
            })
            .catch(error => {
                console.log(error);
                resultsContainer.innerHTML = '<h4>No recipes found ☹️</h4>';
            });
    }
}

function submitCuisine() {
    userInput = cuisine.value.trim();
    if (userInput == "--- Choose your Mood ---") {
        alert("Please choose an option.");
    }
    else {
        resultsContainer.innerHTML = ''; 

        fetch(`/api/explore/?area=${userInput}`)
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error("API request failed");
                }
            })
            .then(data => {
                PopulateApi2(data);
            })
            .catch(error => {
                console.log(error);
                resultsContainer.innerHTML = '<h4>No matches found ☹️</h4>';
            });
    }
}

async function PopulateApi1(responseData) {
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
        const recipeCard = api1RecipeCard(data);
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

async function PopulateApi2(responseData) {
    // Remove loading spinner
    if (loadingSpinner) {
        loadingSpinner.remove();
    }

    // Create a jumbotron for recipes
    const recipesJumbotron = document.createElement('div');
    recipesJumbotron.classList.add('jumbotron');

    const recipesTitle = document.createElement('h3');
    recipesTitle.textContent = 'Recipes';
    recipesJumbotron.appendChild(recipesTitle);

    // Create a jumbotron for albums
    const albumsJumbotron = document.createElement('div');
    albumsJumbotron.classList.add('jumbotron');

    const albumsTitle = document.createElement('h3');
    albumsTitle.textContent = 'Music';
    albumsJumbotron.appendChild(albumsTitle);

    // Create rows for recipes and albums
    const recipesRow = document.createElement('div');
    recipesRow.classList.add('row');

    const albumsRow = document.createElement('div');
    albumsRow.classList.add('row');

    responseData.combinedData.recipes.forEach((recipe) => {
        // Create and append recipe card
        const recipeCard = api2RecipeCard(recipe);
        recipesRow.appendChild(recipeCard);
    });

    responseData.combinedData.albums.forEach((album) => {
        // Create and append album card
        const albumCard = createAlbumCard(album);
        albumsRow.appendChild(albumCard);
    });
    
    // Append rows to jumbotrons
    recipesJumbotron.appendChild(recipesRow);
    albumsJumbotron.appendChild(albumsRow);
    
    const recipesFooter = document.createElement('footer');
    recipesFooter.textContent = 'If you want detailed instructions, enter the recipe of your choice into the input box';
    recipesJumbotron.appendChild(recipesFooter);

    // Append jumbotrons to the results container
    resultsContainer.appendChild(recipesJumbotron);
    resultsContainer.appendChild(albumsJumbotron);
}

function api1RecipeCard(recipe) {
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

function api2RecipeCard(recipe) {
    const card = document.createElement('div');
    card.classList.add('col-md-6', 'mb-3');
    card.innerHTML = `
        <div class="card">
            <img src="${recipe.thumbnail}" class="card-img-top" alt="${recipe.meal} width="100" height="100">
            <div class="card-body">
                <p class="card-title">${recipe.meal}</p>
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
            <img src="${album.image}" class="card-img-top" alt="${album.name} width="50" height="50"">
            <div class="card-body">
                <h4 class="card-title">${album.name}</h4>
                <h5 class="card-text">${album.artist}</h5>
                <a href="${album.url}" class="btn btn-primary" target="_blank">Listen Now</a>
            </div>
        </div>
    `;
    return card;
}

