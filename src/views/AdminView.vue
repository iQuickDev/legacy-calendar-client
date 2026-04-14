<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSessionStore } from '../stores/session';
import api, { baseURL } from '../services/API';
import type { User, CreateUserDto, UpdateUserDto } from '../types/User';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Card from 'primevue/card';
import Avatar from 'primevue/avatar';

const sessionStore = useSessionStore();
const toast = useToast();

const users = ref<User[]>([]);
const loading = ref(false);
const bypassInput = ref('');
const showUserDialog = ref(false);
const isEditing = ref(false);
const userForm = ref<CreateUserDto>({
    username: '',
    password: ''
});
const editingUserId = ref<number | null>(null);

const isVerified = ref(false);

const fetchUsers = async () => {
    if (!sessionStore.bypassToken) return false;
    loading.value = true;
    try {
        const response = await api.findAllUsers();
        users.value = response.data;
        isVerified.value = true;
        return true;
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Invalid Password',
            detail: error.response?.data?.message || 'The provided bypass password is incorrect.',
            life: 3000
        });
        sessionStore.clearBypassToken();
        isVerified.value = false;
        return false;
    } finally {
        loading.value = false;
    }
};

const handleBypassSubmit = async () => {
    if (!bypassInput.value || loading.value) return;

    // Set the token temporarily to attempt fetch
    sessionStore.setBypassToken(bypassInput.value);
    const success = await fetchUsers();

    if (success) {
        bypassInput.value = ''; // Clear input on success
    }
};

const openAddUser = () => {
    isEditing.value = false;
    userForm.value = { username: '', password: '' };
    showUserDialog.value = true;
};

const editUser = (user: User) => {
    isEditing.value = true;
    editingUserId.value = user.id;
    userForm.value = {
        username: user.username,
        password: ''
    };
    showUserDialog.value = true;
};

const deleteUser = async (id: number) => {
    try {
        await api.removeUser(id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User deleted successfully',
            life: 3000
        });
        await fetchUsers();
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to delete user',
            life: 3000
        });
    }
};

const saveUser = async () => {
    try {
        if (isEditing.value && editingUserId.value) {
            const updateDto: UpdateUserDto = { username: userForm.value.username };
            if (userForm.value.password) {
                updateDto.password = userForm.value.password;
            }
            await api.updateUser(editingUserId.value, updateDto);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'User updated successfully',
                life: 3000
            });
        } else {
            await api.createUser(userForm.value);
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'User created successfully',
                life: 3000
            });
        }
        showUserDialog.value = false;
        await fetchUsers();
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to save user',
            life: 3000
        });
    }
};

onMounted(() => {
    if (sessionStore.bypassToken) {
        fetchUsers();
    }
});
</script>

