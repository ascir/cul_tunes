const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const logger = require('morgan');
const router = express.Router();

router.use(logger('tiny'));
require('dotenv').config();

app.use(cors()); // Prevents CORS error

app.use(express.static('public'));

app.get('/api/page-views', function (req, res) {

    if (req.url === '/favicon.ico') {
        res.end();
    }
    // Ends request for favicon without counting

    const json = fs.readFileSync('count.json', 'utf-8');
    const obj = JSON.parse(json);
    // Reads count.json and converts to JS object

    obj.pageviews = obj.pageviews + 1;
    console.log("Pageviews:", obj.pageviews)

    // Updates pageviews and visits (conditional upon URL param value)

    const newJSON = JSON.stringify(obj);
    // Converts result to JSON

    fs.writeFileSync('count.json', newJSON);
    res.send(newJSON);
    // Writes result to file and sends to user as JSON

})

app.get('/api/cook-and-play', async (req, res) => {
    try {
        const dish = req.query.dish;
        const recipesWithAlbums = await getRecipesFromDish(dish);
        res.json({ recipesWithAlbums });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/explore', async (req, res) => {
    try {
        const area = req.query.area;

        const recipes = await getRecipesByArea(area);
        const albums = await getAlbumsFromTag(area, 8);

        const combinedData = {
            recipes,
            albums,
        };

        res.json({ combinedData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function getAlbumsFromTag(area, count) {
    return new Promise((resolve, reject) => {
        const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?format=json&method=tag.gettopalbums&limit=20&tag=${area}&api_key=${process.env.LASTFM_API_KEY}`;

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

                    // Select 'count' number of albums
                    const selectedAlbums = albums.slice(0, count).map(album => ({
                        name: album.name,
                        url: album.url,
                        artist: album.artist.name,
                        image: album.image.find(img => img.size === 'medium')['#text']
                    }));

                    resolve(selectedAlbums);
                } catch (error) {
                    console.error('Error parsing Last.fm API response:', error);
                    reject([]);
                }
            });
        }).on('error', (error) => {
            console.error('Error making request to Last.fm API:', error);
            reject([]);
        });
    });
}

function getRecipesFromDish(dish) {
    return new Promise((resolve, reject) => {
        const mealDbUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${dish}`;

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
                        const recipesWithAlbums = [];
                        let processedCount = 0;

                        meals.forEach(meal => {
                            const area = meal.strArea;

                            // Using the modified getAlbumsFromTag that returns a Promise
                            getAlbumsFromTag(area, 4)
                                .then(albums => {
                                    meal.albums = albums;
                                    recipesWithAlbums.push(meal);

                                    // Check if all recipes have been processed
                                    processedCount++;
                                    if (processedCount === meals.length) {
                                        const finalRecipes = recipesWithAlbums.map((recipe) => ({
                                            meal: recipe.strMeal,
                                            thumbnail: recipe.strMealThumb,
                                            instructions: recipe.strInstructions,
                                            youtube: recipe.strYoutube,
                                            albums: recipe.albums,
                                        }));
                                        // Resolve with the final response
                                        resolve(finalRecipes);
                                    }
                                })
                                .catch(error => {
                                    // Handle error in getting albums
                                    console.error('Error getting albums:', error);
                                    reject(error);
                                });
                        });
                    } else {
                        const error = new Error('No meals found in TheMealDB response.');
                        console.error(error);
                        reject(error);
                    }
                } catch (error) {
                    console.error('Error parsing TheMealDB API response:', error);
                    reject(error);
                }
            });
        }).on('error', (error) => {
            console.error('Error making request to TheMealDB API:', error);
            reject(error);
        });
    });
}

function getRecipesByArea(area) {
    return new Promise((resolve, reject) => {
        const mealDbUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`;

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
                        const recipes = meals.map((recipe) => ({
                            meal: recipe.strMeal,
                            thumbnail: recipe.strMealThumb,
                        }));
                        resolve(recipes);
                    } else {
                        const error = new Error('No meals found in TheMealDB response.');
                        console.error(error);
                        reject(error);
                    }
                } catch (error) {
                    console.error('Error parsing TheMealDB API response:', error);
                    reject(error);
                }
            });
        }).on('error', (error) => {
            console.error('Error making request to TheMealDB API:', error);
            reject(error);
        });
    });
}

var port = 3000;
app.listen(port, () => {
    console.log("Server running on port:", port);
})