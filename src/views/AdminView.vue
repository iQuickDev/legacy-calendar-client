<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api, { uploadsBaseURL } from '../services/API';
import type { User, CreateUserDto, UpdateUserDto } from '../types/User';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Avatar from 'primevue/avatar';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';

const toast = useToast();
const confirm = useConfirm();

const users = ref<User[]>([]);
const loading = ref(false);
const showUserDialog = ref(false);
const isEditing = ref(false);
const userForm = ref<CreateUserDto>({
    username: '',
    password: '',
    isAdmin: false
});
const editingUserId = ref<number | null>(null);
const existingPfp = ref<string | null>(null);

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const shouldRemovePfp = ref(false);

const triggerFileInput = () => {
    fileInput.value?.click();
};

const onFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        const file = target.files[0];

        // Validation
        if (!file.type.startsWith('image/')) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please select an image file',
                life: 3000
            });
            return;
        }

        selectedFile.value = file;
        shouldRemovePfp.value = false;

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewUrl.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
};

const removePicture = () => {
    selectedFile.value = null;
    previewUrl.value = null;
    shouldRemovePfp.value = true;
};


const fetchUsers = async () => {
    loading.value = true;
    try {
        const response = await api.findAllUsers();
        users.value = response.data;
        return true;
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to fetch users.',
            life: 3000
        });
        return false;
    } finally {
        loading.value = false;
    }
};

const openAddUser = () => {
    isEditing.value = false;
    userForm.value = { username: '', password: '', isAdmin: false };
    existingPfp.value = null;
    selectedFile.value = null;
    previewUrl.value = null;
    shouldRemovePfp.value = false;
    showUserDialog.value = true;
};

const editUser = (user: User) => {
    isEditing.value = true;
    editingUserId.value = user.id;
    existingPfp.value = user.profilePicture ?? null;
    userForm.value = {
        username: user.username,
        password: '',
        isAdmin: user.isAdmin
    };
    selectedFile.value = null;
    previewUrl.value = null;
    shouldRemovePfp.value = false;
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

const confirmDelete = (user: User) => {
    confirm.require({
        message: `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`,
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Delete',
            severity: 'danger'
        },
        accept: () => {
            deleteUser(user.id);
        }
    });
};

const saveUser = async () => {
    try {
        let userId = editingUserId.value;
        if (isEditing.value && userId) {
            const updateDto: UpdateUserDto = {
                username: userForm.value.username,
                isAdmin: userForm.value.isAdmin
            };
            if (userForm.value.password) {
                updateDto.password = userForm.value.password;
            }
            await api.updateUser(userId, updateDto);
        } else {
            await api.createUser(userForm.value);
            // Need to find the created user's ID for PFP upload
            await fetchUsers();
            const newUser = users.value.find((u) => u.username === userForm.value.username);
            if (newUser) {
                userId = newUser.id;
            }
        }

        // Handle profile picture
        if (userId) {
            if (shouldRemovePfp.value) {
                await api.removeProfilePicture(userId);
            } else if (selectedFile.value) {
                await api.uploadProfilePicture(selectedFile.value, userId);
            }
        }

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: isEditing.value ? 'User updated successfully' : 'User created successfully',
            life: 3000
        });
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
    fetchUsers();
});
</script>

<template>
    <div class="admin-container mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 md:p-8">
        <div class="animate-in fade-in flex flex-col gap-8 duration-500">
            <div class="flex flex-col items-start justify-between gap-6 pb-6 md:flex-row md:items-center">
                <div>
                    <h1 class="text-surface-0 mb-1 text-3xl font-black tracking-tight">User Management</h1>
                    <p class="text-surface-400">Manage system users, access levels, and credentials.</p>
                </div>
                <div class="flex items-center gap-3">
                    <Button label="Add New User" icon="pi pi-plus" @click="openAddUser" raised />
                </div>
            </div>

            <div class="bg-surface-950/50 overflow-hidden rounded-lg border border-gray-400 shadow-sm">
                <DataTable
                    :value="users"
                    :loading="loading"
                    class="p-datatable-lg border-none"
                    responsiveLayout="scroll"
                    sortField="username"
                    :sortOrder="1"
                    :pt="{
                        header: { class: '!bg-transparent !border-b !border-gray-600' },
                        bodyRow: { class: 'hover:!bg-surface-900/40 transition-colors' }
                    }"
                >
                    <Column field="id" header="ID" class="text-surface-500 w-24 font-mono" sortable></Column>
                    <Column header="User" class="text-surface-0 font-semibold" sortable sortField="username">
                        <template #body="slotProps">
                            <div class="flex items-center gap-3">
                                <Avatar
                                    :image="
                                        slotProps.data.profilePicture
                                            ? `${uploadsBaseURL}${slotProps.data.profilePicture}`
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
                    <Column header="Role" class="w-32">
                        <template #body="slotProps">
                            <Tag
                                :value="slotProps.data.isAdmin ? 'ADMIN' : 'USER'"
                                :severity="slotProps.data.isAdmin ? 'success' : 'secondary'"
                                class="font-bold"
                            />
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
                                    @click="confirmDelete(slotProps.data)"
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
                <div class="flex flex-col items-center gap-4 py-2">
                    <div class="group relative">
                        <Avatar
                            :image="previewUrl || (existingPfp ? `${uploadsBaseURL}${existingPfp}` : undefined)"
                            :label="
                                !previewUrl && !existingPfp
                                    ? userForm.username?.charAt(0)?.toUpperCase() || 'U'
                                    : undefined
                            "
                            size="xlarge"
                            shape="circle"
                            class="bg-primary text-primary-contrast border-surface-800 h-24! w-24! border-2 shadow-lg"
                        />
                        <div
                            class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                            @click="triggerFileInput"
                        >
                            <i class="pi pi-camera text-2xl text-white"></i>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <Button
                            v-if="previewUrl || existingPfp"
                            icon="pi pi-trash"
                            severity="danger"
                            text
                            rounded
                            @click="removePicture"
                            v-tooltip.bottom="'Remove Picture'"
                            class="h-10! w-10!"
                        />
                        <Button
                            :label="previewUrl || existingPfp ? 'Change' : 'Upload Picture'"
                            :icon="previewUrl || existingPfp ? 'pi pi-pencil' : 'pi pi-upload'"
                            text
                            @click="triggerFileInput"
                            class="text-sm!"
                        />
                    </div>
                    <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileSelect" />
                </div>

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
                <div class="mt-2 flex items-center gap-3">
                    <Checkbox id="isAdmin" v-model="userForm.isAdmin" binary />
                    <label for="isAdmin" class="text-surface-300 cursor-pointer font-medium">Administrator Access</label>
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
