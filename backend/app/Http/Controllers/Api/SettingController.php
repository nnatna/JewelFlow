<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Display all store settings as key-value pairs.
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key')->toArray();

        return response()->json($settings);
    }

    /**
     * Bulk update or insert store settings.
     */
    public function update(Request $request): JsonResponse
    {
        $settingsData = $request->input('settings', $request->all());

        if (is_array($settingsData)) {
            foreach ($settingsData as $key => $val) {
                if ($key === 'settings') {
                    continue;
                }
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => is_bool($val) ? ($val ? 'true' : 'false') : (string) $val]
                );
            }

            ActivityLog::record(
                action: 'update',
                module: 'settings',
                description: 'Updated store configuration parameters',
                newValues: $settingsData,
                status: 'success'
            );
        }

        $all = Setting::all()->pluck('value', 'key')->toArray();

        return response()->json([
            'message' => 'Settings updated successfully.',
            'settings' => $all,
        ]);
    }
}
