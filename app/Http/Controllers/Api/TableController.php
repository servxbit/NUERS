<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientAccount;
use App\Models\Merchant;
use App\Models\MerchantTransaction;
use App\Models\Profile;
use App\Models\SystemNotification;
use App\Models\TransactionReceipt;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class TableController extends Controller
{
    private const TABLES = [
        'profiles' => Profile::class,
        'client_accounts' => ClientAccount::class,
        'merchants' => Merchant::class,
        'notifications' => SystemNotification::class,
        'merchant_transactions' => MerchantTransaction::class,
        'transaction_receipts' => TransactionReceipt::class,
    ];

    public function handle(Request $request, string $table): JsonResponse
    {
        abort_unless(isset(self::TABLES[$table]), 404, 'Unknown table.');

        return match ($request->method()) {
            'GET' => $this->index($request, self::TABLES[$table]),
            'POST' => $this->store($request, self::TABLES[$table]),
            'PUT', 'PATCH' => $this->update($request, self::TABLES[$table]),
            'DELETE' => $this->destroy($request, self::TABLES[$table]),
            default => abort(405),
        };
    }

    private function index(Request $request, string $model): JsonResponse
    {
        /** @var Builder $query */
        $query = $model::query();
        $this->applyFilters($query, $request);

        $count = null;
        if ($request->query('count') === 'exact') {
            $count = (clone $query)->count();
        }

        if ($request->boolean('head')) {
            return response()->json(['data' => null, 'count' => $count]);
        }

        $this->applyOrdering($query, $request);

        if ($limit = $request->integer('limit')) {
            $query->limit($limit);
        }

        $single = $request->boolean('single') || $request->boolean('maybeSingle');
        $data = $single ? $query->first() : $query->get();

        return response()->json(['data' => $data, 'count' => $count]);
    }

    private function store(Request $request, string $model): JsonResponse
    {
        $values = $request->input('values', []);
        $isList = Arr::isList($values);
        $rows = $isList ? $values : [$values];

        $created = collect($rows)
            ->map(fn (array $row) => $model::create($this->normalizePayload($row)))
            ->values();

        return response()->json([
            'data' => $isList ? $created : $created->first(),
            'count' => $created->count(),
        ], 201);
    }

    private function update(Request $request, string $model): JsonResponse
    {
        /** @var Builder $query */
        $query = $model::query();
        $this->applyFilters($query, $request);

        $payload = $this->normalizePayload($request->input('values', []));
        $affected = (clone $query)->update($payload);

        return response()->json([
            'data' => $query->get(),
            'count' => $affected,
        ]);
    }

    private function destroy(Request $request, string $model): JsonResponse
    {
        /** @var Builder $query */
        $query = $model::query();
        $this->applyFilters($query, $request);

        $affected = $query->delete();

        return response()->json([
            'data' => null,
            'count' => $affected,
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        foreach ($this->jsonQuery($request, 'eq') as $column => $value) {
            $value === null ? $query->whereNull($column) : $query->where($column, $value);
        }

        foreach ($this->jsonQuery($request, 'in') as $column => $values) {
            $query->whereIn($column, (array) $values);
        }

        $or = $request->query('or');
        if (is_string($or) && $or !== '') {
            $query->where(function (Builder $nested) use ($or): void {
                foreach (explode(',', $or) as $condition) {
                    [$column, $operator, $value] = array_pad(explode('.', $condition, 3), 3, null);
                    if ($column && $operator === 'eq') {
                        $nested->orWhere($column, $value);
                    }
                }
            });
        }
    }

    private function applyOrdering(Builder $query, Request $request): void
    {
        $column = $request->query('order');

        if (is_string($column) && $column !== '') {
            $query->orderBy($column, $request->boolean('ascending') ? 'asc' : 'desc');
        }
    }

    private function jsonQuery(Request $request, string $key): array
    {
        $value = $request->query($key, '{}');

        if (is_array($value)) {
            return $value;
        }

        $decoded = json_decode((string) $value, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function normalizePayload(array $payload): array
    {
        foreach ($payload as $key => $value) {
            if ($value === '' && (str_ends_with($key, '_date') || $key === 'issued_at')) {
                $payload[$key] = null;
            }
        }

        return $payload;
    }
}
