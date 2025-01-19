export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export interface Task {
    id: number;
    user_id: number;
    parent_task_id?: number;
    title: string;
    completed: boolean;
    description: string;
}

export interface Log {
    id: number;
    user_id: number;
    task_id: number;
    content: string;
    created_at: string,
    updated_at: string;
}


export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>
> = T & {
    auth: {
        user: User;
    };
};
