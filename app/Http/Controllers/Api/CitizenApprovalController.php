<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class CitizenApprovalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorizeReviewer($request);
        abort_unless(Schema::hasTable('client_accounts'), 500, 'client_accounts table is not migrated.');

        $status = strtolower((string) $request->query('status', 'all'));
        $search = trim((string) $request->query('search', ''));

        $query = DB::table('client_accounts')
            ->leftJoin('profiles', 'profiles.id', '=', 'client_accounts.user_id')
            ->select($this->accountSelectColumns());

        if ($status !== 'all') {
            $query->where('client_accounts.status', $status);
        }

        if ($search !== '') {
            $query->where(function ($nested) use ($search): void {
                $like = '%'.$search.'%';
                $nested
                    ->where('client_accounts.full_name', 'like', $like)
                    ->orWhere('client_accounts.email', 'like', $like)
                    ->orWhere('client_accounts.account_number', 'like', $like)
                    ->orWhere('profiles.tin', 'like', $like);
            });
        }

        $accounts = $query
            ->orderByRaw("CASE WHEN client_accounts.status IN ('pending', 'under_review') THEN 0 ELSE 1 END")
            ->orderByDesc('client_accounts.updated_at')
            ->limit(200)
            ->get()
            ->map(fn ($account) => $this->accountPayload($account))
            ->values();

        return response()->json([
            'data' => $accounts,
            'summary' => $this->summary(),
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $this->authorizeReviewer($request);
        abort_unless(Schema::hasTable('client_accounts'), 500, 'client_accounts table is not migrated.');

        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'pending', 'under_review', 'rejected'])],
        ]);

        $account = DB::table('client_accounts')->where('id', $id)->first();
        abort_unless($account, 404, 'Citizen account not found.');

        DB::table('client_accounts')->where('id', $id)->update([
            'status' => $validated['status'],
            'updated_at' => now(),
        ]);

        if ($validated['status'] === 'active' && $account->user_id && Schema::hasTable('profiles')) {
            DB::table('profiles')->where('id', $account->user_id)->update([
                'role' => 'client',
                'updated_at' => now(),
            ]);
        }

        $updated = DB::table('client_accounts')
            ->leftJoin('profiles', 'profiles.id', '=', 'client_accounts.user_id')
            ->select($this->accountSelectColumns())
            ->where('client_accounts.id', $id)
            ->first();

        return response()->json([
            'data' => $this->accountPayload($updated),
            'summary' => $this->summary(),
        ]);
    }

    private function authorizeReviewer(Request $request): void
    {
        $token = $request->bearerToken();
        abort_unless($token, 401, 'Authenticated reviewer session is required.');

        $user = User::where('api_token', $token)->first();
        abort_unless($user, 401, 'Authenticated reviewer session is required.');

        $role = Schema::hasTable('profiles')
            ? DB::table('profiles')->where('id', $user->id)->value('role')
            : null;

        abort_unless(in_array($role, ['admin', 'super_admin', 'bir'], true), 403, 'Citizen approval is restricted to BIR and Super Admin users.');
    }

    private function summary(): array
    {
        $base = DB::table('client_accounts');

        return [
            'total' => (clone $base)->count(),
            'pending' => (clone $base)->whereIn('status', ['pending', 'under_review'])->count(),
            'active' => (clone $base)->where('status', 'active')->count(),
            'rejected' => (clone $base)->where('status', 'rejected')->count(),
        ];
    }

    private function accountSelectColumns(): array
    {
        return [
            'client_accounts.id',
            'client_accounts.user_id',
            'client_accounts.account_number',
            'client_accounts.full_name',
            'client_accounts.account_type',
            'client_accounts.email',
            'client_accounts.mobile',
            'client_accounts.status',
            'client_accounts.mfa_enabled',
            'client_accounts.wallet_balance',
            'client_accounts.created_at',
            'client_accounts.updated_at',
            Schema::hasColumn('profiles', 'tin') ? 'profiles.tin' : DB::raw('NULL as tin'),
            Schema::hasColumn('profiles', 'tin_bound_at') ? 'profiles.tin_bound_at' : DB::raw('NULL as tin_bound_at'),
            Schema::hasColumn('profiles', 'profile_photo_url') ? 'profiles.profile_photo_url' : DB::raw('NULL as profile_photo_url'),
        ];
    }

    private function accountPayload(object $account): array
    {
        return [
            'id' => $account->id,
            'user_id' => $account->user_id,
            'account_number' => $account->account_number,
            'full_name' => $account->full_name,
            'account_type' => $account->account_type,
            'email' => $account->email,
            'mobile' => $account->mobile,
            'status' => $account->status,
            'mfa_enabled' => (bool) $account->mfa_enabled,
            'wallet_balance' => (float) $account->wallet_balance,
            'tin' => $account->tin,
            'tin_bound_at' => $account->tin_bound_at,
            'profile_photo_url' => $account->profile_photo_url,
            'created_at' => $account->created_at,
            'updated_at' => $account->updated_at,
        ];
    }
}
