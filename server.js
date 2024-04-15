const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
    'https://boysclubhq.com',
    'https://www.boysclubhq.com'
];

app.use(cors({
    origin: function (origin, callback) {
        // Log the origin for debugging
        console.log("Origin of request: " + origin);
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true, // Enables credentials such as cookies, authorization headers, etc.
    optionsSuccessStatus: 200 // For legacy browser support
}));

// Additional explicit headers set for all responses
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", allowedOrigins.join(", "));
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

// API route for CoinGecko market cap
app.get('/api/coingecko/marketcap', async (req, res) => {
    const coinIds = req.query.ids;
    if (!coinIds) {
        return res.status(400).send("No coin IDs provided");
    }

    const url = 'https://api.coingecko.com/api/v3/coins/markets';
    try {
        const response = await axios.get(url, {
            params: {
                vs_currency: 'usd',
                ids: coinIds
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching market caps from CoinGecko:', error);
        res.status(500).send('Failed to fetch market caps from CoinGecko');
    }
});

app.use(express.static(path.join(__dirname, '..', 'build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
