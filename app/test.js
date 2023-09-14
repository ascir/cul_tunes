const https = require('https');
require('dotenv').config();

// Function to make a request to Last.fm API for albums
function getAlbumsFromTag(area, callback) {
    const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?format=json&method=tag.gettopalbums&limit=15&tag=${area}&api_key=${process.env.LASTFM_API_KEY}`;

    https.get(lastFmUrl, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                const albums = jsonData.albums.album;
                
                // Shuffle the albums randomly
                for (let i = albums.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [albums[i], albums[j]] = [albums[j], albums[i]];
                }

                // Select the first 3 albums (randomly shuffled)
                const selectedAlbums = albums.slice(0, 3).map(album => ({
                    name: album.name,
                    url: album.url,
                    artist: album.artist.name,
                    image: album.image.find(img => img.size === 'medium')['#text']
                }));

                callback(selectedAlbums);
            } catch (error) {
                console.error('Error parsing Last.fm API response:', error);
                callback([]);
            }
        });
    }).on('error', (error) => {
        console.error('Error making request to Last.fm API:', error);
        callback([]);
    });
}

// Function to make a request to TheMealDB API and process recipes
function getRecipes() {
    const mealDbUrl = 'https://www.themealdb.com/api/json/v1/1/search.php?s=spaghetti'; // Replace with your query

    https.get(mealDbUrl, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                const meals = jsonData.meals;

                if (meals) {
                    var recipesWithAlbums = [];
                    let processedCount = 0;

                    meals.forEach(meal => {
                        const area = meal.strArea;

                        getAlbumsFromTag(area, (albums) => {
                            meal.albums = albums;
                            recipesWithAlbums.push(meal);

                            // Check if all recipes have been processed
                            processedCount++;
                            if (processedCount === meals.length) {
                                recipesWithAlbums = recipesWithAlbums.map((recipe) => ({
                                    meal: recipe.strMeal,
                                    thumbnail: recipe.strMealThumb,
                                    instructions: recipe.instructions,
                                    youtube: recipe.strYoutube,
                                    albums: recipe.albums,
                                  }));
                                // Send the final response with recipes and albums
                                console.log(JSON.stringify(recipesWithAlbums, null, 2));
                            }
                        });
                    });
                } else {
                    console.error('No meals found in TheMealDB response.');
                }
            } catch (error) {
                console.error('Error parsing TheMealDB API response:', error);
            }
        });
    }).on('error', (error) => {
        console.error('Error making request to TheMealDB API:', error);
    });
}

// Call the function to get recipes
getRecipes();
