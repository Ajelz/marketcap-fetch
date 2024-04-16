const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3001;

// MongoDB Connection using the properly formatted and URL-encoded URI
const username = 'ajelazzabi';
const password = encodeURIComponent('bY2aVmpV6nGwth8X');
const cluster = 'boysclubhq-marketcaps.rwblvmk.mongodb.net';
const dbName = 'MarketCapsDB';
const mongoURI = `mongodb+srv://${username}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority&appName=BoysClubHQ-Marketcaps`;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected successfully');
    printLatestMarketCap();  // Print the latest market cap data after successful connection
    setInterval(fetchAndSaveMarketCaps, 30 * 60 * 1000); // Fetch and save market caps every 30 minutes
}).catch(err => console.log('Failed to connect to MongoDB:', err));

// Market Cap Schema and Model
const MarketCapSchema = new mongoose.Schema({
    timestamp: Date,
    coins: [{
        id: String,
        marketCap: Number
    }]
});

const MarketCap = mongoose.model('MarketCap', MarketCapSchema);

// Define allowed origins
const allowedOrigins = ['https://boysclubhq.com'];

// CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

// Logging middleware
app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url} from ${req.headers.origin}`);
    next();
});

// Function to fetch and save market caps
async function fetchAndSaveMarketCaps() {
    const url = 'https://api.coingecko.com/api/v3/coins/markets';
    const coinIds = ['pepe', 'based-brett', 'andyerc', 'landwolf-on-avax', 'bird-dog-on-sol']; // example IDs
    try {
        const response = await axios.get(url, {
            params: {
                vs_currency: 'usd',
                ids: coinIds.join(',')
            }
        });

        const priceMultipliers = {
            'andyerc': 97500000,
            'landwolf-on-avax': 549999000000,
            'bird-dog-on-sol': 999890000
        };

        // Store in the database
        const newRecord = new MarketCap({
            timestamp: new Date(),
            coins: response.data.map(coin => ({
                id: coin.id,
                marketCap: priceMultipliers[coin.id] ? coin.current_price * priceMultipliers[coin.id] : coin.market_cap
            }))
        });
        await newRecord.save();

        console.log('Market cap data saved successfully');
    } catch (error) {
        console.error('Error fetching market caps from CoinGecko:', error);
    }
}

// API endpoint for market cap
app.get('/api/coingecko/marketcap', async (req, res) => {
    await fetchAndSaveMarketCaps();
    res.status(201).send('Market cap data fetched and saved successfully');
});

// New API endpoint to fetch the latest market cap data
app.get('/api/marketcap/latest', async (req, res) => {
    try {
        const latestMarketCap = await MarketCap.findOne().sort({ timestamp: -1 });
        if (!latestMarketCap) {
            return res.status(404).send('No market cap data found');
        }
        const orderedMarketCaps = [
            latestMarketCap.coins.find(coin => coin.id === 'pepe')?.marketCap,
            latestMarketCap.coins.find(coin => coin.id === 'based-brett')?.marketCap,
            latestMarketCap.coins.find(coin => coin.id === 'andyerc')?.marketCap,
            latestMarketCap.coins.find(coin => coin.id === 'landwolf-on-avax')?.marketCap,
            latestMarketCap.coins.find(coin => coin.id === 'bird-dog-on-sol')?.marketCap
        ].filter(mc => mc !== undefined);
        res.json(orderedMarketCaps);
    } catch (error) {
        console.error('Failed to fetch latest market cap:', error);
        res.status(500).send('Error retrieving market cap data');
    }
});

// Function to print the latest market cap data
async function printLatestMarketCap() {
    try {
        const latestMarketCap = await MarketCap.findOne().sort({ timestamp: -1 });
        if (latestMarketCap) {
            const orderedMarketCaps = [
                latestMarketCap.coins.find(coin => coin.id === 'pepe')?.marketCap,
                latestMarketCap.coins.find(coin => coin.id === 'based-brett')?.marketCap,
                latestMarketCap.coins.find(coin => coin.id === 'andyerc')?.marketCap,
                latestMarketCap.coins.find(coin => coin.id === 'landwolf-on-avax')?.marketCap,
                latestMarketCap.coins.find(coin => coin.id === 'bird-dog-on-sol')?.marketCap
            ].filter(mc => mc !== undefined);
            console.log('Latest Market Caps:', orderedMarketCaps.join(', '));
        } else {
            console.log('No market cap data found');
        }
    } catch (error) {
        console.error('Failed to print latest market cap:', error);
    }
}

// Static files and React routing
app.use(express.static(path.join(__dirname, '..', 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
