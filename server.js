const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL;
const API_KEY = process.env.API;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let currenciesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000;

const db = new sqlite3.Database("./invoices.db", (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('connected to SQLite database')
    }
})

db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        amount TEXT NOT NULL,
        payinAddress TEXT NOT NULL,
        recipientAddress TEXT NOT NULL,
        toCurrency TEXT NOT NULL,
        toNetwork TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        validUntil TEXT,
        lastChecked TEXT, 
        payoutHash TEXT,
        amountTo TEXT
)    
`)

async function checkSwapStatus(swapId) {
    const response = await fetch(
        `${BASE_URL}/exchange/by-id?id=${swapId}`,
        {
            headers: { "x-changenow-api-key": API_KEY }
        }
    );

    if (!response.ok) {
        return null;
    }

    return await response.json();
}

async function checkInvoice() {
    db.all(`SELECT id, status FROM invoices WHERE status NOT IN ('finished', 'failed', 'refunded', 'expired')`, async (err, rows) => {
        if (err) {
            console.error('Database query error:', err)
            return
        }

        for (const row of rows) {
            const status = await checkSwapStatus(row.id);

            if (status) {
                const lastChecked = new Date().toISOString();

                const finalStatus = status.status === 'confirming' ? 'finished' : status.status;

                db.run(
                    `UPDATE invoices SET status = ?, lastChecked = ?, payoutHash = ?, amountTo = ? WHERE id = ?`,
                    [finalStatus, lastChecked, status.payoutHash || null, status.amountTo || null, row.id],
                    (err) => {
                        if (err) {
                            console.error('Database err:', err);
                        } else {
                            console.log(`Invoice ${row.id}: ${finalStatus}`)
                        }
                    }
                )
            }
        }
    })
}

setInterval(checkInvoice, 10000);

app.post('/api/createInvoice', async (req, res) => {
    const { amount, toCurrency, toNetwork, address } = req.body;

    if (!amount || !toCurrency || !toNetwork || !address) {
        return res.status(400).json({ error: 'Missing required fields'});
    }

    try { 
        const response = await fetch(`${BASE_URL}/exchange`, {
            method: "POST",
            headers: {
                "x-changenow-api-key": API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fromCurrency: "zec",
                toCurrency: toCurrency,
                fromNetwork: "zec",
                fromAmount: amount.toString(),
                toAmount: "",
                address: address,
                extraID: "",
                refundAddress: "",
                refundExtraId: "",
                flow: "standard",
                type: "direct",
                rateID: ""
            })
        });
        
        const data = await response.json();

        if (!response.ok) {
            return res.status(400).json({ error: 'Failed to create invoice', details: data });
        }

        db.run(
            `INSERT INTO invoices (id, amount, payinAddress, recipientAddress, toCurrency, toNetwork, status, createdAt, validUntil)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.id,
                data.fromAmount,
                data.payinAddress,
                address,
                toCurrency,
                toNetwork,
                data.status || 'waiting',
                new Date().toISOString(),
                data.validUntil || null
            ],
            (err) => {
                if (err) {
                    console.error('Database insert failed:', err)
                    return res.status(500).json({error: 'Database error'});
                }

                res.json({
                    id: data.id,
                    payinAddress: data.payinAddress,
                    amount: data.fromAmount,
                    validUntil: data.validUntil
                })
            }
        )

    } catch(err) {
        console.error('Error creating invoice:', err);
        res.status(500).json({ error: 'Internal server error'});
    }
})

app.get('/api/invoice/:id', (req, res) => {
    const { id } = req.params;

    db.get(
        `SELECT id, amount, payinAddress, recipientAddress, toCurrency, toNetwork, status, createdAt, validUntil, payoutHash, amountTo 
        FROM invoices WHERE id = ?`,
        [id],
        (err, row) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Invoice not found' });
            }

            res.json({
                id: row.id,
                amount: row.amount,
                payinAddress: row.payinAddress,
                status: row.status,
                createdAt: row.createdAt,
                validUntil: row.validUntil,
                payoutHash: row.payoutHash,
                amountTo: row.amountTo
            });
        }
    );
});

app.get('/api/currencies', async (req, res) => {
    try {
        if (currenciesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
            return res.json(currenciesCache);
        }

        const response = await fetch(
            `${BASE_URL}/exchange/currencies?fromCurrency=zec&fromNetwork=zec&flow=standard`,
            {
                headers: { "x-changenow-api-key": API_KEY }
            }
        );
        
        if (!response.ok) {
            return res.status(400).json({ error: 'Failed to fetch currencies' })
        }

        const currencies = await response.json();
        
        currenciesCache = currencies;
        cacheTimestamp = Date.now();
        
        res.json(currencies);

    } catch (error) {
        console.error('Error fetching currencies', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/invoice/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'invoice.html'));
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});