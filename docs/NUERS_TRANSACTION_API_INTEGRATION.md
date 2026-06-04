# NUERS Transaction API Integration Guide

This guide documents how an external POS, ERP, billing system, e-commerce
store, or accounting platform can send transaction data into NUERS.

## Current Live Endpoint

Use the live production API base URL:

```text
https://nuers.net/public/api
```

Transaction ingestion endpoint:

```text
POST https://nuers.net/public/api/integrations/transactions
```

If the live server is later configured with Laravel's `public` directory as the
web root, the equivalent endpoint will be:

```text
POST https://nuers.net/api/integrations/transactions
```

## Authentication

Use a merchant integration API key in the `X-NUERS-API-Key` header.

```http
X-NUERS-API-Key: nuers_live_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Accept: application/json
Content-Type: application/json
```

`Authorization: Bearer <integration_api_key>` is also accepted by the backend,
but `X-NUERS-API-Key` is the recommended integration header because it avoids
confusion with merchant portal session tokens.

API keys must be:

- `active`
- Scoped with `transactions:write`
- Within the configured daily rate limit
- Sent from an allowed IP address when `ip_whitelist` is configured

## Creating An Integration Key

From the NUERS merchant portal:

1. Sign in as the merchant Business Account.
2. Open `Merchant > API Keys`.
3. Create a `live` key for production or `sandbox` key for testing.
4. Enable at least `transactions:write`.
5. Copy the one-time `plain_key` immediately. NUERS only shows it once.
6. Store the key in the source system's secret manager, not in source code.

Recommended key naming:

```text
<System Name> - <Branch/Store> - <Environment>
```

Examples:

```text
Servxbit POS - Main Office - Live
Shopify Storefront - Cebu Branch - Live
SAP B1 - Head Office - Sandbox
```

## Request Body

Minimum successful payload:

```json
{
  "external_reference": "POS-20260603-000001",
  "gross_amount": 123.45,
  "tax_type": "vatable"
}
```

Recommended production payload:

```json
{
  "external_reference": "POS-20260603-000001",
  "source_system": "Servxbit POS",
  "channel": "pos",
  "transaction_type": "sale",
  "payment_method": "cash",
  "document_type": "sales_invoice",
  "gross_amount": 123.45,
  "tax_type": "vatable",
  "vat_rate": 12,
  "vat_inclusive": true,
  "customer_name": "Juan Dela Cruz",
  "customer_tin": "123-456-789-000",
  "branch_code": "MAIN",
  "branch_name": "Main Office",
  "branch_type": "main",
  "items": [
    {
      "description": "Retail sale",
      "quantity": 1,
      "unit_price": 123.45
    }
  ]
}
```

## Field Reference

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `external_reference` | Yes | string, max 120 | Unique transaction reference from the source system. Used for duplicate detection per merchant. |
| `source_system` | No | string, max 120 | POS, ERP, e-commerce, billing, or accounting system name. |
| `channel` | No | string, max 80 | Examples: `pos`, `api`, `ecommerce`, `billing`, `mobile_app`. |
| `transaction_type` | No | string, max 80 | Defaults to `sale`. Use values like `sale`, `payment`, `collection`, or `settlement`. |
| `payment_method` | No | string, max 80 | Defaults to `cash`. Examples: `cash`, `card`, `gcash`, `maya`, `bank_transfer`. |
| `document_type` | No | enum | See document types below. `sales_invoice` auto-resolves based on tax type. |
| `amount` | Conditional | number | Required when `gross_amount` is absent. |
| `gross_amount` | Conditional | number | Required when `amount` is absent. Recommended field for integrations. |
| `tax_type` | Yes | enum | `vatable`, `vat_exempt`, `zero_rated`, or `non_vat`. |
| `vat_rate` | No | number | Defaults to `12`. Must be from `0` to `100`. |
| `vat_inclusive` | No | boolean | Defaults to `true`. |
| `customer_name` | No | string, max 255 | Buyer/customer name. |
| `customer_tin` | No | string, max 80 | Buyer/customer TIN if available. |
| `branch` | No | string, max 255 | Legacy branch name field. Prefer `branch_name` and `branch_code`. |
| `branch_name` | No | string, max 255 | Human-readable branch name. |
| `branch_code` | No | string, max 80 | Normalized to uppercase letters/numbers/dashes. Defaults to key branch or `MAIN`. |
| `branch_type` | No | enum | `main` or `branch`. |
| `receipt_number` | No | string, max 120 | Optional source-provided receipt number. If absent, NUERS generates one. |
| `items` | No | array | Line items are stored as the receipt item payload. |

Accepted `document_type` values:

```text
vat_invoice
non_vat_invoice
vat_exempt_invoice
zero_rated_invoice
mixed_sales_invoice
payment_receipt
sales_invoice
official_receipt
```

Document type mapping:

| Input | NUERS result |
| --- | --- |
| `sales_invoice` + `vatable` | `vat_invoice`, BIR template `B1` |
| `sales_invoice` + `non_vat` | `non_vat_invoice`, BIR template `B2` |
| `sales_invoice` + `vat_exempt` | `vat_exempt_invoice`, BIR template `B3` |
| `sales_invoice` + `zero_rated` | `zero_rated_invoice`, BIR template `B4` |
| Mixed item tax types | `mixed_sales_invoice`, BIR template `B5` |
| `official_receipt` or payment/collection transaction | `payment_receipt`, BIR template `B6` |

## Successful Response

HTTP status:

```text
201 Created
```

Example:

