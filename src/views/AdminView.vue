<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useSessionStore } from '../stores/session';
import api, { type User, type CreateUserDto, type UpdateUserDto } from '../services/API';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import Card from 'primevue/card';

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
const editingUserId = ref<string | null>(null);

const isAuthenticated = computed(() => !!sessionStore.bypassToken);

const fetchUsers = async () => {
    if (!isAuthenticated.value) return;
    loading.value = true;
    try {
        const response = await api.findAllUsers();
        users.value = response.data;
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to fetch users',
            life: 3000
        });
        if (error.response?.status === 401 || error.response?.status === 403) {
            sessionStore.clearBypassToken();
        }
    } finally {
        loading.value = false;
    }
};

const handleBypassSubmit = async () => {
    if (!bypassInput.value) return;
    sessionStore.setBypassToken(bypassInput.value);
    await fetchUsers();
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

const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

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
    if (isAuthenticated.value) {
        fetchUsers();
    }
});
</script>

<template>
    <div class="admin-container p-4 md:p-6 flex flex-col gap-6">
        <Toast />

        <div v-if="!isAuthenticated" class="flex flex-col items-center justify-center min-h-[60vh]">
            <Card class="w-full max-w-sm !bg-black !border !border-surface-800">
                <template #title>
                    <div class="flex flex-col items-center gap-6 mb-4">
                        <div class="w-32 h-32 rounded-lg flex items-center justify-center">
                            <i class="pi pi-lock text-primary" style="font-size: 3rem"></i>
                        </div>
                        <h2 class="text-3xl font-bold text-center font-mono tracking-tighter">
                            Administration Dashboard
                        </h2>
                    </div>
                </template>
                <template #content>
                    <div class="flex flex-col gap-4">
                        <p class="text-center">Please enter the bypass password to manage users</p>
                        <div class="flex flex-col gap-3">
                            <Password v-signature="bypassInput" v-model="bypassInput" placeholder="Password"
                                :feedback="false" toggleMask fluid @keyup.enter="handleBypassSubmit"
                                inputClass="!bg-black !border-surface-800" />
                            <Button label="Login" @click="handleBypassSubmit" :loading="loading" />
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <div v-else class="flex flex-col gap-6">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 class="text-2xl sm:text-3xl font-bold">User Management</h1>
                    <p>Manage application users and their access.</p>
                </div>
                <div class="flex gap-2">
                    <Button label="Clear Session" icon="pi pi-lock" severity="secondary" outlined
                        @click="sessionStore.clearBypassToken()"
                        class="!border-surface-800 !text-surface-400 hover:!text-surface-0" />
                    <Button label="Add User" icon="pi pi-plus" @click="openAddUser" />
                </div>
            </div>

            <div class="rounded-lg w-max overflow-hidden">
                <DataTable :value="users" :loading="loading" class="p-datatable-sm no-stripes"
                    responsiveLayout="scroll">
                    <Column field="id" header="ID" class="text-surface-500"></Column>
                    <Column field="username" header="Username" class="text-surface-0 font-medium"></Column>
                    <Column header="Actions">
                        <template #body="slotProps">
                            <div>
                                <Button icon="pi pi-pencil" text rounded severity="secondary"
                                    @click="editUser(slotProps.data)" class="!text-surface-400 hover:!text-surface-0" />
                                <Button icon="pi pi-trash" text rounded severity="danger"
                                    @click="deleteUser(slotProps.data.id)" />
                            </div>
                        </template>
                    </Column>
                    <template #empty>
                        <div class="text-center p-8 text-surface-500 bg-black">
                            No users found in the system.
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>

        <Dialog v-model:visible="showUserDialog" :header="isEditing ? 'Edit User' : 'Add User'"
            :style="{ width: '400px' }" modal class="p-fluid">
            <div class="flex flex-col gap-4 pt-4">
                <div class="flex flex-col gap-2">
                    <label for="username" class="font-medium text-surface-300">Username</label>
                    <InputText id="username" v-model="userForm.username" required autofocus placeholder="Enter username"
                        class="!bg-black !border-surface-800" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="password" class="font-medium text-surface-300">
                        {{ isEditing ? 'New Password (Optional)' : 'Password' }}
                    </label>
                    <Password id="password" v-model="userForm.password" :feedback="!isEditing" toggleMask
                        placeholder="Enter password" inputClass="!bg-black !border-surface-800" />
                </div>
            </div>
            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button label="Cancel" text @click="showUserDialog = false" class="!text-surface-400" />
                    <Button label="Save" @click="saveUser" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped></style>
