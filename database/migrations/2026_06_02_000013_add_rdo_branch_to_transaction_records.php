<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchant_transactions', function (Blueprint $table) {
            if (! Schema::hasColumn('merchant_transactions', 'rdo_code')) {
                $table->string('rdo_code', 20)->nullable()->after('branch')->index();
            }

            if (! Schema::hasColumn('merchant_transactions', 'rdo_name')) {
                $table->string('rdo_name')->nullable()->after('rdo_code');
            }
        });

        Schema::table('transaction_receipts', function (Blueprint $table) {
            if (! Schema::hasColumn('transaction_receipts', 'rdo_code')) {
                $table->string('rdo_code', 20)->nullable()->after('merchant_tin')->index();
            }

            if (! Schema::hasColumn('transaction_receipts', 'rdo_name')) {
                $table->string('rdo_name')->nullable()->after('rdo_code');
            }
        });

        DB::statement("
            UPDATE merchant_transactions t
            LEFT JOIN merchants m ON t.merchant_id = m.id
            SET
                t.rdo_code = COALESCE(NULLIF(t.rdo_code, ''), NULLIF(m.rdo_code, '')),
                t.rdo_name = COALESCE(NULLIF(t.rdo_name, ''), NULLIF(m.rdo_name, ''))
            WHERE
                (t.rdo_code IS NULL OR t.rdo_code = '' OR t.rdo_name IS NULL OR t.rdo_name = '')
                AND (m.rdo_code IS NOT NULL OR m.rdo_name IS NOT NULL)
        ");

        DB::statement("
            UPDATE transaction_receipts r
            LEFT JOIN merchants m ON r.merchant_id = m.id
            SET
                r.rdo_code = COALESCE(NULLIF(r.rdo_code, ''), NULLIF(m.rdo_code, '')),
                r.rdo_name = COALESCE(NULLIF(r.rdo_name, ''), NULLIF(m.rdo_name, ''))
            WHERE
                (r.rdo_code IS NULL OR r.rdo_code = '' OR r.rdo_name IS NULL OR r.rdo_name = '')
                AND (m.rdo_code IS NOT NULL OR m.rdo_name IS NOT NULL)
        ");
    }

    public function down(): void
    {
        Schema::table('transaction_receipts', function (Blueprint $table) {
            if (Schema::hasColumn('transaction_receipts', 'rdo_name')) {
                $table->dropColumn('rdo_name');
            }

            if (Schema::hasColumn('transaction_receipts', 'rdo_code')) {
                $table->dropColumn('rdo_code');
            }
        });

        Schema::table('merchant_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('merchant_transactions', 'rdo_name')) {
                $table->dropColumn('rdo_name');
            }

            if (Schema::hasColumn('merchant_transactions', 'rdo_code')) {
                $table->dropColumn('rdo_code');
            }
        });
    }
};
