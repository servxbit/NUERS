<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RdoController extends Controller
{
    public function index(): JsonResponse
    {
        $offices = DB::table('rdo_offices')
            ->orderBy('rdo_code')
            ->get()
            ->map(fn ($office) => $this->officePayload($office));

        return response()->json(['data' => $offices]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'rdo_code' => ['required', 'string', 'max:20'],
            'rdo_name' => ['required', 'string', 'max:255'],
            'region' => ['required', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:255'],
            'office_address' => ['nullable', 'string'],
            'head_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:100'],
            'password' => ['nullable', 'string', 'min:6'],
            'coverage_area' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ]);

        $now = now();
        $userId = DB::table('rdo_offices')->where('rdo_code', $payload['rdo_code'])->value('user_id');

        if (!empty($payload['email']) && !empty($payload['password'])) {
            $existingUser = DB::table('users')->where('email', $payload['email'])->first();

            if ($existingUser) {
                $userId = $existingUser->id;
                DB::table('users')->where('id', $userId)->update([
                    'name' => $payload['head_name'] ?: $payload['rdo_name'],
                    'password' => Hash::make($payload['password']),
                    'updated_at' => $now,
                ]);
            } else {
                $userId = DB::table('users')->insertGetId([
                    'name' => $payload['head_name'] ?: $payload['rdo_name'],
                    'email' => $payload['email'],
                    'email_verified_at' => $now,
                    'password' => Hash::make($payload['password']),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('profiles')->updateOrInsert(
                ['id' => $userId],
                [
                    'email' => $payload['email'],
                    'role' => 'rdo',
                    'full_name' => $payload['head_name'] ?: $payload['rdo_name'],
                    'organization' => "{$payload['rdo_code']} - {$payload['rdo_name']}",
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
        }

        DB::table('rdo_offices')->updateOrInsert(
            ['rdo_code' => $payload['rdo_code']],
            [
                'id' => DB::table('rdo_offices')->where('rdo_code', $payload['rdo_code'])->value('id') ?: (string) Str::uuid(),
                'rdo_code' => $payload['rdo_code'],
                'rdo_name' => $payload['rdo_name'],
                'region' => $payload['region'],
                'city' => $payload['city'] ?? null,
                'office_address' => $payload['office_address'] ?? null,
                'head_name' => $payload['head_name'] ?? null,
                'email' => $payload['email'] ?? null,
                'phone' => $payload['phone'] ?? null,
                'user_id' => $userId,
                'status' => 'active',
                'coverage_area' => json_encode($payload['coverage_area'] ?? []),
                'notes' => $payload['notes'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );

        $office = DB::table('rdo_offices')->where('rdo_code', $payload['rdo_code'])->first();

        return response()->json([
            'success' => true,
            'office' => $this->officePayload($office),
        ], 201);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $office = $this->resolveOffice($request);
        abort_unless($office, 404, 'RDO office not found.');

        $merchantQuery = DB::table('merchants')->where('rdo_code', $office->rdo_code);
        $merchantIds = (clone $merchantQuery)->pluck('id');

        $transactionQuery = DB::table('merchant_transactions')
            ->where(function ($query) use ($office, $merchantIds) {
                $query
                    ->where('rdo_code', $office->rdo_code)
                    ->orWhere(function ($fallback) use ($merchantIds) {
                        $fallback
                            ->whereIn('merchant_id', $merchantIds)
                            ->where(function ($missing) {
                                $missing->whereNull('rdo_code')->orWhere('rdo_code', '');
                            });
                    });
            });

        $receiptQuery = DB::table('transaction_receipts')
            ->where(function ($query) use ($office, $merchantIds) {
                $query
                    ->where('rdo_code', $office->rdo_code)
                    ->orWhere(function ($fallback) use ($merchantIds) {
                        $fallback
                            ->whereIn('merchant_id', $merchantIds)
                            ->where(function ($missing) {
                                $missing->whereNull('rdo_code')->orWhere('rdo_code', '');
                            });
                    });
            });

        $businessCount = (clone $merchantQuery)->count();
        $transactionCount = (clone $transactionQuery)->count();
        $revenue = (float) (clone $transactionQuery)->sum('amount');
        $vat = (float) (clone $transactionQuery)->sum('vat_amount');
        $receipts = (clone $receiptQuery)->count();
        $avgCompliance = $businessCount
            ? round((float) (clone $merchantQuery)->avg('compliance_score'), 1)
            : 0;

        $businesses = (clone $merchantQuery)
            ->orderByDesc('monthly_revenue')
            ->limit(20)
            ->get()
            ->map(fn ($merchant) => [
                'id' => $merchant->id,
                'business_name' => $merchant->business_name,
                'tin' => $merchant->tin,
                'city' => $merchant->city,
                'barangay' => $merchant->barangay ?? null,
                'sector' => $merchant->sector,
                'status' => $merchant->status,
                'compliance_score' => (int) $merchant->compliance_score,
                'monthly_revenue' => (float) $merchant->monthly_revenue,
                'vat_registered' => (bool) $merchant->vat_registered,
                'last_audit_date' => $merchant->last_audit_date,
                'next_audit_date' => $merchant->next_audit_date,
            ])
            ->values();

        $transactions = DB::table('merchant_transactions')
            ->leftJoin('merchants', 'merchant_transactions.merchant_id', '=', 'merchants.id')
            ->leftJoin('transaction_receipts', 'merchant_transactions.receipt_id', '=', 'transaction_receipts.id')
            ->where(function ($query) use ($office) {
                $query
                    ->where('merchant_transactions.rdo_code', $office->rdo_code)
                    ->orWhere(function ($fallback) use ($office) {
                        $fallback
                            ->where('merchants.rdo_code', $office->rdo_code)
                            ->where(function ($missing) {
                                $missing->whereNull('merchant_transactions.rdo_code')->orWhere('merchant_transactions.rdo_code', '');
                            });
                    });
            })
            ->select([
                'merchant_transactions.transaction_ref',
                'merchant_transactions.amount',
                'merchant_transactions.vat_amount',
                'merchant_transactions.payment_method',
                'merchant_transactions.channel',
                'merchant_transactions.status',
                'merchant_transactions.created_at',
                'merchant_transactions.rdo_code',
                'merchant_transactions.rdo_name',
                'merchants.business_name',
                'merchants.tin',
                'transaction_receipts.receipt_number',
            ])
            ->orderByDesc('merchant_transactions.created_at')
            ->limit(30)
            ->get()
            ->map(fn ($transaction) => [
                'transaction_ref' => $transaction->transaction_ref,
                'business_name' => $transaction->business_name,
                'tin' => $transaction->tin,
                'amount' => (float) $transaction->amount,
                'vat_amount' => (float) $transaction->vat_amount,
                'payment_method' => $transaction->payment_method,
                'channel' => $transaction->channel,
                'status' => $transaction->status,
                'rdo_code' => $transaction->rdo_code,
                'rdo_name' => $transaction->rdo_name,
                'receipt_number' => $transaction->receipt_number,
                'created_at' => $transaction->created_at,
            ])
            ->values();

        $riskQueue = (clone $merchantQuery)
            ->where('compliance_score', '<', 90)
            ->orderBy('compliance_score')
            ->limit(10)
            ->get()
            ->map(fn ($merchant) => [
                'business_name' => $merchant->business_name,
                'tin' => $merchant->tin,
                'issue' => $merchant->compliance_score < 70 ? 'Compliance review required' : 'Monitor filing and receipt transmission',
                'risk_level' => $merchant->compliance_score < 70 ? 'High' : 'Medium',
                'score' => (int) $merchant->compliance_score,
            ])
            ->values();

        $series = $this->dailySeries($office->rdo_code);

        return response()->json([
            'office' => $this->officePayload($office),
            'kpis' => [
                ['label' => 'Registered Businesses', 'value' => number_format($businessCount), 'subtext' => 'Businesses under this RDO'],
                ['label' => 'Transactions', 'value' => number_format($transactionCount), 'subtext' => 'Recorded NUERS transactions'],
                ['label' => 'Revenue Processed', 'value' => $this->money($revenue), 'subtext' => 'Gross transaction value'],
                ['label' => 'VAT Captured', 'value' => $this->money($vat), 'subtext' => 'VAT from scoped transactions'],
                ['label' => 'EOR Issued', 'value' => number_format($receipts), 'subtext' => 'Electronic official receipts'],
                ['label' => 'Compliance Score', 'value' => "{$avgCompliance}%", 'subtext' => 'Average merchant compliance'],
            ],
            'series' => $series,
            'businesses' => $businesses,
            'transactions' => $transactions,
            'riskQueue' => $riskQueue,
        ]);
    }

    private function resolveOffice(Request $request): ?object
    {
        $code = (string) $request->query('code', '');

        if ($code !== '') {
            return DB::table('rdo_offices')->where('rdo_code', $code)->first();
        }

        $token = $request->bearerToken();

        if ($token) {
            $user = DB::table('users')->where('api_token', $token)->first();
            if ($user) {
                $office = DB::table('rdo_offices')->where('user_id', $user->id)->first();
                if ($office) {
                    return $office;
                }
            }
        }

        return DB::table('rdo_offices')->orderBy('rdo_code')->first();
    }

    private function officePayload(object $office): array
    {
        $businessCount = DB::table('merchants')->where('rdo_code', $office->rdo_code)->count();
        $transactionCount = DB::table('merchant_transactions')
            ->leftJoin('merchants', 'merchant_transactions.merchant_id', '=', 'merchants.id')
            ->where(function ($query) use ($office) {
                $query
                    ->where('merchant_transactions.rdo_code', $office->rdo_code)
                    ->orWhere(function ($fallback) use ($office) {
                        $fallback
                            ->where('merchants.rdo_code', $office->rdo_code)
                            ->where(function ($missing) {
                                $missing->whereNull('merchant_transactions.rdo_code')->orWhere('merchant_transactions.rdo_code', '');
                            });
                    });
            })
            ->count();

        return [
            'id' => $office->id,
            'rdo_code' => $office->rdo_code,
            'rdo_name' => $office->rdo_name,
            'region' => $office->region,
            'city' => $office->city,
            'office_address' => $office->office_address,
            'head_name' => $office->head_name,
            'email' => $office->email,
            'phone' => $office->phone,
            'status' => $office->status,
            'coverage_area' => json_decode($office->coverage_area ?? '[]', true) ?: [],
            'business_count' => $businessCount,
            'transaction_count' => $transactionCount,
        ];
    }

    private function dailySeries(string $rdoCode): array
    {
        return DB::table('merchant_transactions')
            ->leftJoin('merchants', 'merchant_transactions.merchant_id', '=', 'merchants.id')
            ->where(function ($query) use ($rdoCode) {
                $query
                    ->where('merchant_transactions.rdo_code', $rdoCode)
                    ->orWhere(function ($fallback) use ($rdoCode) {
                        $fallback
                            ->where('merchants.rdo_code', $rdoCode)
                            ->where(function ($missing) {
                                $missing->whereNull('merchant_transactions.rdo_code')->orWhere('merchant_transactions.rdo_code', '');
                            });
                    });
            })
            ->selectRaw('DATE(merchant_transactions.created_at) as label, SUM(merchant_transactions.amount) as revenue, SUM(merchant_transactions.vat_amount) as vat, COUNT(*) as transactions')
            ->groupByRaw('DATE(merchant_transactions.created_at)')
            ->orderBy('label')
            ->limit(14)
            ->get()
            ->map(fn ($row) => [
                'label' => $row->label,
                'revenue' => round(((float) $row->revenue) / 1000, 2),
                'vat' => round(((float) $row->vat) / 1000, 2),
                'transactions' => (int) $row->transactions,
            ])
            ->values()
            ->all();
    }

    private function money(float $amount): string
    {
        if (abs($amount) >= 1_000_000) {
            return 'PHP '.number_format($amount / 1_000_000, 1).'M';
        }

        if (abs($amount) >= 1_000) {
            return 'PHP '.number_format($amount / 1_000, 1).'K';
        }

        return 'PHP '.number_format($amount, 2);
    }
}
