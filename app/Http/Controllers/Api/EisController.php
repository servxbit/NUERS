<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

class EisController extends Controller
{
    public function readiness(): JsonResponse
    {
        $integration = $this->integration();
        $checks = DB::table('eis_readiness_checks')
            ->where('integration_id', $integration?->id)
            ->orderByRaw("FIELD(severity, 'critical', 'high', 'medium', 'low')")
            ->orderBy('category')
            ->orderBy('control_code')
            ->get();

        $readyChecks = $checks->where('status', 'ready')->count();
        $totalChecks = max($checks->count(), 1);
        $criticalBlockers = $checks->where('severity', 'critical')->whereIn('status', ['blocked', 'pending'])->count();
        $readinessScore = (int) round(($readyChecks / $totalChecks) * 100);
        $productionBlocked = $criticalBlockers > 0 || ! (bool) ($integration?->credentials_present ?? false);

        $status = $productionBlocked
            ? 'production_blocked'
            : ($readinessScore >= 90 ? 'production_ready' : 'certification_pending');

        $transmissionCounts = DB::table('eis_transmissions')
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $totalTransmissions = (int) $transmissionCounts->sum();
        $acknowledged = (int) ($transmissionCounts['acknowledged'] ?? 0);
        $failed = (int) (($transmissionCounts['failed'] ?? 0) + ($transmissionCounts['rejected'] ?? 0));
        $queued = (int) (($transmissionCounts['queued'] ?? 0) + ($transmissionCounts['submitting'] ?? 0) + ($transmissionCounts['submitted'] ?? 0));
        $successRate = $totalTransmissions > 0 ? round(($acknowledged / $totalTransmissions) * 100, 2) : 0.0;

        return response()->json([
            'integration' => $this->formatIntegration($integration),
            'readiness' => [
                'score' => $readinessScore,
                'status' => $status,
                'critical_blockers' => $criticalBlockers,
                'production_blocked' => $productionBlocked,
                'can_submit_to_bir' => ! $productionBlocked,
                'deadline_days' => (int) ($integration?->transmission_deadline_days ?? 3),
                'last_updated_at' => Carbon::now()->toIso8601String(),
            ],
            'kpis' => [
                ['key' => 'transmissions', 'label' => 'EIS Transmissions', 'value' => $this->compactNumber($totalTransmissions), 'subtext' => "{$queued} queued, {$failed} failed/rejected", 'status' => 'database'],
                ['key' => 'payloads', 'label' => 'Validated Payloads', 'value' => $this->compactNumber($this->count('eis_invoice_payloads')), 'subtext' => 'Canonical JSON hash stored', 'status' => 'database'],
                ['key' => 'success_rate', 'label' => 'Acknowledgement Rate', 'value' => number_format($successRate, 2) . '%', 'subtext' => "{$acknowledged} acknowledged", 'status' => $successRate >= 95 ? 'ready' : 'monitor'],
                ['key' => 'production_gate', 'label' => 'Production Gate', 'value' => $productionBlocked ? 'Blocked' : 'Ready', 'subtext' => $productionBlocked ? 'Certification/PTT/credentials required' : 'Credentials and controls registered', 'status' => $productionBlocked ? 'blocked' : 'ready'],
            ],
            'checks' => $checks->map(fn ($row) => [
                'id' => $row->id,
                'category' => $row->category,
                'control_code' => $row->control_code,
                'name' => $row->name,
                'requirement' => $row->requirement,
                'status' => $row->status,
                'severity' => $row->severity,
                'evidence' => $row->evidence,
                'source_reference' => $row->source_reference,
                'remediation' => $row->remediation,
                'last_checked_at' => $row->last_checked_at,
            ])->values(),
            'services' => DB::table('eis_service_health_checks')
                ->orderByRaw("FIELD(status, 'pending_credentials', 'outage', 'degraded', 'operational')")
                ->orderBy('service_name')
                ->get()
                ->map(fn ($row) => [
                    'id' => $row->id,
                    'service_name' => $row->service_name,
                    'status' => $row->status,
                    'latency_ms' => $row->latency_ms === null ? null : (int) $row->latency_ms,
                    'uptime_percentage' => (float) $row->uptime_percentage,
                    'checked_at' => $row->checked_at,
                    'metadata' => json_decode($row->metadata ?? '{}', true) ?: [],
                ])->values(),
            'recent_transmissions' => $this->transmissionQuery()
                ->limit(8)
                ->get()
                ->map(fn ($row) => $this->formatTransmission($row))
                ->values(),
            'charts' => [
                'hourly' => $this->hourlyTransmissionSeries(),
                'weekly' => $this->weeklyTransmissionSeries(),
            ],
            'requirements' => [
                ['title' => 'EIS certification and PTT', 'detail' => 'Production must be blocked until the taxpayer completes BIR EIS certification and Permit to Transmit authorization.'],
                ['title' => 'Encrypted JSON sales data', 'detail' => 'NUERS stores canonical JSON payloads and hashes; final production encryption uses BIR-issued key material.'],
                ['title' => 'Three-calendar-day SLA', 'detail' => 'Payload validation calculates a due date and flags records older than the allowed transmission window.'],
                ['title' => 'Duplicate and retry controls', 'detail' => 'Every transmission has a SHA-256 payload hash, duplicate reference, attempt count, and retry schedule.'],
            ],
        ]);
    }

