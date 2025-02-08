import { Tag as EmblorTag } from "emblor";

export interface User {
    id: number;
    preference: Preference;
    name: string;
    email: string;
    email_verified_at?: string;
}

export interface Preference {
    id: number;
    user_id: number;
    work_time: number;
    break_time: number;
}

export interface Task {
    id: number;
    user_id: number;
    parent_task_id?: number;
    title: string;
    completed: boolean;
    description: string;
    tags: Tag[];
}

export interface Log {
    id: number;
    user_id: number;
    task_id: number;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface TimeEntry {
    id: number;
    user_id: number;
    started_at: string;
    ended_at: string;
    status:
        | "In_Progress"
        | "Completed"
        | "Interrupted"
        | "Abandoned"
        | "Extended";
    created_at: string;
    updated_at: string;
}

export interface Tag {
    id: number;
    name: string;
    user_id: number;
    toEmblorTag: (this) => EmblorTag;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>
> = T & {
    auth: {
        user: User;
    };
};
