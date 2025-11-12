# zkInvoice

**Privacy-first payment infrastructure for developers**

zkInvoice is a payment platform that enables developers to easily integrate cross-chain payment acceptance into their applications. Built on Zcash technology, it allows you to receive payments and settle them on any supported blockchain.

## Features

- **Simple Integration** - Clean API for accepting payments in your apps
- **Cross-Chain Settlement** - Receive payments and get funds on any available chain
- **Privacy-Focused** - Built on Zcash for enhanced transaction privacy
- **Developer-Friendly** - Designed for JavaScript developers

## API Reference

### Endpoints

{
  "amount": "1.5",
  "toCurrency": "eth",
  "toNetwork": "eth",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amount | string | Yes | Amount of ZEC to send |
| toCurrency | string | Yes | Target currency (e.g., eth, btc, usdt) |
| toNetwork | string | Yes | Target network (e.g., eth, bsc, trx) |
| address | string | Yes | Recipient wallet address |

**Success Response (200):**
```json
{
  "id": "88bec796a4dd21",
  "payinAddress": "t1XJJPFaA6jZjcBHv57sUKyDAx4k9UF8DBt",
  "amount": "1.5",
  "validUntil": "2025-11-12T16:53:23.635Z"
}
```

**Error Response (400):**
```json
{
  "error": "Missing required fields"
}
```

---

### 2. Get Invoice
Retrieves invoice information by ID.

**Endpoint:** `GET /api/invoice/:id`

**URL Parameters:**
- `id` - Invoice ID (e.g., `88bec796a4dd21`)

**Example Request:**
```
GET /api/invoice/88bec796a4dd21
```

**Success Response (200):**
```json
{
  "id": "88bec796a4dd21",
  "amount": "1.5",
  "payinAddress": "t1XJJPFaA6jZjcBHv57sUKyDAx4k9UF8DBt",
  "status": "waiting",
  "createdAt": "2025-11-12T15:53:23.635Z",
  "validUntil": "2025-11-12T16:53:23.635Z",
  "payoutHash": null,
  "amountTo": null
}
```

**Error Response (404):**
```json
{
  "error": "Invoice not found"
}
```

---

### 3. Get Available Currencies
Retrieves list of available currencies for exchange from ZEC.

**Endpoint:** `GET /api/currencies`

**Example Request:**
```
GET /api/currencies
```

**Success Response (200):**
```json
[
  {
    "ticker": "eth",
    "name": "Ethereum",
    "network": "eth",
    "image": "https://example.com/eth.png"
  },
  {
    "ticker": "btc",
    "name": "Bitcoin",
    "network": "btc",
    "image": "https://example.com/btc.png"
  }
]
```

**Note:** Response is cached for 1 hour.

---

## Invoice Status Flow

| Status | Description |
|--------|-------------|
| `waiting` | Waiting for payment |
| `confirming` | Payment received, confirming transaction |
| `finished` | Payment successfully completed |
| `failed` | Transaction failed |
| `expired` | Invoice expired |

**Note:** When status reaches `confirming`, it is automatically set to `finished` in the database.


### SDK

**SOON**

## Use Cases

- E-commerce checkout systems
- Subscription payment processing
- Peer-to-peer payment applications
- Cross-chain payment gateways
- Privacy-focused transactions

## Requirements

- Node.js 16+
- JavaScript/TypeScript

## Support

For questions and support, please visit our documentation or open an issue.

## License

MIT
