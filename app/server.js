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

        // Construct the URL for the external API
        const themealdbUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${dish}`;

        // Make the request to the external API
        https.get(themealdbUrl, (response) => {
            let data = '';

            // Concatenate data chunks as they arrive
            response.on('data', (chunk) => {
                data += chunk;
            });

            // When all data has been received
            response.on('end', () => {
                try {
                    // Parse the JSON data
                    const jsonData = JSON.parse(data);

                    // Extract the required information from the response
                    const meals = jsonData.meals.map(meal => ({
                        strMeal: meal.strMeal,
                        strMealThumb: meal.strMealThumb,
                        strYoutube: meal.strYoutube,
                        strArea: meal.strArea,
                    }));


                } catch (error) {
                    console.error(error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        }).on('error', (error) => {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
        https.get(themealdbUrl, (response) => {
            let data = '';

            // Concatenate data chunks as they arrive
            response.on('data', (chunk) => {
                data += chunk;
            });

            // When all data has been received
            response.on('end', () => {
                try {
                    // Parse the JSON data
                    const jsonData = JSON.parse(data);

                    // Extract the required information from the response
                    const meals = jsonData.meals.map(meal => ({
                        strMeal: meal.strMeal,
                        strMealThumb: meal.strMealThumb,
                        strYoutube: meal.strYoutube,
                        strArea: meal.strArea,
                    }));


                } catch (error) {
                    console.error(error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        }).on('error', (error) => {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

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
                                return JSON.stringify(recipesWithAlbums, null, 2);
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

var port = 3000;
app.listen(port, () => {
    console.log("Server running on port:", port);
})