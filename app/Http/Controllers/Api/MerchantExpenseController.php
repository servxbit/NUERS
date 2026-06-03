<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class MerchantExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless(Schema::hasTable('merchant_expenses'), 500, 'merchant_expenses table is not migrated.');

        $merchant = $this->resolveMerchant($request);
        $this->syncFromTaxIntelligence($merchant);

        $query = $this->expenseQuery($merchant);
        $filtered = $this->applyFilters(clone $query, $request);
        $rows = $filtered
            ->orderByRaw('COALESCE(issued_at, created_at) DESC')
            ->limit(250)
            ->get()
            ->map(fn ($row) => $this->expensePayload($row))
            ->values();

        return response()->json([
            'merchant' => $merchant ? [
                'id' => $merchant->id,
                'business_name' => $merchant->business_name,
                'tin' => $merchant->tin,
            ] : null,
            'summary' => $this->summary(clone $query),
            'series' => [
                'monthly' => $this->monthlySeries(clone $query),
                'categories' => $this->categorySeries(clone $query),
            ],
            'filters' => [
                'categories' => $this->distinctOptions(clone $query, 'expense_category'),
                'statuses' => $this->distinctOptions(clone $query, 'validation_status'),
                'suppliers' => $this->distinctOptions(clone $query, 'supplier_name'),
            ],
            'expenses' => $rows,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless(Schema::hasTable('merchant_expenses'), 500, 'merchant_expenses table is not migrated.');

        $merchant = $this->resolveMerchant($request);
        abort_unless($merchant, 422, 'No merchant account is available for this expense.');

        $payload = $request->validate([
            'source_invoice_reference' => ['required', 'string', 'max:120'],
            'purchase_order_reference' => ['nullable', 'string', 'max:120'],
            'supplier_name' => ['required', 'string', 'max:255'],
            'supplier_tin' => ['nullable', 'string', 'max:50'],
            'expense_category' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'gross_amount' => ['required', 'numeric', 'min:0'],
            'vatable_amount' => ['nullable', 'numeric', 'min:0'],
            'input_vat_amount' => ['nullable', 'numeric', 'min:0'],
            'withholding_tax_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', 'string', 'max:60'],
            'validation_status' => ['nullable', 'string', 'max:60'],
            'reconciliation_status' => ['nullable', 'string', 'max:60'],
            'claim_status' => ['nullable', 'string', 'max:60'],
            'risk_level' => ['nullable', 'string', 'max:60'],
            'issued_at' => ['nullable', 'date'],
            'due_at' => ['nullable', 'date'],
        ]);

        $gross = (float) $payload['gross_amount'];
        $vatable = (float) ($payload['vatable_amount'] ?? max(0, round($gross / 1.12, 2)));
        $inputVat = (float) ($payload['input_vat_amount'] ?? max(0, round($gross - $vatable, 2)));
        $withholding = (float) ($payload['withholding_tax_amount'] ?? 0);
        $now = now();

        DB::table('merchant_expenses')->updateOrInsert(
            [
                'source_invoice_reference' => $payload['source_invoice_reference'],
                'buyer_tin' => $merchant->tin,
            ],
            [
                'id' => $this->expenseId($payload['source_invoice_reference'], $merchant->tin),
                'merchant_id' => $merchant->id,
                'supplier_merchant_id' => $this->supplierMerchantId($payload['supplier_tin'] ?? null),
                'purchase_order_reference' => $payload['purchase_order_reference'] ?? null,
                'supplier_name' => $payload['supplier_name'],
                'supplier_tin' => $payload['supplier_tin'] ?? null,
                'buyer_name' => $merchant->business_name,
                'buyer_tin' => $merchant->tin,
                'expense_category' => $payload['expense_category'],
                'description' => $payload['description'] ?? null,
                'gross_amount' => $gross,
                'vatable_amount' => $vatable,
                'input_vat_amount' => $inputVat,
                'withholding_tax_amount' => $withholding,
                'net_payable' => max(0, $gross - $withholding),
                'document_type' => 'b2b_invoice',
                'payment_status' => $payload['payment_status'] ?? 'unpaid',
                'validation_status' => $payload['validation_status'] ?? 'pending_validation',
                'reconciliation_status' => $payload['reconciliation_status'] ?? 'pending',
                'claim_status' => $payload['claim_status'] ?? 'pending_validation',
                'risk_level' => $payload['risk_level'] ?? 'Medium',
                'ai_score' => 70,
                'issued_at' => ! empty($payload['issued_at']) ? Carbon::parse($payload['issued_at']) : $now,
                'due_at' => ! empty($payload['due_at']) ? Carbon::parse($payload['due_at']) : null,
                'metadata' => json_encode([
                    'source' => 'manual_merchant_expense_entry',
                    'capture_rule' => 'Supplier-issued B2B invoice recorded as buyer expense',
                ]),
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );

        return $this->index($request);
    }

    private function resolveMerchant(Request $request): ?object
    {
        $token = $request->bearerToken();

        if ($token && Schema::hasTable('users')) {
            $user = DB::table('users')->where('api_token', $token)->first();

            if ($user && Schema::hasTable('merchants')) {
                $merchant = DB::table('merchants')
                    ->where('merchant_account_id', $user->id)
                    ->orWhere('merchant_account_email', $user->email)
                    ->first();

                if ($merchant) {
                    return $merchant;
                }
            }
        }

        if (! Schema::hasTable('merchants')) {
            return null;
        }

        if (Schema::hasTable('tax_intelligence_records')) {
            $partyName = DB::table('tax_intelligence_records')
                ->where('scope', 'merchant')
                ->whereIn('record_type', ['invoice_matches', 'purchase_ledger'])
                ->whereNotNull('party_name')
                ->where('party_name', '!=', '')
                ->orderBy('sort_order')
                ->value('party_name');

            if ($partyName) {
                $merchant = DB::table('merchants')->where('business_name', $partyName)->first();

                if ($merchant) {
                    return $merchant;
                }
            }
        }

        return DB::table('merchants')->orderByDesc('status')->orderBy('business_name')->first();
    }

    private function expenseQuery(?object $merchant): Builder
    {
        $query = DB::table('merchant_expenses');

        if ($merchant) {
            $query->where('merchant_id', $merchant->id);
        }

        return $query;
    }

    private function applyFilters(Builder $query, Request $request): Builder
    {
        $search = trim((string) $request->query('search', ''));
        $category = (string) $request->query('category', 'all');
        $status = (string) $request->query('status', 'all');
        $supplier = (string) $request->query('supplier', 'all');

        if ($category !== 'all' && $category !== '') {
            $query->where('expense_category', $category);
        }

        if ($status !== 'all' && $status !== '') {
            $query->where('validation_status', $status);
        }

        if ($supplier !== 'all' && $supplier !== '') {
            $query->where('supplier_name', $supplier);
        }

        if ($search !== '') {
            $like = "%{$search}%";
            $query->where(function (Builder $inner) use ($like) {
                $inner
                    ->where('source_invoice_reference', 'like', $like)
                    ->orWhere('purchase_order_reference', 'like', $like)
                    ->orWhere('supplier_name', 'like', $like)
                    ->orWhere('supplier_tin', 'like', $like)
                    ->orWhere('expense_category', 'like', $like)
                    ->orWhere('description', 'like', $like);
            });
        }

        return $query;
    }

    private function syncFromTaxIntelligence(?object $merchant): void
    {
        if (! $merchant) {
            return;
        }

        $this->syncTaxIntelligenceExpenses($merchant);
        $this->syncReceiptExpenses($merchant);
        $this->syncTransactionExpenses($merchant);
        $this->syncEisPayloadExpenses($merchant);
    }

    private function syncTaxIntelligenceExpenses(object $merchant): void
    {
        if (! Schema::hasTable('tax_intelligence_records') || $this->normalizeTin($merchant->tin) === '') {
            return;
        }

        $records = DB::table('tax_intelligence_records')
            ->where('scope', 'merchant')
            ->whereIn('record_type', ['invoice_matches', 'purchase_ledger'])
            ->where('party_name', $merchant->business_name)
            ->orderBy('sort_order')
            ->get();

        $now = now();

        foreach ($records as $index => $record) {
            $metadata = json_decode($record->metadata ?? '{}', true) ?: [];
            $sourceInvoice = (string) ($metadata['seller_invoice'] ?? $record->reference);
            $purchaseOrder = (string) ($metadata['buyer_record'] ?? null);
            $vatable = (float) $record->amount;
            $inputVat = (float) $record->vat_amount;
            $withholding = (float) $record->withholding_amount;
            $gross = $vatable + $inputVat;
            $existingExpense = $this->expenseRecord($sourceInvoice, $merchant->tin);
            $issuedAt = $existingExpense?->issued_at
                ?: Carbon::parse($record->created_at ?? $now)->subDays($index + 2);
            $dueAt = $existingExpense?->due_at
                ?: Carbon::parse($issuedAt)->addDays(17);

            DB::table('merchant_expenses')->updateOrInsert(
                [
                    'source_invoice_reference' => $sourceInvoice,
                    'buyer_tin' => $merchant->tin,
                ],
                [
                    'id' => $existingExpense?->id ?: (string) Str::uuid(),
                    'merchant_id' => $merchant->id,
                    'supplier_merchant_id' => $this->supplierMerchantId($record->tin),
                    'purchase_order_reference' => $purchaseOrder !== '' ? $purchaseOrder : null,
                    'supplier_name' => $record->counterparty_name ?: 'Unregistered Supplier',
                    'supplier_tin' => $record->tin,
                    'buyer_name' => $merchant->business_name,
                    'buyer_tin' => $merchant->tin,
                    'expense_category' => (string) ($metadata['expense_category'] ?? $metadata['category'] ?? 'General'),
                    'description' => "Supplier-issued B2B invoice recorded as {$merchant->business_name} expense.",
                    'gross_amount' => $gross,
                    'vatable_amount' => $vatable,
                    'input_vat_amount' => $inputVat,
                    'withholding_tax_amount' => $withholding,
                    'net_payable' => max(0, $gross - $withholding),
                    'document_type' => 'b2b_invoice',
                    'payment_status' => in_array(strtolower((string) $record->status), ['matched', 'deductible', 'posted'], true) ? 'for_payment' : 'hold',
                    'validation_status' => $this->normalizeStatus((string) $record->status),
                    'reconciliation_status' => $this->normalizeStatus((string) $record->status),
                    'claim_status' => (string) ($metadata['claim_status'] ?? ($record->status === 'Matched' ? 'validated_input_vat' : 'pending_validation')),
                    'risk_level' => $record->risk_level,
                    'ai_score' => $record->score,
                    'issued_at' => $issuedAt,
                    'due_at' => $dueAt,
                    'metadata' => json_encode([
                        ...$metadata,
                        'source_record' => $record->reference,
                        'record_type' => $record->record_type,
                        'sync_rule' => 'tax_intelligence_records to merchant_expenses',
                    ]),
                    'created_at' => $existingExpense?->created_at ?: $now,
                    'updated_at' => $now,
                ],
            );
        }
    }

    private function syncReceiptExpenses(object $merchant): void
    {
        $merchantTin = $this->normalizeTin($merchant->tin);

        if (! Schema::hasTable('transaction_receipts') || $merchantTin === '') {
            return;
        }

        $rows = DB::table('transaction_receipts')
            ->whereRaw($this->normalizedTinSql('buyer_tin').' = ?', [$merchantTin])
            ->where(function (Builder $query) use ($merchant) {
                $query
                    ->whereNull('merchant_id')
                    ->orWhere('merchant_id', '!=', $merchant->id);
            })
            ->where(function (Builder $query) use ($merchantTin) {
                $query
                    ->whereNull('merchant_tin')
                    ->orWhereRaw($this->normalizedTinSql('merchant_tin').' != ?', [$merchantTin]);
            })
            ->orderByRaw('COALESCE(issued_at, created_at) DESC')
            ->limit(250)
            ->get();

        foreach ($rows as $row) {
            $sourceInvoice = (string) $row->receipt_number;
            $gross = (float) ($row->total_due ?: $row->gross_amount);
            $vatable = (float) $row->vatable_sales;
            $inputVat = (float) $row->vat_amount;
            $existingExpense = $this->expenseRecord($sourceInvoice, $merchant->tin);
            $now = now();

            DB::table('merchant_expenses')->updateOrInsert(
                [
                    'source_invoice_reference' => $sourceInvoice,
                    'buyer_tin' => $merchant->tin,
                ],
                [
                    'id' => $existingExpense?->id ?: (string) Str::uuid(),
                    'merchant_id' => $merchant->id,
                    'supplier_merchant_id' => $row->merchant_id ?: $this->supplierMerchantId($row->merchant_tin),
                    'purchase_order_reference' => null,
                    'supplier_name' => $row->merchant_name,
                    'supplier_tin' => $row->merchant_tin,
                    'buyer_name' => $row->buyer_name ?: $merchant->business_name,
                    'buyer_tin' => $merchant->tin,
                    'expense_category' => $this->categoryFromDocumentType((string) $row->receipt_type),
                    'description' => "Electronic receipt issued by {$row->merchant_name} to {$merchant->business_name}.",
                    'gross_amount' => $gross,
                    'vatable_amount' => $vatable,
                    'input_vat_amount' => $inputVat,
                    'withholding_tax_amount' => 0,
                    'net_payable' => $gross,
                    'document_type' => (string) $row->receipt_type,
                    'payment_status' => (string) ($row->status === 'issued' ? 'for_payment' : $row->status),
                    'validation_status' => (string) ($row->status === 'issued' ? 'matched' : $this->normalizeStatus((string) $row->status)),
                    'reconciliation_status' => 'matched',
                    'claim_status' => $inputVat > 0 ? 'validated_input_vat' : 'not_vatable',
                    'risk_level' => 'Low',
                    'ai_score' => 92,
                    'issued_at' => $row->issued_at,
                    'due_at' => null,
                    'metadata' => json_encode([
                        'source_table' => 'transaction_receipts',
                        'source_receipt_id' => $row->id,
                        'sync_rule' => 'buyer_tin receipt to merchant_expenses',
                    ]),
                    'created_at' => $existingExpense?->created_at ?: $now,
                    'updated_at' => $now,
                ],
            );
        }
    }

    private function syncEisPayloadExpenses(object $merchant): void
    {
        $merchantTin = $this->normalizeTin($merchant->tin);

        if (! Schema::hasTable('eis_invoice_payloads') || $merchantTin === '') {
            return;
        }

        $rows = DB::table('eis_invoice_payloads')
            ->orderByDesc('created_at')
            ->limit(500)
            ->get();

        foreach ($rows as $row) {
            $payload = json_decode($row->payload ?? '{}', true) ?: [];
            $buyerTin = $this->payloadFirst($payload, ['buyer_tin', 'customer_tin', 'buyer.tin', 'customer.tin', 'invoice.buyer.tin']);

            if ($this->normalizeTin($buyerTin) !== $merchantTin) {
                continue;
            }

            $supplierTin = $this->payloadFirst($payload, ['seller_tin', 'merchant_tin', 'supplier_tin', 'seller.tin', 'merchant.tin', 'invoice.seller.tin']);
            if ($this->normalizeTin($supplierTin) === $merchantTin || $row->merchant_id === $merchant->id) {
                continue;
            }

            $sourceInvoice = (string) ($row->invoice_number ?: $this->payloadFirst($payload, ['invoice_number', 'receipt_number', 'document_id', 'invoice.number']));
            if ($sourceInvoice === '') {
                continue;
            }

            $supplierName = $this->payloadFirst($payload, ['seller_name', 'merchant_name', 'supplier_name', 'seller.name', 'merchant.name', 'invoice.seller.name']) ?: 'NUERS Merchant Supplier';
            $gross = (float) ($this->payloadFirst($payload, ['gross_amount', 'total_due', 'total_amount', 'amount', 'invoice.total_amount']) ?: 0);
            $vatable = (float) ($this->payloadFirst($payload, ['vatable_sales', 'taxable_amount', 'vatable_amount', 'invoice.vatable_sales']) ?: max(0, round($gross / 1.12, 2)));
            $inputVat = (float) ($this->payloadFirst($payload, ['vat_amount', 'input_vat_amount', 'tax_amount', 'invoice.vat_amount']) ?: max(0, round($gross - $vatable, 2)));
            $withholding = (float) ($this->payloadFirst($payload, ['withholding_tax_amount', 'ewt_amount', 'cwt_amount', 'invoice.withholding_tax_amount']) ?: 0);
            $existingExpense = $this->expenseRecord($sourceInvoice, $merchant->tin);
            $now = now();

            DB::table('merchant_expenses')->updateOrInsert(
                [
                    'source_invoice_reference' => $sourceInvoice,
                    'buyer_tin' => $merchant->tin,
                ],
                [
                    'id' => $existingExpense?->id ?: (string) Str::uuid(),
                    'merchant_id' => $merchant->id,
                    'supplier_merchant_id' => $row->merchant_id ?: $this->supplierMerchantId($supplierTin),
                    'purchase_order_reference' => $this->payloadFirst($payload, ['purchase_order', 'purchase_order_reference', 'po_number', 'invoice.purchase_order']),
                    'supplier_name' => $supplierName,
                    'supplier_tin' => $supplierTin,
                    'buyer_name' => $this->payloadFirst($payload, ['buyer_name', 'customer_name', 'buyer.name', 'customer.name']) ?: $merchant->business_name,
                    'buyer_tin' => $merchant->tin,
                    'expense_category' => $this->categoryFromDocumentType((string) $row->document_type),
                    'description' => "BIR EIS payload issued by {$supplierName} to {$merchant->business_name}.",
                    'gross_amount' => $gross,
                    'vatable_amount' => $vatable,
                    'input_vat_amount' => $inputVat,
                    'withholding_tax_amount' => $withholding,
                    'net_payable' => max(0, $gross - $withholding),
                    'document_type' => (string) $row->document_type,
                    'payment_status' => 'for_payment',
                    'validation_status' => $this->normalizeStatus((string) $row->validation_status),
                    'reconciliation_status' => $row->validation_status === 'valid' ? 'matched' : 'pending',
                    'claim_status' => $inputVat > 0 ? 'validated_input_vat' : 'not_vatable',
                    'risk_level' => $row->validation_status === 'valid' ? 'Low' : 'Medium',
                    'ai_score' => $row->validation_status === 'valid' ? 94 : 72,
                    'issued_at' => $row->issue_date,
                    'due_at' => $row->due_at,
                    'metadata' => json_encode([
                        'source_table' => 'eis_invoice_payloads',
                        'source_payload_id' => $row->id,
                        'payload_hash' => $row->payload_hash,
                        'sync_rule' => 'buyer_tin EIS payload to merchant_expenses',
                    ]),
                    'created_at' => $existingExpense?->created_at ?: $now,
                    'updated_at' => $now,
                ],
            );
        }
    }

    private function syncTransactionExpenses(object $merchant): void
    {
        $merchantTin = $this->normalizeTin($merchant->tin);

        if (! Schema::hasTable('merchant_transactions') || $merchantTin === '') {
            return;
        }

        $query = DB::table('merchant_transactions')
            ->leftJoin('merchants as suppliers', 'merchant_transactions.merchant_id', '=', 'suppliers.id')
            ->whereRaw($this->normalizedTinSql('merchant_transactions.customer_tin').' = ?', [$merchantTin])
            ->where(function (Builder $query) use ($merchant) {
                $query
                    ->whereNull('merchant_transactions.merchant_id')
                    ->orWhere('merchant_transactions.merchant_id', '!=', $merchant->id);
            });

        if (Schema::hasTable('transaction_receipts')) {
            $query->leftJoin('transaction_receipts', 'transaction_receipts.transaction_id', '=', 'merchant_transactions.id');
        }

        $rows = $query
            ->orderByDesc('merchant_transactions.created_at')
            ->limit(250)
            ->select([
                'merchant_transactions.id',
                'merchant_transactions.transaction_ref',
                'merchant_transactions.amount',
                'merchant_transactions.vatable_sales',
                'merchant_transactions.vat_amount',
                'merchant_transactions.net_amount',
                'merchant_transactions.status',
                'merchant_transactions.transaction_type',
                'merchant_transactions.customer_name',
                'merchant_transactions.customer_tin',
                'merchant_transactions.created_at',
                'suppliers.id as supplier_merchant_id',
                'suppliers.business_name as supplier_name',
                'suppliers.tin as supplier_tin',
                ...(Schema::hasTable('transaction_receipts') ? [
                    'transaction_receipts.receipt_number',
                    'transaction_receipts.receipt_type',
                    'transaction_receipts.merchant_name as receipt_supplier_name',
                    'transaction_receipts.merchant_tin as receipt_supplier_tin',
                    'transaction_receipts.buyer_name as receipt_buyer_name',
                    'transaction_receipts.gross_amount as receipt_gross_amount',
                    'transaction_receipts.vatable_sales as receipt_vatable_sales',
                    'transaction_receipts.vat_amount as receipt_vat_amount',
                    'transaction_receipts.total_due as receipt_total_due',
                    'transaction_receipts.issued_at as receipt_issued_at',
                    'transaction_receipts.status as receipt_status',
                ] : []),
            ])
            ->get();

        foreach ($rows as $row) {
            $sourceInvoice = (string) (($row->receipt_number ?? null) ?: $row->transaction_ref);

            if ($sourceInvoice === '') {
                continue;
            }

            $supplierTin = ($row->receipt_supplier_tin ?? null) ?: $row->supplier_tin;

            if ($this->normalizeTin($supplierTin) === $merchantTin) {
                continue;
            }

            $gross = (float) (($row->receipt_total_due ?? null) ?: ($row->receipt_gross_amount ?? null) ?: $row->amount);
            $vatable = (float) (($row->receipt_vatable_sales ?? null) ?: $row->vatable_sales ?: max(0, round($gross / 1.12, 2)));
            $inputVat = (float) (($row->receipt_vat_amount ?? null) ?: $row->vat_amount ?: max(0, round($gross - $vatable, 2)));
            $status = (string) (($row->receipt_status ?? null) ?: $row->status ?: 'pending');
            $existingExpense = $this->expenseRecord($sourceInvoice, $merchant->tin);
            $now = now();

            DB::table('merchant_expenses')->updateOrInsert(
                [
                    'source_invoice_reference' => $sourceInvoice,
                    'buyer_tin' => $merchant->tin,
                ],
                [
                    'id' => $existingExpense?->id ?: (string) Str::uuid(),
                    'merchant_id' => $merchant->id,
                    'supplier_merchant_id' => $row->supplier_merchant_id,
                    'purchase_order_reference' => null,
                    'supplier_name' => ($row->receipt_supplier_name ?? null) ?: $row->supplier_name ?: 'Registered Supplier',
                    'supplier_tin' => $supplierTin,
                    'buyer_name' => ($row->receipt_buyer_name ?? null) ?: $row->customer_name ?: $merchant->business_name,
                    'buyer_tin' => $merchant->tin,
                    'expense_category' => $this->categoryFromDocumentType((string) (($row->receipt_type ?? null) ?: $row->transaction_type ?: 'b2b_receipt')),
                    'description' => "Seller-generated receipt matched to {$merchant->business_name} by buyer TIN.",
                    'gross_amount' => $gross,
                    'vatable_amount' => $vatable,
                    'input_vat_amount' => $inputVat,
                    'withholding_tax_amount' => 0,
                    'net_payable' => $gross,
                    'document_type' => (string) (($row->receipt_type ?? null) ?: 'b2b_receipt'),
                    'payment_status' => in_array(strtolower($status), ['issued', 'verified', 'completed', 'paid'], true) ? 'for_payment' : $this->normalizeStatus($status),
                    'validation_status' => in_array(strtolower($status), ['issued', 'verified', 'completed', 'paid'], true) ? 'matched' : $this->normalizeStatus($status),
                    'reconciliation_status' => 'matched',
                    'claim_status' => $inputVat > 0 ? 'validated_input_vat' : 'not_vatable',
                    'risk_level' => 'Low',
                    'ai_score' => 90,
                    'issued_at' => ($row->receipt_issued_at ?? null) ?: $row->created_at,
                    'due_at' => null,
                    'metadata' => json_encode([
                        'source_table' => 'merchant_transactions',
                        'source_transaction_id' => $row->id,
                        'customer_tin' => $row->customer_tin,
                        'sync_rule' => 'customer_tin transaction to merchant_expenses',
                    ]),
                    'created_at' => $existingExpense?->created_at ?: $now,
                    'updated_at' => $now,
                ],
            );
        }
    }

    private function summary(Builder $query): array
    {
        $totalRows = (clone $query)->count();
        $totals = (clone $query)->selectRaw('
            COALESCE(SUM(gross_amount), 0) as gross,
            COALESCE(SUM(input_vat_amount), 0) as input_vat,
            COALESCE(SUM(withholding_tax_amount), 0) as withholding,
            COALESCE(SUM(net_payable), 0) as net_payable
        ')->first();

        return [
            'total_expenses' => (float) ($totals?->gross ?? 0),
            'input_vat' => (float) ($totals?->input_vat ?? 0),
            'withholding_tax' => (float) ($totals?->withholding ?? 0),
            'net_payable' => (float) ($totals?->net_payable ?? 0),
            'expense_count' => $totalRows,
            'supplier_count' => (clone $query)->distinct('supplier_tin')->count('supplier_tin'),
            'pending_validation' => (clone $query)->whereIn('validation_status', ['pending', 'pending_validation', 'under_review', 'mismatch', 'bir_flagged'])->count(),
            'high_risk' => (clone $query)->whereIn('risk_level', ['High', 'Critical', 'Red'])->count(),
        ];
    }

    private function monthlySeries(Builder $query): array
    {
        $start = now()->copy()->subMonths(5)->startOfMonth();
        $rows = (clone $query)
            ->selectRaw("DATE_FORMAT(COALESCE(issued_at, created_at), '%Y-%m') as bucket, SUM(gross_amount) as gross, SUM(input_vat_amount) as input_vat, SUM(withholding_tax_amount) as withholding")
            ->whereRaw('COALESCE(issued_at, created_at) >= ?', [$start])
            ->groupBy('bucket')
            ->get()
            ->keyBy('bucket');

        $series = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->copy()->subMonths($i)->startOfMonth();
            $key = $date->format('Y-m');
            $row = $rows->get($key);

            $series[] = [
                'label' => $date->format('M'),
                'gross' => (float) ($row?->gross ?? 0),
                'input_vat' => (float) ($row?->input_vat ?? 0),
                'withholding' => (float) ($row?->withholding ?? 0),
            ];
        }

        return $series;
    }

    private function categorySeries(Builder $query): array
    {
        return (clone $query)
            ->selectRaw("expense_category as label, COUNT(*) as count, SUM(gross_amount) as amount")
            ->groupBy('expense_category')
            ->orderByDesc('amount')
            ->get()
            ->map(fn ($row) => [
                'label' => $row->label,
                'count' => (int) $row->count,
                'amount' => (float) $row->amount,
            ])
            ->values()
            ->toArray();
    }

    private function distinctOptions(Builder $query, string $column): array
    {
        $values = (clone $query)
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->distinct()
            ->orderBy($column)
            ->pluck($column)
            ->map(fn ($value) => (string) $value)
            ->values()
            ->all();

        return ['all', ...$values];
    }

    private function expensePayload(object $row): array
    {
        return [
            'id' => $row->id,
            'merchant_id' => $row->merchant_id,
            'supplier_merchant_id' => $row->supplier_merchant_id,
            'source_invoice_reference' => $row->source_invoice_reference,
            'purchase_order_reference' => $row->purchase_order_reference,
            'supplier_name' => $row->supplier_name,
            'supplier_tin' => $row->supplier_tin,
            'buyer_name' => $row->buyer_name,
            'buyer_tin' => $row->buyer_tin,
            'expense_category' => $row->expense_category,
            'description' => $row->description,
            'gross_amount' => (float) $row->gross_amount,
            'vatable_amount' => (float) $row->vatable_amount,
            'input_vat_amount' => (float) $row->input_vat_amount,
            'withholding_tax_amount' => (float) $row->withholding_tax_amount,
            'net_payable' => (float) $row->net_payable,
            'document_type' => $row->document_type,
            'payment_status' => $row->payment_status,
            'validation_status' => $row->validation_status,
            'reconciliation_status' => $row->reconciliation_status,
            'claim_status' => $row->claim_status,
            'risk_level' => $row->risk_level,
            'ai_score' => $row->ai_score === null ? null : (int) $row->ai_score,
            'issued_at' => $row->issued_at,
            'due_at' => $row->due_at,
            'paid_at' => $row->paid_at,
            'metadata' => json_decode($row->metadata ?? '{}', true) ?: [],
        ];
    }

    private function normalizeStatus(string $status): string
    {
        return Str::of($status)->lower()->replace([' ', '-'], '_')->toString();
    }

    private function expenseId(string $sourceInvoice, string $buyerTin): string
    {
        return $this->expenseRecord($sourceInvoice, $buyerTin)?->id ?: (string) Str::uuid();
    }

    private function expenseRecord(string $sourceInvoice, string $buyerTin): ?object
    {
        return DB::table('merchant_expenses')
            ->where('source_invoice_reference', $sourceInvoice)
            ->where('buyer_tin', $buyerTin)
            ->first(['id', 'issued_at', 'due_at', 'created_at']);
    }

    private function categoryFromDocumentType(string $documentType): string
    {
        $normalized = $this->normalizeStatus($documentType);

        return match (true) {
            str_contains($normalized, 'service') => 'Professional services',
            str_contains($normalized, 'purchase') => 'Inventory',
            str_contains($normalized, 'delivery') => 'Freight',
            str_contains($normalized, 'utility') => 'Utilities',
            default => 'Supplier Invoice',
        };
    }

    private function payloadFirst(array $payload, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = data_get($payload, $key);

            if ($value !== null && $value !== '') {
                return (string) $value;
            }
        }

        return null;
    }

    private function supplierMerchantId(?string $tin): ?string
    {
        $normalizedTin = $this->normalizeTin($tin);

        if ($normalizedTin === '' || ! Schema::hasTable('merchants')) {
            return null;
        }

        return DB::table('merchants')
            ->whereRaw($this->normalizedTinSql('tin').' = ?', [$normalizedTin])
            ->value('id');
    }

    private function normalizeTin(?string $tin): string
    {
        return preg_replace('/\D+/', '', (string) $tin) ?: '';
    }

    private function normalizedTinSql(string $column): string
    {
        return "REPLACE(REPLACE(REPLACE(REPLACE({$column}, '-', ''), ' ', ''), '.', ''), '/', '')";
    }
}
