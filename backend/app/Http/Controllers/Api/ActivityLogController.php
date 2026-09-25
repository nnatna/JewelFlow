<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of activity logs.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $module = $request->query('module');
        $action = $request->query('action');
        $status = $request->query('status');
        $userId = $request->query('user_id');
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');
        $sort = $request->query('sort', 'created_at');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = ActivityLog::with('user:id,name,email,role_id')
            ->when($search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('description', 'like', "%{$search}%")
                        ->orWhere('user_name', 'like', "%{$search}%")
                        ->orWhere('action', 'like', "%{$search}%")
                        ->orWhere('module', 'like', "%{$search}%")
                        ->orWhere('ip_address', 'like', "%{$search}%");
                });
            })
            ->when($module && $module !== 'all', function ($q) use ($module) {
                $q->where('module', $module);
            })
            ->when($action && $action !== 'all', function ($q) use ($action) {
                $q->where('action', $action);
            })
            ->when($status && $status !== 'all', function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->when($userId && $userId !== 'all', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->when($dateFrom, function ($q, $dateFrom) {
                $q->whereDate('created_at', '>=', Carbon::parse($dateFrom)->startOfDay());
            })
            ->when($dateTo, function ($q, $dateTo) {
                $q->whereDate('created_at', '<=', Carbon::parse($dateTo)->endOfDay());
            })
            ->orderBy($sort, $direction);

        $perPage = (int) $request->query('per_page', 20);

        if ($request->query('paginate', 'true') === 'false' || $perPage >= 1000) {
            $logs = $query->limit(500)->get();
            return response()->json([
                'data' => $logs,
                'total' => $logs->count()
            ]);
        }

        $paginated = $query->paginate($perPage);
        return response()->json($paginated);
    }

    /**
     * Get summary KPI statistics for logs.
     */
    public function stats(): JsonResponse
    {
        $today = Carbon::today();
        
        $totalLogs = ActivityLog::count();
        $todayLogs = ActivityLog::whereDate('created_at', $today)->count();
        $authEvents = ActivityLog::where('module', 'auth')->count();
        $errorLogs = ActivityLog::where('status', 'error')->count();
        $warningLogs = ActivityLog::where('status', 'warning')->count();

        // Top active modules
        $moduleStats = ActivityLog::selectRaw('module, count(*) as total')
            ->groupBy('module')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json([
            'total_logs' => $totalLogs,
            'today_logs' => $todayLogs,
            'auth_events' => $authEvents,
            'error_logs' => $errorLogs,
            'warning_logs' => $warningLogs,
            'module_stats' => $moduleStats,
        ]);
    }

    /**
     * Display the specified activity log.
     */
    public function show($id): JsonResponse
    {
        $log = ActivityLog::with('user')->findOrFail($id);
        return response()->json($log);
    }

    /**
     * Store a newly created log manually (e.g. from frontend audit).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|string|max:100',
            'module' => 'required|string|max:100',
            'description' => 'required|string',
            'old_values' => 'nullable|array',
            'new_values' => 'nullable|array',
            'status' => 'nullable|string|in:success,warning,error,info',
        ]);

        $log = ActivityLog::record(
            action: $validated['action'],
            module: $validated['module'],
            description: $validated['description'],
            newValues: $validated['new_values'] ?? null,
            oldValues: $validated['old_values'] ?? null,
            status: $validated['status'] ?? 'success'
        );

        return response()->json([
            'success' => true,
            'message' => 'Activity logged successfully.',
            'data' => $log,
        ], 201);
    }

    /**
     * Clear old activity logs (Admin / Super Admin only).
     */
    public function clear(Request $request): JsonResponse
    {
        $user = $request->user() ?? auth('sanctum')->user();
        $isSuperOrAdmin = $user && (in_array($user->role?->name, ['super_admin', 'admin']) || $user->email === 'admin@jewelflow.com');

        if (!$isSuperOrAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Only SuperAdmin / Admin can clear activity logs.',
            ], 403);
        }

        $days = $request->input('days'); // e.g. 30, 90, or 'all'

        if ($days === 'all' || empty($days)) {
            ActivityLog::truncate();
            $deletedCount = 'all';
        } else {
            $cutoff = Carbon::now()->subDays((int) $days);
            $deletedCount = ActivityLog::where('created_at', '<', $cutoff)->delete();
        }

        // Record the purge action itself
        ActivityLog::record(
            action: 'delete',
            module: 'system',
            description: "Activity logs purged ({$deletedCount} records deleted by {$user->name}).",
            status: 'warning',
            user: $user
        );

        return response()->json([
            'success' => true,
            'message' => 'Activity logs cleared successfully.',
            'deleted_count' => $deletedCount,
        ]);
    }
}
