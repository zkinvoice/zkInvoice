const express = require('express');
const cors = require('cors');
const path = require('path');
const { stat } = require('fs');
const { error } = require('console');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL;
const API_KEY = process.env.API;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database("./invoices.db", (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('connected to SQLite databse')
    }
})

db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        amount TEXT NOT NULL,
        payinAddress TEXT NOT NULL,
        recepientAddress TEXT NOT NULL,
        toCurrency TEXT NOT NULL,
        toNetwork TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        validUntil TEXT NOT NULL,
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

                db.run(
                    `UPDATE invoices SET status = ?, lastChecked = ?, payoutHash = ?, amountTo = ?, WHERE id = ?`,
                    [status.status, lastChecked, status.payoutHash || null, status.amountTo || null, row.id],
                    (err) => {
                        if (err) {
                            console.error('Database err:', err);
                        } else {
                            console.log(`Invoice ${row.id}: ${status.status}`)
                        }
                    }
                )
            }
        }
    })
}

setInterval(checkInvoice, 10000);

app.post('/api/createInvoice', async (req, res) => {
    const { amoount, toCurrency, toNetwork, address } = req.body;

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
                fromNetwork,
                fromAmount: amount.toString(),
                toAmount: "",
                address: address,
                extraID: "",
                refundAddress: "",
                refundExtraId: "",
                flow: "standart",
                type: "direct",
                rateID: ""
            })
        });
        const data = await response.json();

        if (!response.ok) {
            return res.status(400). json({ error: 'Failed to create invoice', details: data });
        }

        db.run(
            `INSERT INTO invoices (id, amount, payinAddress, recipientAddress, toCurrency, toNetwork, status, createdAt, validUntil)
            VALUES (?, ?, ? ,? ,?, ?, ?, ?)`
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
                return res.statusCode(500).json({erorr: 'Database error'});
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
        console.error('Error creating invoice:', error);
        res.status(500).json({ error: 'Internal server error '});
    }
})

app.get('/api/currencies', async (req, res) => {
    try {
        const response = await fetch(
        `${BASE_URL}/exchange/currencies?fromCurrency=zec&fromNetwork=zec&flow=standard`,
        {
            headers: { "x-changenow-api-key": API_KEY }
        }
        );
        if (!response.ok) {
            return res.status(400).json({ error: 'Failed to fetch currecies '})
        }

        const currencies = await response.json();
        console.log(currencies)
        res.json(currencies);

    } catch (error) {
        console.error('Error fetching currencies', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// PUMPFUN PUMPFUNPUMPFUN PUMPFUNPUMPFUN PUMPFUNPUMPFUN PUMPFUNPUMPFUN PUMPFUNPUMPFUN PUMPFUNPUMPFUN PUMPFUNPUMPFUN PUMPFUNPUMPFUN PUMPFUNPUMPFUN PUMPFUN