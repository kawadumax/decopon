import type { LinkProps } from "@tanstack/react-router";
import type { RegisteredRouter } from "@tanstack/react-router";

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  work_time: number;
  break_time: number;
  locale: Locale;
}

export enum Locale {
  ENGLISH = "en",
  JAPANESE = "ja",
}

export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  parent_task_id?: number;
  tags?: Tag[];
}

export type TaskStoreRequest = {
  title: string;
  description: string;
  parent_task_id?: number;
  tag_ids?: number[];
};

export enum LogSource {
  User = "User",
  System = "System",
}

export interface Log {
  id: number;
  content: string;
  source: LogSource;
  created_at: string;
  updated_at: string;
  user_id: number;
  task_id?: number;
}

export enum DecoponSessionStatus {
  InProgress = "In_Progress",
  Completed = "Completed",
  Interrupted = "Interrupted",
  Abandoned = "Abandoned",
  Extended = "Extended",
}

export interface DecoponSession {
  id: number;
  status: DecoponSessionStatus;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface CycleCount {
  date: string;
  count: number;
}

export interface TagResponse {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export type Tag = TagResponse;

export interface TagWithCheck {
  id: number;
  checked: boolean;
}

export type TagCheckable = Tag & TagWithCheck;

export type PageProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
  auth: {
    user: User;
  };
};

export interface Auth {
  user?: User;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserResponse {
  user: User;
}

export interface ProfileResponse {
  status?: string;
  mustVerifyEmail: boolean;
  user?: User;
}

export interface StatusResponse {
  status: string;
}

export interface PreferenceResponse {
  work_time: number;
  break_time: number;
  locale: Locale;
}

export type DecoponLinkProps = Pick<LinkProps<RegisteredRouter>, "to"> & {
  children: React.ReactNode;
  className?: string;
};

// Axios層
export type ApiRequestData = Record<string, unknown> | FormData | undefined;
