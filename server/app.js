const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');

app.use(cors()); // Prevents CORS error

app.get('/', (req, res) => {
    res.send('<html><body>Node Server</body></html>');
  });


app.get('/api', function(req, res) {

    if (req.url === '/favicon.ico') {
        res.end();
    } 
    // Ends request for favicon without counting

    const json = fs.readFileSync('count.json', 'utf-8');
    const obj = JSON.parse(json);
    // Reads count.json and converts to JS object

    obj.pageviews = obj.pageviews+1;
    console.log("Pageviews:", obj.pageviews)

    // Updates pageviews and visits (conditional upon URL param value)

    const newJSON = JSON.stringify(obj);
    // Converts result to JSON

    fs.writeFileSync('count.json', newJSON);
    res.send(newJSON);
    // Writes result to file and sends to user as JSON

})
var port = 3000;
app.listen(port, () => {
    console.log("Server running on port:", port);
})