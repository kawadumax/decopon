export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export interface Task {
    id: number;
    title: string;
    completed: boolean;
    description: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>
> = T & {
    auth: {
        user: User;
    };
};
