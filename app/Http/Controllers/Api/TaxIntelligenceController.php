<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TaxIntelligenceController extends Controller
{
    private const POSTED_TRANSACTION_STATUSES = ['completed', 'paid', 'issued', 'settled', 'verified'];
    private const POSTED_INVOICE_STATUSES = ['validated', 'sent', 'paid', 'partially_paid', 'overdue', 'issued'];
    private const CLAIMABLE_EXPENSE_STATUSES = ['available', 'matched', 'validated', 'valid', 'approved', 'claimed', 'validated_input_vat'];

    public function show(Request $request, string $scope): JsonResponse
    {
        $allowed = ['merchant', 'bir', 'super-admin'];
        abort_unless(in_array($scope, $allowed, true), 404, 'Unknown tax intelligence scope.');

        if ($scope === 'merchant') {
            return response()->json($this->merchantPayload($request));
        }

        return response()->json($this->storedPayload($scope));
    }

    private function storedPayload(string $scope): array
    {
        $kpis = DB::table('tax_intelligence_kpis')
            ->where('scope', $scope)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($row) => [
                'key' => $row->widget_key,
                'label' => $row->label,
                'value' => $row->value,
                'subtext' => $row->subtext,
                'icon' => $row->icon,
                'accent' => $row->accent,
            ])
            ->values();

        $series = DB::table('tax_intelligence_series_points')
            ->where('scope', $scope)
            ->orderBy('series_key')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('series_key')
            ->map(fn ($points) => $points->map(fn ($row) => [
                'label' => $row->label,
                ...((array) json_decode($row->values, true)),
            ])->values())
            ->toArray();

        $records = DB::table('tax_intelligence_records')
            ->where('scope', $scope)
            ->orderBy('record_type')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('record_type')
            ->map(fn ($items) => $items->map(fn ($row) => [
                'reference' => $row->reference,
                'party_name' => $row->party_name,
                'counterparty_name' => $row->counterparty_name,
                'tin' => $row->tin,
                'amount' => (float) $row->amount,
                'vat_amount' => (float) $row->vat_amount,
                'withholding_amount' => (float) $row->withholding_amount,
                'status' => $row->status,
                'risk_level' => $row->risk_level,
                'score' => $row->score === null ? null : (int) $row->score,
                'metadata' => json_decode($row->metadata ?? '{}', true) ?: [],
            ])->values())
            ->toArray();

        $graph = DB::table('tax_graph_edges')
            ->where('scope', $scope)
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($row) => [
                'source' => $row->source,
                'target' => $row->target,
                'relationship' => $row->relationship,
                'risk_level' => $row->risk_level,
                'volume' => (float) $row->volume,
                'metadata' => json_decode($row->metadata ?? '{}', true) ?: [],
            ])
            ->values();

        return [
            'scope' => $scope,
            'kpis' => $kpis,
            'series' => $series,
            'records' => $records,
            'graph' => $graph,
        ];
    }

    private function merchantPayload(Request $request): array
    {
        $merchant = $this->currentMerchant($request);
        $monthly = $this->merchantMonthlyTaxSeries($merchant);
        $outputVat = array_sum(array_column($monthly, 'output_vat'));
        $inputVat = array_sum(array_column($monthly, 'input_vat'));
        $vatPayable = max(0, $outputVat - $inputVat);
        $vatReceivable = max(0, $inputVat - $outputVat);

        $salesInvoiceCount = $this->salesInvoices($merchant)->count();
        $purchaseInvoiceCount = $this->expenses($merchant)->count();
        $ewtWithheld = (float) $this->salesInvoices($merchant)
            ->whereIn('status', self::POSTED_INVOICE_STATUSES)
            ->sum('withholding_tax');
        $ewtReceivable = (float) $this->expenses($merchant)->sum('withholding_tax_amount');

        $expenseRows = $this->expenses($merchant)->get();
        $invoiceReferences = $this->salesInvoices($merchant)->pluck('invoice_number')->map(fn ($value) => (string) $value)->all();
        $matchedExpenses = $expenseRows->filter(fn ($row) => in_array((string) $row->source_invoice_reference, $invoiceReferences, true)
            || in_array(strtolower((string) ($row->reconciliation_status ?: '')), ['matched', 'reconciled', 'validated'], true));
        $mismatchedExpenses = $expenseRows->filter(fn ($row) => str_contains(strtolower((string) ($row->reconciliation_status ?: '')), 'mismatch'));
        $flaggedExpenses = $expenseRows->filter(fn ($row) => in_array(strtolower((string) ($row->risk_level ?: '')), ['high', 'critical', 'red'], true));
        $pendingExpenses = max(0, $expenseRows->count() - $matchedExpenses->count() - $mismatchedExpenses->count() - $flaggedExpenses->count());
        $reconciliationBase = max(1, $expenseRows->count());
        $reconciliationRate = $expenseRows->count() > 0 ? round(($matchedExpenses->count() / $reconciliationBase) * 100, 1) : 0.0;

        return [
            'scope' => 'merchant',
            'kpis' => [
                $this->kpi('total_sales_invoices', 'Total Sales Invoices', $this->compactNumber($salesInvoiceCount), 'Sales invoices issued by this Business Account', 'Receipt', 'border-l-primary'),
                $this->kpi('total_purchase_invoices', 'Total Purchase Invoices', $this->compactNumber($purchaseInvoiceCount), 'Supplier invoices captured for this account', 'FileText', 'border-l-chart-3'),
                $this->kpi('output_vat', 'Output VAT', $this->money($outputVat), 'From posted invoices and API transactions', 'TrendingUp', 'border-l-success'),
                $this->kpi('input_vat', 'Input VAT', $this->money($inputVat), 'Claimable B2B expense credits', 'Wallet', 'border-l-chart-2'),
                $this->kpi('vat_payable', 'VAT Payable', $this->money($vatPayable), 'Output VAT less input VAT', 'Landmark', 'border-l-warning'),
                $this->kpi('vat_receivable', 'VAT Receivable', $this->money($vatReceivable), 'Input VAT balance available for validation', 'ShieldCheck', 'border-l-success'),
                $this->kpi('ewt_withheld', 'EWT Withheld', $this->money($ewtWithheld), 'Withholding tax on sales invoices', 'ClipboardList', 'border-l-primary'),
                $this->kpi('ewt_receivable', 'EWT Receivable', $this->money($ewtReceivable), 'Creditable withholding from suppliers', 'CreditCard', 'border-l-success'),
                $this->kpi('compliance_score', 'BIR Compliance Score', $this->percent((float) ($merchant->compliance_score ?? 0)), 'From the linked business registry record', 'ShieldCheck', 'border-l-chart-4'),
                $this->kpi('unmatched_transactions', 'Unmatched Transactions', $this->compactNumber($pendingExpenses + $mismatchedExpenses->count() + $flaggedExpenses->count()), 'Expense invoices needing reconciliation review', 'AlertTriangle', 'border-l-destructive'),
                $this->kpi('reconciliation_status', 'Reconciliation Status', $this->percent($reconciliationRate), 'Seller and buyer records matched for this account', 'Activity', 'border-l-success'),
            ],
            'series' => [
                'vat_trend' => $monthly,
                'match_status' => $this->matchStatusSeries($matchedExpenses->count(), $pendingExpenses, $mismatchedExpenses->count(), $flaggedExpenses->count()),
            ],
            'records' => [
                'invoice_matches' => $this->invoiceMatchRecords($merchant),
                'supplier_compliance' => $this->supplierComplianceRecords($merchant),
            ],
            'graph' => $this->merchantGraph($merchant),
        ];
    }

    private function currentMerchant(Request $request): object
    {
        $token = $request->bearerToken();

        abort_unless($token && Schema::hasTable('users'), 401, 'Authenticated Business Account session is required.');

        $user = DB::table('users')->where('api_token', $token)->first();

        abort_unless($user, 401, 'Authenticated Business Account session is required.');
        abort_unless(Schema::hasTable('merchants'), 500, 'merchants table is not migrated.');

        $merchant = DB::table('merchants')
            ->where(function ($query) use ($user) {
                $query
                    ->where('merchant_account_id', $user->id)
                    ->orWhere('merchant_account_email', $user->email)
                    ->orWhere('email', $user->email);
            })
            ->orderByRaw(
                'CASE WHEN merchant_account_id = ? THEN 0 WHEN merchant_account_email = ? THEN 1 WHEN email = ? THEN 2 ELSE 3 END',
                [$user->id, $user->email, $user->email],
            )
            ->orderByDesc('updated_at')
            ->first();

        abort_unless($merchant, 404, 'No Business Account registry record is linked to this login.');

        return $merchant;
    }

    private function merchantMonthlyTaxSeries(object $merchant): array
    {
        $start = now()->copy()->subMonths(5)->startOfMonth();
        $monthly = [];

        for ($i = 5; $i >= 0; $i--) {
            $date = now()->copy()->subMonths($i)->startOfMonth();
            $monthly[$date->format('Y-n')] = [
                'label' => $date->format('M'),
                'output_vat' => 0.0,
                'input_vat' => 0.0,
                'vat_payable' => 0.0,
                'pending_remittance' => 0.0,
            ];
        }

        if (Schema::hasTable('merchant_transactions')) {
            DB::table('merchant_transactions')
                ->where('merchant_id', $merchant->id)
                ->where('created_at', '>=', $start)
                ->whereIn('status', self::POSTED_TRANSACTION_STATUSES)
                ->selectRaw('YEAR(created_at) as year_value, MONTH(created_at) as month_value, SUM(vat_amount) as output_vat')
                ->groupByRaw('YEAR(created_at), MONTH(created_at)')
                ->get()
                ->each(function ($row) use (&$monthly) {
                    $key = "{$row->year_value}-{$row->month_value}";
                    if (isset($monthly[$key])) {
                        $monthly[$key]['output_vat'] += (float) $row->output_vat;
                    }
                });
        }

        if (Schema::hasTable('business_invoices')) {
            DB::table('business_invoices')
                ->where('merchant_id', $merchant->id)
                ->whereIn('status', self::POSTED_INVOICE_STATUSES)
                ->whereRaw('COALESCE(issue_date, DATE(created_at)) >= ?', [$start->toDateString()])
                ->selectRaw('YEAR(COALESCE(issue_date, DATE(created_at))) as year_value, MONTH(COALESCE(issue_date, DATE(created_at))) as month_value, SUM(vat_amount) as output_vat')
                ->groupByRaw('YEAR(COALESCE(issue_date, DATE(created_at))), MONTH(COALESCE(issue_date, DATE(created_at)))')
                ->get()
                ->each(function ($row) use (&$monthly) {
                    $key = "{$row->year_value}-{$row->month_value}";
                    if (isset($monthly[$key])) {
                        $monthly[$key]['output_vat'] += (float) $row->output_vat;
                    }
                });
        }

        if (Schema::hasTable('merchant_expenses')) {
            DB::table('merchant_expenses')
                ->where('merchant_id', $merchant->id)
                ->whereRaw('COALESCE(issued_at, created_at) >= ?', [$start->toDateTimeString()])
                ->where(function ($query) {
                    $query
                        ->whereIn('claim_status', self::CLAIMABLE_EXPENSE_STATUSES)
                        ->orWhereIn('validation_status', self::CLAIMABLE_EXPENSE_STATUSES);
                })
                ->selectRaw('YEAR(COALESCE(issued_at, created_at)) as year_value, MONTH(COALESCE(issued_at, created_at)) as month_value, SUM(input_vat_amount) as input_vat')
                ->groupByRaw('YEAR(COALESCE(issued_at, created_at)), MONTH(COALESCE(issued_at, created_at))')
                ->get()
                ->each(function ($row) use (&$monthly) {
                    $key = "{$row->year_value}-{$row->month_value}";
                    if (isset($monthly[$key])) {
                        $monthly[$key]['input_vat'] += (float) $row->input_vat;
                    }
                });
        }

        return collect($monthly)->map(function (array $row) {
            $row['output_vat'] = round($row['output_vat'], 2);
            $row['input_vat'] = round($row['input_vat'], 2);
            $row['vat_payable'] = round(max(0, $row['output_vat'] - $row['input_vat']), 2);
            $row['pending_remittance'] = $row['vat_payable'];

            return $row;
        })->values()->toArray();
    }

    private function invoiceMatchRecords(object $merchant): array
    {
        $records = [];
        $invoiceReferences = $this->salesInvoices($merchant)->pluck('invoice_number')->map(fn ($value) => (string) $value)->all();

        $this->salesInvoices($merchant)
            ->orderByDesc(DB::raw('COALESCE(issue_date, DATE(created_at))'))
            ->limit(25)
            ->get()
            ->each(function ($row) use (&$records, $merchant) {
                $records[] = [
                    'reference' => (string) $row->invoice_number,
                    'party_name' => (string) ($row->merchant_name ?: $merchant->business_name),
                    'counterparty_name' => (string) ($row->buyer_name ?: 'Buyer'),
                    'tin' => $row->buyer_tin,
                    'amount' => (float) $row->total_amount,
                    'vat_amount' => (float) $row->vat_amount,
                    'withholding_amount' => (float) $row->withholding_tax,
                    'status' => $this->headline((string) $row->status),
                    'risk_level' => $this->riskFromStatus((string) $row->status),
                    'score' => $this->scoreFromStatus((string) $row->status),
                    'metadata' => [
                        'category' => $this->headline((string) ($row->document_type ?: 'sales_invoice')),
                        'source' => 'business_invoices',
                        'issued_at' => (string) ($row->issue_date ?: $row->created_at),
                    ],
                ];
            });

        $this->expenses($merchant)
            ->orderByDesc(DB::raw('COALESCE(issued_at, created_at)'))
            ->limit(25)
            ->get()
            ->each(function ($row) use (&$records, $invoiceReferences, $merchant) {
                $status = in_array((string) $row->source_invoice_reference, $invoiceReferences, true)
                    ? 'Matched'
                    : $this->headline((string) (($row->reconciliation_status ?: $row->claim_status) ?: 'pending'));

                $records[] = [
                    'reference' => (string) $row->source_invoice_reference,
                    'party_name' => (string) ($row->buyer_name ?: $merchant->business_name),
                    'counterparty_name' => (string) ($row->supplier_name ?: 'Supplier'),
                    'tin' => $row->supplier_tin,
                    'amount' => (float) $row->gross_amount,
                    'vat_amount' => (float) $row->input_vat_amount,
                    'withholding_amount' => (float) $row->withholding_tax_amount,
                    'status' => $status,
                    'risk_level' => $row->risk_level ?: $this->riskFromStatus($status),
                    'score' => $row->ai_score === null ? $this->scoreFromStatus($status) : (int) $row->ai_score,
                    'metadata' => [
                        'category' => $this->headline((string) ($row->expense_category ?: $row->document_type ?: 'purchase_invoice')),
                        'source' => 'merchant_expenses',
                        'issued_at' => (string) ($row->issued_at ?: $row->created_at),
                    ],
                ];
            });

        return collect($records)
            ->sortByDesc(fn ($row) => (string) ($row['metadata']['issued_at'] ?? ''))
            ->take(50)
            ->values()
            ->toArray();
    }

    private function supplierComplianceRecords(object $merchant): array
    {
        if (! Schema::hasTable('merchant_expenses')) {
            return [];
        }

        return $this->expenses($merchant)
            ->selectRaw("COALESCE(NULLIF(supplier_name, ''), 'Supplier') as supplier, COALESCE(NULLIF(supplier_tin, ''), 'No TIN') as tin, COUNT(*) as document_count, SUM(gross_amount) as amount, SUM(input_vat_amount) as vat_amount, SUM(withholding_tax_amount) as withholding_amount, AVG(COALESCE(ai_score, 88)) as avg_score, MAX(COALESCE(risk_level, 'low')) as risk_level")
            ->groupBy('supplier', 'tin')
            ->orderByDesc('amount')
            ->limit(12)
            ->get()
            ->map(fn ($row) => [
                'reference' => (string) $row->tin,
                'party_name' => (string) $row->supplier,
                'counterparty_name' => "{$this->compactNumber((int) $row->document_count)} purchase invoice records",
                'tin' => (string) $row->tin,
                'amount' => (float) $row->amount,
                'vat_amount' => (float) $row->vat_amount,
                'withholding_amount' => (float) $row->withholding_amount,
                'status' => 'Monitored',
                'risk_level' => $this->headline((string) $row->risk_level),
                'score' => (int) round((float) $row->avg_score),
                'metadata' => [
                    'category' => 'Supplier Compliance',
                    'document_count' => (int) $row->document_count,
                ],
            ])
            ->values()
            ->toArray();
    }

    private function merchantGraph(object $merchant): array
    {
        $edges = [];

        $this->salesInvoices($merchant)
            ->selectRaw("COALESCE(NULLIF(buyer_name, ''), 'Buyer') as counterparty, SUM(total_amount) as volume")
            ->groupBy('counterparty')
            ->orderByDesc('volume')
            ->limit(6)
            ->get()
            ->each(function ($row) use (&$edges, $merchant) {
                $edges[] = [
                    'source' => (string) $merchant->business_name,
                    'target' => (string) $row->counterparty,
                    'relationship' => 'Sales invoice',
                    'risk_level' => 'Low',
                    'volume' => (float) $row->volume,
                    'metadata' => ['source' => 'business_invoices'],
                ];
            });

        $this->expenses($merchant)
            ->selectRaw("COALESCE(NULLIF(supplier_name, ''), 'Supplier') as counterparty, SUM(gross_amount) as volume, MAX(COALESCE(risk_level, 'low')) as risk_level")
            ->groupBy('counterparty')
            ->orderByDesc('volume')
            ->limit(6)
            ->get()
            ->each(function ($row) use (&$edges, $merchant) {
                $edges[] = [
                    'source' => (string) $row->counterparty,
                    'target' => (string) $merchant->business_name,
                    'relationship' => 'Purchase invoice / input VAT',
                    'risk_level' => $this->headline((string) $row->risk_level),
                    'volume' => (float) $row->volume,
                    'metadata' => ['source' => 'merchant_expenses'],
                ];
            });

        return collect($edges)->sortByDesc('volume')->take(10)->values()->toArray();
    }

    private function matchStatusSeries(int $matched, int $pending, int $mismatch, int $flagged): array
    {
        $total = max(1, $matched + $pending + $mismatch + $flagged);

        return [
            ['label' => 'Matched', 'value' => round(($matched / $total) * 100, 1)],
            ['label' => 'Pending', 'value' => round(($pending / $total) * 100, 1)],
            ['label' => 'Mismatch', 'value' => round(($mismatch / $total) * 100, 1)],
            ['label' => 'BIR Flagged', 'value' => round(($flagged / $total) * 100, 1)],
        ];
    }

    private function salesInvoices(object $merchant)
    {
        if (! Schema::hasTable('business_invoices')) {
            return DB::table('business_invoices')->whereRaw('1 = 0');
        }

        return DB::table('business_invoices')->where('merchant_id', $merchant->id);
    }

    private function expenses(object $merchant)
    {
        if (! Schema::hasTable('merchant_expenses')) {
            return DB::table('merchant_expenses')->whereRaw('1 = 0');
        }

        return DB::table('merchant_expenses')->where('merchant_id', $merchant->id);
    }

    private function kpi(string $key, string $label, string $value, ?string $subtext, ?string $icon, ?string $accent): array
    {
        return compact('key', 'label', 'value', 'subtext', 'icon', 'accent');
    }

    private function money(float $amount): string
    {
        $absolute = abs($amount);

        if ($absolute >= 1_000_000_000) {
            return 'PHP '.number_format($amount / 1_000_000_000, 1).'B';
        }

        if ($absolute >= 1_000_000) {
            return 'PHP '.number_format($amount / 1_000_000, 2).'M';
        }

        return 'PHP '.number_format($amount, 2);
    }

    private function compactNumber(float|int $value): string
    {
        $absolute = abs((float) $value);

        if ($absolute >= 1_000_000_000) {
            return number_format($value / 1_000_000_000, 1).'B';
        }

        if ($absolute >= 1_000_000) {
            return number_format($value / 1_000_000, 1).'M';
        }

        if ($absolute >= 1_000) {
            return number_format($value / 1_000, 1).'K';
        }

        return number_format($value);
    }

    private function percent(float $value): string
    {
        return number_format($value, $value === floor($value) ? 0 : 1).'%';
    }

    private function headline(string $value): string
    {
        return str($value)->replace(['_', '-'], ' ')->headline()->toString();
    }

    private function riskFromStatus(string $status): string
    {
        $status = strtolower($status);

        if (str_contains($status, 'flag') || str_contains($status, 'critical') || str_contains($status, 'high')) {
            return 'High';
        }

        if (str_contains($status, 'mismatch') || str_contains($status, 'review') || str_contains($status, 'pending') || str_contains($status, 'draft')) {
            return 'Medium';
        }

        return 'Low';
    }

    private function scoreFromStatus(string $status): int
    {
        $risk = strtolower($this->riskFromStatus($status));

        return match ($risk) {
            'high' => 45,
            'medium' => 72,
            default => 96,
        };
    }
}
