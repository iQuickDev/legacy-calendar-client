export interface CreateUserDto {
    username: string;
    password: string;
}

export interface UpdateUserDto {
    [key: string]: any;
}

export interface User {
    id: number;
    username: string;
    profilePicture?: string;
    [key: string]: any;
}
