<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'view post',
            'create post',
            'edit post',
            'delete post',
            'manage users',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->givePermissionTo(Permission::all());

        $editor = Role::firstOrCreate(['name' => 'editor']);
        $editor->givePermissionTo(['view post', 'create post', 'edit post']);

        $viewer = Role::firstOrCreate(['name' => 'viewer']);
        $viewer->givePermissionTo(['view post']);
    }
}