    public function transmissions(Request $request): JsonResponse
    {
        $query = $this->transmissionQuery();

        if ($request->filled('status') && $request->string('status')->value() !== 'all') {
            $query->where('t.status', $request->string('status')->value());
        }

        if ($request->filled('type') && $request->string('type')->value() !== 'all') {
            $query->where('t.transmission_type', $request->string('type')->value());
        }

        if ($request->filled('tab')) {
            match ($request->string('tab')->value()) {
                'pending' => $query->whereIn('t.status', ['queued', 'submitting', 'submitted']),
                'failed' => $query->whereIn('t.status', ['failed', 'rejected']),
                'retries' => $query->where('t.attempt_number', '>', 1),
                default => null,
            };
        }

        if ($request->filled('search')) {
            $search = '%' . $request->string('search')->value() . '%';
            $query->where(function ($inner) use ($search) {
                $inner->where('t.id', 'like', $search)
                    ->orWhere('t.payload_hash', 'like', $search)
                    ->orWhere('t.bir_reference_number', 'like', $search)
                    ->orWhere('m.business_name', 'like', $search)
                    ->orWhere('m.tin', 'like', $search);
            });
        }

        $transmissions = $query->limit(100)->get()->map(fn ($row) => $this->formatTransmission($row))->values();
        $counts = DB::table('eis_transmissions')
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'summary' => [
                'total' => (int) $counts->sum(),
                'acknowledged' => (int) ($counts['acknowledged'] ?? 0),
                'failed' => (int) (($counts['failed'] ?? 0) + ($counts['rejected'] ?? 0)),
                'queued' => (int) (($counts['queued'] ?? 0) + ($counts['submitting'] ?? 0) + ($counts['submitted'] ?? 0)),
                'duplicates' => (int) ($counts['duplicate'] ?? 0),
                'retry_queue' => $this->count('eis_retry_queue', ['result' => 'scheduled']),
            ],
            'transmissions' => $transmissions,
            'retry_queue' => DB::table('eis_retry_queue as r')
                ->join('eis_transmissions as t', 't.id', '=', 'r.transmission_id')
                ->where('r.result', 'scheduled')
                ->orderBy('r.scheduled_at')
                ->limit(25)
                ->get([
                    'r.id',
                    'r.transmission_id',
                    't.transmission_type',
                    't.invoice_count',
                    'r.attempt_number',
                    't.max_attempts',
                    'r.scheduled_at',
                    'r.error_message',
                ]),
        ]);
    }

    public function validatePayload(Request $request): JsonResponse
    {
        [$payload, $canonical, $hash] = $this->payloadFromRequest($request);
        $result = $this->validateEisPayload($payload);

        return response()->json([
            'status' => empty($result['errors']) ? 'valid' : 'invalid',
            'errors' => $result['errors'],
            'warnings' => $result['warnings'],
            'invoice_count' => $this->payloadInvoiceCount($payload),
            'payload_hash' => $hash,
            'payload_size' => strlen($canonical),
            'due_at' => $result['due_at'],
        ], empty($result['errors']) ? 200 : 422);
    }

    public function storeTransmission(Request $request): JsonResponse
    {
        [$payload, $canonical, $hash] = $this->payloadFromRequest($request);
        $validation = $this->validateEisPayload($payload);

        if (! empty($validation['errors'])) {
            return response()->json([
                'message' => 'EIS payload validation failed.',
                'errors' => $validation['errors'],
                'warnings' => $validation['warnings'],
                'payload_hash' => $hash,
            ], 422);
        }

        $integration = $this->integration();
        $duplicate = DB::table('eis_transmissions')
            ->where('payload_hash', $hash)
            ->where('environment', $request->input('environment', $integration?->environment ?? 'certification'))
            ->orderByDesc('created_at')
            ->first();

        $merchant = $this->merchantForPayload($payload);
        $payloadId = (string) Str::uuid();
        $transmissionId = (string) Str::uuid();
        $now = Carbon::now();
        $status = $duplicate ? 'duplicate' : 'queued';
        $responseCode = $duplicate ? 'NUERS-DUPLICATE' : 'NUERS-CREDENTIALS-PENDING';
        $responseMessage = $duplicate
            ? 'Duplicate payload hash detected; transmission references the original queued/submitted record.'
            : 'Validated and queued inside NUERS. Live BIR EIS submission is blocked until EIS CERT, PTT, and BIR credentials are registered.';

        DB::transaction(function () use ($payload, $canonical, $hash, $validation, $integration, $duplicate, $merchant, $payloadId, $transmissionId, $now, $status, $responseCode, $responseMessage, $request) {
            DB::table('eis_invoice_payloads')->insert([
                'id' => $payloadId,
                'merchant_id' => $merchant?->id,
                'receipt_id' => $payload['receipt_id'] ?? null,
                'invoice_number' => $this->invoiceNumber($payload),
                'document_type' => $payload['document_type'] ?? $payload['type'] ?? 'invoice',
                'issue_date' => $this->issueDate($payload)?->toDateString(),
                'due_at' => $validation['due_at'],
                'payload' => json_encode($payload),
                'payload_hash' => $hash,
                'payload_size' => strlen($canonical),
                'validation_status' => 'valid',
                'validation_errors' => json_encode($validation),
                'signature_algorithm' => 'SHA256',
                'digital_signature_hash' => $payload['digital_signature_hash'] ?? $payload['signature_hash'] ?? null,
                'encrypted_payload_hash' => $payload['encrypted_payload_hash'] ?? null,
                'source' => $request->input('source', 'manual'),
                'status' => 'ready_for_queue',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('eis_transmissions')->insert([
                'id' => $transmissionId,
                'integration_id' => $integration?->id,
                'merchant_id' => $merchant?->id,
                'payload_id' => $payloadId,
                'transmission_type' => $request->input('transmission_type', 'invoice_submission'),
                'status' => $status,
                'invoice_count' => $this->payloadInvoiceCount($payload),
                'payload_hash' => $hash,
                'duplicate_of' => $duplicate?->id,
                'response_code' => $responseCode,
                'response_message' => $responseMessage,
                'attempt_number' => 1,
                'max_attempts' => 5,
                'next_retry_at' => $duplicate ? null : $now->copy()->addMinutes(15),
                'due_at' => $validation['due_at'],
                'environment' => $request->input('environment', $integration?->environment ?? 'certification'),
                'api_version' => $request->input('api_version', $integration?->api_version ?? 'v2'),
                'endpoint_url' => rtrim($integration?->endpoint_base_url ?? 'https://eis.bir.gov.ph', '/') . '/api/eis/transmissions',
                'request_id' => (string) Str::uuid(),
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('eis_transmission_payloads')->insert([
                'id' => (string) Str::uuid(),
                'transmission_id' => $transmissionId,
                'payload_format' => 'json',
                'payload' => $canonical,
                'payload_size' => strlen($canonical),
                'payload_hash' => $hash,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if (! $duplicate) {
                DB::table('eis_retry_queue')->insert([
                    'id' => (string) Str::uuid(),
                    'transmission_id' => $transmissionId,
                    'merchant_id' => $merchant?->id,
                    'attempt_number' => 1,
                    'scheduled_at' => $now->copy()->addMinutes(15),
                    'result' => 'scheduled',
                    'error_message' => 'Waiting for production EIS credentials/certification gate.',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $this->logApiRequest($integration?->id, $transmissionId, $request, 202, $responseCode, $responseMessage, strlen($canonical));
            $this->audit('eis.transmission.queued', 'eis_transmissions', $transmissionId, $request, [
                'payload_hash' => $hash,
                'status' => $status,
                'duplicate_of' => $duplicate?->id,
            ]);
        });

        $row = $this->transmissionQuery()->where('t.id', $transmissionId)->first();

        return response()->json([
            'message' => $responseMessage,
            'transmission' => $this->formatTransmission($row),
            'validation' => $validation,
        ], 202);
    }

    public function retry(Request $request, string $id): JsonResponse
    {
        $transmission = DB::table('eis_transmissions')->where('id', $id)->first();
        abort_unless($transmission, 404, 'EIS transmission not found.');

        $nextAttempt = min(((int) $transmission->attempt_number) + 1, (int) $transmission->max_attempts);
        $delayMinutes = min(60, 2 ** max($nextAttempt, 1));
        $scheduledAt = Carbon::now()->addMinutes($delayMinutes);

        DB::table('eis_transmissions')->where('id', $id)->update([
            'status' => 'queued',
            'attempt_number' => $nextAttempt,
            'next_retry_at' => $scheduledAt,
            'response_code' => 'NUERS-RETRY-SCHEDULED',
            'response_message' => 'Retry scheduled in NUERS. Live BIR EIS submission remains gated by certification/PTT/credentials.',
            'updated_at' => Carbon::now(),
        ]);

        DB::table('eis_retry_queue')->insert([
            'id' => (string) Str::uuid(),
            'transmission_id' => $id,
            'merchant_id' => $transmission->merchant_id,
            'attempt_number' => $nextAttempt,
            'scheduled_at' => $scheduledAt,
            'result' => 'scheduled',
            'error_message' => 'Manual retry request queued.',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        $this->audit('eis.transmission.retry_scheduled', 'eis_transmissions', $id, $request, [
            'attempt_number' => $nextAttempt,
            'scheduled_at' => $scheduledAt->toIso8601String(),
        ]);

        return response()->json([
            'message' => 'Retry scheduled.',
            'transmission' => $this->formatTransmission($this->transmissionQuery()->where('t.id', $id)->first()),
        ]);
    }

    public function acknowledge(Request $request, string $id): JsonResponse
    {
        $transmission = DB::table('eis_transmissions')->where('id', $id)->first();
        abort_unless($transmission, 404, 'EIS transmission not found.');

        $now = Carbon::now();
        $ack = $request->input('acknowledgement_number', 'CERT-ACK-' . strtoupper(Str::random(8)));
        $birReference = $request->input('bir_reference_number', 'CERT-BIR-' . now()->format('YmdHis'));

        DB::table('eis_transmissions')->where('id', $id)->update([
            'status' => 'acknowledged',
            'bir_reference_number' => $birReference,
            'bir_acknowledgement' => $ack,
            'response_code' => $request->input('response_code', '200'),
            'response_message' => $request->input('response_message', 'Certification acknowledgement recorded in NUERS.'),
            'acknowledged_at' => $now,
            'latency_ms' => $request->integer('latency_ms', 0) ?: null,
            'updated_at' => $now,
        ]);

        DB::table('eis_acknowledgements')->insert([
            'id' => (string) Str::uuid(),
            'transmission_id' => $id,
            'bir_reference_number' => $birReference,
            'acknowledgement_number' => $ack,
            'response_code' => $request->input('response_code', '200'),
            'response_message' => $request->input('response_message', 'Certification acknowledgement recorded in NUERS.'),
            'raw_response' => json_encode($request->all()),
            'received_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return response()->json([
            'message' => 'Acknowledgement recorded.',
            'transmission' => $this->formatTransmission($this->transmissionQuery()->where('t.id', $id)->first()),
        ]);
    }

    private function integration(): ?object
    {
        return DB::table('eis_integrations')->orderByDesc('updated_at')->first();
    }

    private function formatIntegration(?object $integration): ?array
    {
        if (! $integration) {
            return null;
        }

        return [
            'id' => $integration->id,
            'merchant_id' => $integration->merchant_id,
            'merchant_name' => $integration->merchant_name,
            'taxpayer_tin' => $integration->taxpayer_tin,
            'branch_code' => $integration->branch_code,
            'environment' => $integration->environment,
            'status' => $integration->status,
            'certification_status' => $integration->certification_status,
            'ptt_status' => $integration->ptt_status,
            'endpoint_base_url' => $integration->endpoint_base_url,
            'json_schema_version' => $integration->json_schema_version,
            'api_version' => $integration->api_version,
            'eis_certificate_number' => $integration->eis_certificate_number,
            'permit_to_transmit_number' => $integration->permit_to_transmit_number,
            'credentials_present' => (bool) $integration->credentials_present,
            'transmission_deadline_days' => (int) $integration->transmission_deadline_days,
            'signing_algorithm' => $integration->signing_algorithm,
            'encryption_mode' => $integration->encryption_mode,
            'public_key_fingerprint' => $integration->public_key_fingerprint,
        ];
    }

    private function transmissionQuery()
    {
        return DB::table('eis_transmissions as t')
            ->leftJoin('merchants as m', 'm.id', '=', 't.merchant_id')
            ->leftJoin('eis_invoice_payloads as p', 'p.id', '=', 't.payload_id')
            ->select([
                't.*',
                'm.business_name as merchant_name',
                'm.tin as merchant_tin',
                'p.invoice_number',
                'p.document_type',
                'p.issue_date',
            ])
            ->orderByDesc('t.created_at');
    }

    private function formatTransmission(?object $row): ?array
    {
        if (! $row) {
            return null;
        }

        return [
            'id' => $row->id,
            'type' => $row->transmission_type,
            'status' => $row->status,
            'invoice_count' => (int) $row->invoice_count,
            'payload_hash' => $row->payload_hash,
            'duplicate_of' => $row->duplicate_of,
            'bir_reference_number' => $row->bir_reference_number,
            'bir_acknowledgement' => $row->bir_acknowledgement,
            'response_code' => $row->response_code,
            'response_message' => $row->response_message,
            'attempt_number' => (int) $row->attempt_number,
            'max_attempts' => (int) $row->max_attempts,
            'next_retry_at' => $row->next_retry_at,
            'submitted_at' => $row->submitted_at,
            'acknowledged_at' => $row->acknowledged_at,
            'due_at' => $row->due_at,
            'latency_ms' => $row->latency_ms === null ? null : (int) $row->latency_ms,
            'environment' => $row->environment,
            'api_version' => $row->api_version,
            'endpoint_url' => $row->endpoint_url,
            'request_id' => $row->request_id,
            'merchant_name' => $row->merchant_name,
            'merchant_tin' => $row->merchant_tin,
            'invoice_number' => $row->invoice_number,
            'document_type' => $row->document_type,
            'issue_date' => $row->issue_date,
            'created_at' => $row->created_at,
        ];
    }

    private function payloadFromRequest(Request $request): array
    {
        $rawPayload = $request->input('payload', $request->all());

        if (is_string($rawPayload)) {
            $decoded = json_decode($rawPayload, true);
            abort_if(json_last_error() !== JSON_ERROR_NONE || ! is_array($decoded), 422, 'Payload must be valid JSON.');
            $payload = $decoded;
        } elseif (is_array($rawPayload)) {
            $payload = $rawPayload;
        } else {
            abort(422, 'Payload must be valid JSON.');
        }

        $canonicalPayload = $this->canonicalJson($payload);

        return [$payload, $canonicalPayload, hash('sha256', $canonicalPayload)];
    }

    private function validateEisPayload(array $payload): array
    {
        $errors = [];
        $warnings = [];

        if (! $this->invoiceNumber($payload)) {
            $errors[] = 'Missing invoice_number, receipt_number, or document_id.';
        }

        $issueDate = $this->issueDate($payload);
        if (! $issueDate) {
            $errors[] = 'Missing or invalid issue_date / transaction_date.';
        }

        $sellerTin = $payload['seller_tin']
            ?? data_get($payload, 'seller.tin')
            ?? data_get($payload, 'merchant.tin')
            ?? $payload['merchant_tin']
            ?? null;

        if (! $sellerTin || ! $this->tinIsValid((string) $sellerTin)) {
            $errors[] = 'Seller or merchant TIN is required and must follow a valid Philippine TIN format.';
        }

        $total = $payload['total_due']
            ?? $payload['gross_amount']
            ?? $payload['total_amount']
            ?? data_get($payload, 'totals.total_due')
            ?? null;

        if (! is_numeric($total) || (float) $total <= 0) {
            $errors[] = 'A positive total_due, gross_amount, or total_amount is required.';
        }

        if (! ($payload['document_type'] ?? $payload['type'] ?? null)) {
            $warnings[] = 'Document type is not set; NUERS will default to invoice_submission.';
        }

        if (! ($payload['digital_signature_hash'] ?? $payload['signature_hash'] ?? null)) {
            $warnings[] = 'Digital signature hash is not present yet; production transmission must be signed.';
        }

        if (! ($payload['encrypted_payload_hash'] ?? null)) {
            $warnings[] = 'Encrypted payload hash is not present yet; production transmission must use encrypted JSON sales data.';
        }

        $dueAt = null;
        if ($issueDate) {
            $dueAt = $issueDate->addDays($this->integration()?->transmission_deadline_days ?? 3)->endOfDay();
            if ($dueAt->isPast()) {
                $warnings[] = 'Issue date is older than the BIR EIS three-calendar-day transmission window.';
            }
        }

        return [
            'errors' => $errors,
            'warnings' => $warnings,
            'due_at' => $dueAt?->toDateTimeString(),
        ];
    }

    private function invoiceNumber(array $payload): ?string
    {
        return $payload['invoice_number']
            ?? $payload['receipt_number']
            ?? $payload['document_id']
            ?? data_get($payload, 'invoice.number')
            ?? null;
    }

    private function issueDate(array $payload): ?CarbonImmutable
    {
        $date = $payload['issue_date']
            ?? $payload['transaction_date']
            ?? $payload['issued_at']
            ?? data_get($payload, 'invoice.issue_date')
            ?? null;

        if (! $date) {
            return null;
        }

        try {
            return CarbonImmutable::parse($date);
        } catch (Throwable) {
            return null;
        }
    }

    private function payloadInvoiceCount(array $payload): int
    {
        $invoices = $payload['invoices'] ?? $payload['documents'] ?? null;
        if (is_array($invoices)) {
            return max(count($invoices), 1);
        }

        return 1;
    }

    private function tinIsValid(string $tin): bool
    {
        return (bool) preg_match('/^\d{3}-?\d{3}-?\d{3}(-?\d{3,5})?$/', trim($tin));
    }

    private function merchantForPayload(array $payload): ?object
    {
        $sellerTin = $payload['seller_tin']
            ?? data_get($payload, 'seller.tin')
            ?? data_get($payload, 'merchant.tin')
            ?? $payload['merchant_tin']
            ?? null;

        if (! $sellerTin || ! Schema::hasTable('merchants')) {
            return null;
        }

        $tin = preg_replace('/[^0-9]/', '', (string) $sellerTin);

        return DB::table('merchants')
            ->whereRaw("REPLACE(REPLACE(tin, '-', ''), ' ', '') = ?", [$tin])
            ->first();
    }

    private function canonicalJson(array $payload): string
    {
        $normalized = $this->sortKeys($payload);

        return json_encode($normalized, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private function sortKeys(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        if (array_is_list($value)) {
            return array_map(fn ($item) => $this->sortKeys($item), $value);
        }

        ksort($value);

        return array_map(fn ($item) => $this->sortKeys($item), $value);
    }

    private function hourlyTransmissionSeries(): array
    {
        $rows = DB::table('eis_transmissions')
            ->selectRaw("DATE_FORMAT(created_at, '%H:00') as label")
            ->selectRaw('COUNT(*) as submitted')
            ->selectRaw("SUM(CASE WHEN status = 'acknowledged' THEN 1 ELSE 0 END) as acknowledged")
            ->selectRaw("SUM(CASE WHEN status IN ('failed', 'rejected') THEN 1 ELSE 0 END) as failed")
            ->where('created_at', '>=', Carbon::now()->subDay())
            ->groupBy('label')
            ->orderBy('label')
            ->get();

        return $rows->map(fn ($row) => [
            'label' => $row->label,
            'submitted' => (int) $row->submitted,
            'acknowledged' => (int) $row->acknowledged,
            'failed' => (int) $row->failed,
        ])->values()->all();
    }

    private function weeklyTransmissionSeries(): array
    {
        $rows = DB::table('eis_transmissions')
            ->selectRaw("DATE_FORMAT(created_at, '%a') as label")
            ->selectRaw('COUNT(*) as submitted')
            ->selectRaw("SUM(CASE WHEN status = 'acknowledged' THEN 1 ELSE 0 END) as acknowledged")
            ->selectRaw("SUM(CASE WHEN status IN ('failed', 'rejected') THEN 1 ELSE 0 END) as failed")
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->groupBy('label')
            ->orderByRaw('MIN(created_at)')
            ->get();

        return $rows->map(fn ($row) => [
            'label' => $row->label,
            'submitted' => (int) $row->submitted,
            'acknowledged' => (int) $row->acknowledged,
            'failed' => (int) $row->failed,
        ])->values()->all();
    }

    private function count(string $table, array $where = []): int
    {
        if (! Schema::hasTable($table)) {
            return 0;
        }

        $query = DB::table($table);
        foreach ($where as $column => $value) {
            $query->where($column, $value);
        }

        return (int) $query->count();
    }

    private function compactNumber(int $value): string
    {
        if ($value >= 1_000_000) {
            return round($value / 1_000_000, 1) . 'M';
        }

        if ($value >= 1_000) {
            return round($value / 1_000, 1) . 'K';
        }

        return (string) $value;
    }

    private function logApiRequest(?string $integrationId, ?string $transmissionId, Request $request, int $statusCode, ?string $errorCode, ?string $message, int $requestSize): void
    {
        if (! Schema::hasTable('eis_api_request_logs')) {
            return;
        }

        DB::table('eis_api_request_logs')->insert([
            'id' => (string) Str::uuid(),
            'integration_id' => $integrationId,
            'transmission_id' => $transmissionId,
            'method' => $request->method(),
            'endpoint' => '/api/bir-eis/transmissions',
            'status_code' => $statusCode,
            'latency_ms' => null,
            'request_size' => $requestSize,
            'response_size' => $message ? strlen($message) : 0,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'error_code' => $errorCode,
            'error_message' => $message,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
    }

    private function audit(string $eventType, ?string $auditableType, ?string $auditableId, Request $request, array $metadata): void
    {
        if (! Schema::hasTable('audit_events')) {
            return;
        }

        DB::table('audit_events')->insert([
            'id' => (string) Str::uuid(),
            'actor_id' => null,
            'actor_email' => null,
            'event_type' => $eventType,
            'auditable_type' => $auditableType,
            'auditable_id' => $auditableId,
            'ip_address' => $request->ip(),
            'device_fingerprint' => null,
            'severity' => 'info',
            'metadata' => json_encode($metadata),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
    }
}