<template>
    <div class="admin-container mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 md:p-8">
        <div v-if="!isVerified" class="flex min-h-[70vh] flex-col items-center justify-center">
            <Card class="w-full max-w-sm border border-gray-500">
                <template #title>
                    <div class="mb-4 flex flex-col items-center gap-6 pt-4">
                        <div
                            class="bg-surface-900 border-surface-800 flex h-20 w-20 items-center justify-center rounded-2xl border shadow-inner"
                        >
                            <i class="pi pi-shield text-primary" style="font-size: 2.5rem"></i>
                        </div>
                        <h2 class="text-center text-2xl font-bold tracking-tight">Admin Dashboard</h2>
                    </div>
                </template>
                <template #content>
                    <div class="flex flex-col gap-6">
                        <p class="text-center text-sm">Here you can manage users</p>
                        <div class="flex flex-col gap-3">
                            <Password
                                v-model="bypassInput"
                                placeholder="Password"
                                :feedback="false"
                                toggleMask
                                fluid
                                @keyup.enter="handleBypassSubmit"
                                inputClass="!bg-surface-950 !border-surface-800 !py-3 w-full"
                            />
                            <Button
                                label="Login"
                                @click="handleBypassSubmit"
                                :loading="loading"
                                class="py-3! font-bold"
                            />
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <div v-else class="animate-in fade-in flex flex-col gap-8 duration-500">
            <div class="flex flex-col items-start justify-between gap-6 pb-6 md:flex-row md:items-center">
                <div>
                    <h1 class="text-surface-0 mb-1 text-3xl font-black tracking-tight">User Management</h1>
                    <p class="text-surface-400">Manage system users, access levels, and credentials.</p>
                </div>
                <div class="flex items-center gap-3">
                    <Button
                        label="Logout"
                        icon="pi pi-power-off"
                        severity="danger"
                        @click="
                            isVerified = false;
                            sessionStore.clearBypassToken();
                        "
                        class="text-surface-400! hover:text-danger-400! transition-colors"
                    />
                    <Button label="Add New User" icon="pi pi-plus" @click="openAddUser" raised />
                </div>
            </div>

            <div class="bg-surface-950/50 overflow-hidden rounded-lg border border-gray-400 shadow-sm">
                <DataTable
                    :value="users"
                    :loading="loading"
                    class="p-datatable-lg border-none"
                    responsiveLayout="scroll"
                    :pt="{
                        header: { class: '!bg-transparent !border-b !border-gray-600' },
                        bodyRow: { class: 'hover:!bg-surface-900/40 transition-colors' }
                    }"
                >
                    <Column field="id" header="ID" class="text-surface-500 w-24 font-mono"></Column>
                    <Column header="User" class="text-surface-0 font-semibold" sortable sortField="username">
                        <template #body="slotProps">
                            <div class="flex items-center gap-3">
                                <Avatar
                                    :image="
                                        slotProps.data.profilePicture
                                            ? `${baseURL}${slotProps.data.profilePicture}`
                                            : undefined
                                    "
                                    :label="
                                        !slotProps.data.profilePicture
                                            ? slotProps.data.username?.charAt(0)?.toUpperCase() || 'U'
                                            : undefined
                                    "
                                    shape="circle"
                                    class="bg-primary text-primary-contrast"
                                />
                                <span>{{ slotProps.data.username }}</span>
                            </div>
                        </template>
                    </Column>
                    <Column header="Actions" class="w-32">
                        <template #body="slotProps">
                            <div class="flex items-center justify-end gap-1">
                                <Button
                                    icon="pi pi-pencil"
                                    text
                                    rounded
                                    severity="secondary"
                                    @click="editUser(slotProps.data)"
                                    v-tooltip.top="'Edit User'"
                                    class="text-surface-400! hover:text-primary-400! h-10! w-10!"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    text
                                    rounded
                                    severity="danger"
                                    @click="deleteUser(slotProps.data.id)"
                                    v-tooltip.top="'Delete User'"
                                    class="text-surface-500! hover:text-danger-500! h-10! w-10!"
                                />
                            </div>
                        </template>
                    </Column>
                    <template #empty>
                        <div class="text-surface-500 flex flex-col items-center justify-center p-12">
                            <i class="pi pi-users mb-4" style="font-size: 2rem"></i>
                            <p>No users found in the system registry.</p>
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>

        <Dialog
            v-model:visible="showUserDialog"
            :header="isEditing ? 'Edit User' : 'Add User'"
            :style="{ width: '400px' }"
            modal
            class="p-fluid"
        >
            <div class="flex flex-col gap-4 pt-4">
                <div class="flex flex-col gap-2">
                    <label for="username" class="text-surface-300 font-medium">Username</label>
                    <InputText
                        id="username"
                        v-model="userForm.username"
                        required
                        autofocus
                        placeholder="Enter username"
                        class="border-surface-800! bg-black!"
                        @keyup.enter="saveUser"
                    />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="password" class="text-surface-300 font-medium">
                        {{ isEditing ? 'New Password' : 'Password' }}
                    </label>
                    <Password
                        id="password"
                        v-model="userForm.password"
                        :feedback="!isEditing"
                        toggleMask
                        placeholder="Enter password"
                        inputClass="!bg-black !border-surface-800 w-full"
                        fluid
                        @keyup.enter="saveUser"
                    />
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" text @click="showUserDialog = false" class="text-surface-400!" />
                    <Button label="Save" @click="saveUser" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-password-input) {
    width: 100%;
}
</style>
