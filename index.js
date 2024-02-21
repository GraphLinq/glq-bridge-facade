require('dotenv').config();
const express = require('express');
const redis = require('redis');

const app = express();
const port = process.env.PORT || 3000;

// Create Redis client
const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_PASSWORD,
    database: 0
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    await redisClient.connect();
})();

// Define a GET endpoint
app.get('/api/v1/bridge_requests', async (req, res) => {
    try {
        const value = await redisClient.get("public_view");
        if (value === null) {
            return res.status(404).send({ error: 'Key not found' });
        }
        // Attempt to parse the retrieved value as JSON
        try {
            const parsedValue = JSON.parse(value);
            if(req.query.addr != null) {
                res.json(parsedValue.filter(x => x.from == req.query.addr)); // Send the parsed JSON as the response
            }
            else {
                res.json(parsedValue); // Send the parsed JSON as the response
            }
        } catch (parseError) {
            // If parsing fails, send an error response
            console.error(parseError);
            res.status(500).send({ error: 'Failed to parse JSON from Redis' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error' });
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
