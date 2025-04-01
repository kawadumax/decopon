import type { LinkProps } from "@tanstack/react-router";
import type { RegisteredRouter } from "@tanstack/react-router";

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
  locale: Locale;
}

export enum Locale {
  ENGLISH = "en",
  JAPANESE = "ja",
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

export enum LogSource {
  User = "User",
  System = "System",
}

export interface Log {
  id: number;
  user_id: number;
  task_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  source: LogSource;
}

export enum TimeEntryStatus {
  InProgress = "In_Progress",
  Completed = "Completed",
  Interrupted = "Interrupted",
  Abandoned = "Abandoned",
  Extended = "Extended",
}

export interface TimeEntry {
  id: number;
  user_id: number;
  started_at: string;
  ended_at: string;
  status: TimeEntryStatus;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  tasks?: Task[];
}

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

export type DecoponLinkProps = Pick<LinkProps<RegisteredRouter>, "to"> & {
  children: React.ReactNode;
  className?: string;
};

// Axios層
export type ApiData = Record<string, unknown> | FormData | undefined;
