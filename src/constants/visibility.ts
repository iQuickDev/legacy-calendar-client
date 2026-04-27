export const VISIBILITY_OPTIONS = [
    { label: 'Private', value: 'private', icon: 'pi pi-lock', color: 'text-red-500' },
    { label: 'Standard', value: 'standard', icon: 'pi pi-users', color: 'text-zinc-500' },
    { label: 'Open', value: 'open', icon: 'pi pi-globe', color: 'text-emerald-500' }
];

export type EventVisibility = 'private' | 'standard' | 'open';
