<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminRole = Role::where('name', 'super_admin')->first();
        $adminRole = Role::where('name', 'admin')->first();
        $managerRole = Role::where('name', 'manager')->first();
        $cashierRole = Role::where('name', 'cashier')->first();
        $goldsmithRole = Role::where('name', 'goldsmith')->first();
        $accountantRole = Role::where('name', 'accountant')->first();

        $users = [
            [
                'name' => 'Super Administrator',
                'email' => 'superadmin@gmail.com',
                'phone' => '+855 (0) 12 999 000',
                'password' => Hash::make('SuperAdmin@123'),
                'role_id' => $superAdminRole?->id,
                'status' => 'active',
                'role_name' => 'super_admin',
            ],
            [
                'name' => 'Sokha Chea (Admin)',
                'email' => 'admin@gmail.com',
                'phone' => '+855 (0) 12 888 999',
                'password' => Hash::make('Admin@123'),
                'role_id' => $adminRole?->id,
                'status' => 'active',
                'role_name' => 'admin',
            ],
            [
                'name' => 'Bopha Meas (Manager)',
                'email' => 'manager@gmail.com',
                'phone' => '+855 (0) 17 777 666',
                'password' => Hash::make('Manager@123'),
                'role_id' => $managerRole?->id,
                'status' => 'active',
                'role_name' => 'manager',
            ],
            [
                'name' => 'Chantou Rath (Cashier)',
                'email' => 'cashier@gmail.com',
                'phone' => '+855 (0) 93 555 444',
                'password' => Hash::make('Cashier@123'),
                'role_id' => $cashierRole?->id,
                'status' => 'active',
                'role_name' => 'cashier',
            ],
            [
                'name' => 'Dara Pich (Master Goldsmith)',
                'email' => 'goldsmith@gmail.com',
                'phone' => '+855 (0) 89 222 333',
                'password' => Hash::make('Goldsmith@123'),
                'role_id' => $goldsmithRole?->id,
                'status' => 'active',
                'role_name' => 'goldsmith',
            ],
            [
                'name' => 'Kosal Sam (Accountant)',
                'email' => 'accountant@gmail.com',
                'phone' => '+855 (0) 70 111 222',
                'password' => Hash::make('Accountant@123'),
                'role_id' => $accountantRole?->id,
                'status' => 'active',
                'role_name' => 'accountant',
            ],
        ];

        foreach ($users as $userData) {
            $roleName = $userData['role_name'];
            unset($userData['role_name']);

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            if ($roleName) {
                $user->syncRoles([$roleName]);
            }
        }
    }
}