```json
{
  "transaction_id": "429bd850-0318-437c-9fde-363d63ac6c66",
  "receipt_id": "f8b4b29f-5d1e-4b1e-9b58-31f456c4d89a",
  "receipt_number": "VI-20260603-WQEBLQC1",
  "merchant_id": "b17965a6-b371-4230-940d-15d18197daca",
  "branch": {
    "type": "main",
    "code": "MAIN",
    "name": "Main Office",
    "location": "Merchant registered address"
  },
  "document": {
    "document_type": "vat_invoice",
    "bir_template_code": "B1",
    "label": "B1 VAT Invoice"
  },
  "tax_classification": {
    "tax_type": "vatable",
    "vatable_sales": 110.22,
    "vat_exempt_sales": 0,
    "zero_rated_sales": 0,
    "vat_amount": 13.23,
    "gross_amount": 123.45
  }
}
```

NUERS creates both:

- A `merchant_transactions` record
- A linked `transaction_receipts` record with receipt type `api_transaction_receipt`

## Duplicate Handling

`external_reference` is idempotent per merchant.

If the same merchant sends the same `external_reference` again, NUERS returns
HTTP `200` instead of creating another ledger record:

```json
{
  "duplicate": true,
  "transaction_id": "existing-transaction-id",
  "message": "Transaction already exists for this Business Account."
}
```

Integrator rule:

- Treat HTTP `201` as newly inserted.
- Treat HTTP `200` with `duplicate: true` as already accepted.
- Do not retry with a different `external_reference` unless the source system is
  truly sending a separate transaction.

## Error Responses

| Status | Cause | Fix |
| --- | --- | --- |
| `401` | Missing or invalid API key | Send `X-NUERS-API-Key` with the full live/sandbox key. |
| `403` | Key inactive, revoked, missing scope, or IP not allowed | Activate key, add `transactions:write`, or update IP whitelist. |
| `422` | Validation failed | Check required fields, enum values, and numeric amounts. |
| `429` | Daily key rate limit exceeded | Increase key rate limit or retry next day. |
| `500` | Required database table not migrated | Server-side deployment/migration issue. |

## cURL Example

```bash
curl -X POST "https://nuers.net/public/api/integrations/transactions" \
  -H "X-NUERS-API-Key: nuers_live_sk_your_private_key" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "external_reference": "POS-20260603-000001",
    "source_system": "Servxbit POS",
    "channel": "pos",
    "transaction_type": "sale",
    "payment_method": "cash",
    "document_type": "sales_invoice",
    "gross_amount": 123.45,
    "tax_type": "vatable",
    "vat_rate": 12,
    "vat_inclusive": true,
    "customer_name": "Juan Dela Cruz",
    "customer_tin": "123-456-789-000",
    "branch_code": "MAIN",
    "branch_name": "Main Office",
    "branch_type": "main",
    "items": [
      {
        "description": "Retail sale",
        "quantity": 1,
        "unit_price": 123.45
      }
    ]
  }'
```

## JavaScript Example

```js
async function sendNuersTransaction(transaction) {
  const response = await fetch("https://nuers.net/public/api/integrations/transactions", {
    method: "POST",
    headers: {
      "X-NUERS-API-Key": process.env.NUERS_API_KEY,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transaction),
  });

  const data = await response.json();

  if (response.status === 201) {
    return { status: "inserted", data };
  }

  if (response.status === 200 && data.duplicate === true) {
    return { status: "duplicate", data };
  }

  throw new Error(`NUERS API error ${response.status}: ${JSON.stringify(data)}`);
}
```

## PHP Example

```php
function sendNuersTransaction(array $transaction): array
{
    $ch = curl_init('https://nuers.net/public/api/integrations/transactions');

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'X-NUERS-API-Key: '.getenv('NUERS_API_KEY'),
            'Accept: application/json',
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($transaction),
    ]);

    $body = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    $data = json_decode($body, true);

    if ($status === 201) {
        return ['status' => 'inserted', 'data' => $data];
    }

    if ($status === 200 && ($data['duplicate'] ?? false) === true) {
        return ['status' => 'duplicate', 'data' => $data];
    }

    throw new RuntimeException("NUERS API error {$status}: {$body}");
}
```

## Verification

For a Business Account user in the merchant portal:

- Open `Merchant > Transactions`
- Search by `external_reference`
- Confirm the row shows the expected amount, branch, channel, source system,
  document type, VAT amount, and receipt number

Merchant portal verification APIs are available for authenticated merchant
sessions:

```text
GET /public/api/merchant/transactions?search=<external_reference>
GET /public/api/merchant/receipts?search=<receipt_number>
```

These endpoints use the merchant portal session bearer token, not the
third-party integration key.

## Production Test Evidence

The repository already contains a prior live production test report:

```text
deployment/reports/NUERS_Live_API_Transaction_Test_Report.pdf
deployment/reports/NUERS_Live_API_Transaction_Test_Report.docx
```

That report records a successful June 3, 2026 live test against:

```text
POST https://nuers.net/public/api/integrations/transactions
```

Observed result from the report:

- HTTP `201 Created`
- `external_reference`: `CODEX-LIVE-API-TEST-B21DF9A8`
- Transaction inserted and found through merchant transaction lookup
- Receipt generated and found through merchant receipt lookup
- Temporary live API key revoked after verification

## Recommended Go-Live Checklist

- Use a dedicated API key per source system and branch.
- Keep production and sandbox keys separate.
- Store keys only in a secret manager or encrypted environment variable.
- Send a stable `external_reference` from the source system.
- Implement idempotent retry handling for HTTP/network failures.
- Log NUERS `transaction_id`, `receipt_id`, and `receipt_number` in the source
  system after successful insertion.
- Alert on repeated `401`, `403`, `422`, or `429` responses.
- Revoke unused or compromised keys immediately.
- For production smoke tests, mark records with a clear `source_system`, such as
  `codex_live_api_test`, and a reference prefix like `CODEX-LIVE-API-TEST-`.
