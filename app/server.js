const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const logger = require('morgan');
const AWS = require("aws-sdk");

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: "ap-southeast-2",
});

const bucketName = "cab432-anjana";
const objectKey = "count.json";

const s3 = new AWS.S3();

app.use(logger('tiny'));
require('dotenv').config();

app.use(cors()); // Prevents CORS error

app.use(express.static('public'));

app.get('/api/page-views', async function (req, res) {

    if (req.url === '/favicon.ico') {
        res.end();
    }
    // Ends request for favicon without counting
    try {
        const json = await getObjectFromS3();

        json.pageviews = json.pageviews + 1;
        res.send(json);

        await uploadJsonToS3(json)
    } catch (error) {
        console.error("S3 bucket error, trying again:", error);
        // If upload fails, try creating the bucket
        try {
            await createS3bucket();
            const json = {
                pageviews: 363
            };
            res.send(json);
        }
        catch (error) {
            console.log("Error:", error)
            res.status(500).json({ error: "S3 connection error" }); 
        }
    }

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

async function createS3bucket() {
    try {
        await s3.createBucket({ Bucket: bucketName }).promise();
        console.log(`Created bucket: ${bucketName}`);
    } catch (err) {
        if (err.statusCode === 409) {
            console.log(`Bucket already exists: ${bucketName}`);
        } else {
            console.log(`Error creating bucket: ${err}`);
        }
    }
}

// Upload the JSON data to S3
async function uploadJsonToS3(jsonData) {
    const params = {
        Bucket: bucketName,
        Key: objectKey,
        Body: JSON.stringify(jsonData), // Convert JSON to string
        ContentType: "application/json", // Set content type
    };

    try {
        await s3.putObject(params).promise();
        console.log("JSON file uploaded successfully.");
    } catch (err) {
        console.error("Error uploading JSON file:", err);
    }
}

// Retrieve the object from S3
async function getObjectFromS3() {
    const params = {
        Bucket: bucketName,
        Key: objectKey,
    };

    try {
        const data = await s3.getObject(params).promise();
        // Parse JSON content
        const parsedData = JSON.parse(data.Body.toString("utf-8"));
        console.log("Parsed JSON data:", parsedData);
        return parsedData;
    } catch (err) {
        console.error("Error:", err);
    }
}

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