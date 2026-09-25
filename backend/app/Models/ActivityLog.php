<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Request;

class ActivityLog extends Model
{
    use HasFactory;

    protected $table = 'activity_logs';

    protected $fillable = [
        'user_id',
        'user_name',
        'user_role',
        'action',
        'module',
        'description',
        'ip_address',
        'user_agent',
        'old_values',
        'new_values',
        'status',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationship to the user who triggered the activity.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Static helper method to quickly record an activity log.
     *
     * @param string $action       e.g. 'login', 'create', 'update', 'delete', 'export'
     * @param string $module       e.g. 'auth', 'users', 'products', 'sales', 'settings'
     * @param string $description  Human readable log summary
     * @param mixed  $newValues    New record data / changes
     * @param mixed  $oldValues    Previous record data
     * @param string $status       'success', 'warning', 'error', 'info'
     * @param User|null $user      Custom user or current authenticated user
     * @return self
     */
    public static function record(
        string $action,
        string $module,
        string $description,
        mixed $newValues = null,
        mixed $oldValues = null,
        string $status = 'success',
        ?User $user = null
    ): self {
        $currentUser = $user ?? auth('sanctum')->user() ?? auth()->user();

        return self::create([
            'user_id' => $currentUser?->id,
            'user_name' => $currentUser?->name ?? 'System',
            'user_role' => $currentUser?->role?->name ?? $currentUser?->role_name ?? ($currentUser ? 'staff' : 'system'),
            'action' => strtolower($action),
            'module' => strtolower($module),
            'description' => $description,
            'ip_address' => Request::ip() ?? '127.0.0.1',
            'user_agent' => Request::userAgent() ?? 'JewelFlow Client',
            'old_values' => is_array($oldValues) || is_object($oldValues) ? $oldValues : ($oldValues ? ['data' => $oldValues] : null),
            'new_values' => is_array($newValues) || is_object($newValues) ? $newValues : ($newValues ? ['data' => $newValues] : null),
            'status' => $status,
        ]);
    }
}
