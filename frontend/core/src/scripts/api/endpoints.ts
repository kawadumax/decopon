export const backendEndpoints = {
  laravel: {
    v1: {
      auth: {
        getUser: "/api/v1/user",
        login: "/api/v1/login",
        logout: "/api/v1/logout",
      },
      tasks: {
        index: "/api/v1/tasks",
        store: "/api/v1/tasks",
        update: (id: number) => `/api/v1/tasks/${id}`,
        destroy: (id: number) => `/api/v1/tasks/${id}`,
        updateComplete: (id: number) => `/api/v1/tasks/${id}/complete`,
        updateTags: (id: number) => `/api/v1/tasks/${id}/tags`,
      },
      timeEntries: {
        progress: "/api/v1/time-entries/progress",
        interrupt: "/api/v1/time-entries/interrupt",
        store: "/api/v1/time-entries",
        update: (id: number) => `/api/v1/time-entries/${id}`,
        cycles: (date: string) => `/api/v1/time-entries/cycles?date=${date}`,
      },
      tags: {
        index: "/api/v1/tags",
        store: "/api/v1/tags",
        update: (id: number) => `/api/v1/tags/${id}`,
        destroy: (id: number) => `/api/v1/tags/${id}`,
        destroyMany: "/api/v1/tags",
        relationDestroy: "/api/v1/tags/relation",
      },
      logs: {
        index: "/api/v1/logs",
        task: (id: number) => `/api/v1/logs/task/${id}`,
      },
    },
  },
  axum: {
    v1: {
      auth: {
        getUser: "/auth/users",
        login: "/auth/sessions",
        logout: "/auth/sessions",
        register: "/auth/users",
        forgotPassword: "/auth/password/forgot",
        resetPassword: "/auth/password/reset",
        confirmPassword: "/auth/password/confirm",
        verifyEmail: (token: string) => `/auth/email/verify/${token}`,
        resendVerification: "/auth/email/resend",
        local: {
          session: "/auth/local/session",
        },
      },
      tasks: {
        index: "/tasks",
        store: "/tasks",
        update: (id: number) => `/tasks/${id}`,
        destroy: (id: number) => `/tasks/${id}`,
        show: (id: number) => `/tasks/${id}`,
      },
      decoponSessions: {
        index: "/decopon_sessions",
        store: "/decopon_sessions",
        show: (id: number) => `/decopon_sessions/${id}`,
        update: (id: number) => `/decopon_sessions/${id}`,
        destroy: (id: number) => `/decopon_sessions/${id}`,
        cycles: "/decopon_sessions/cycles",
      },
      tags: {
        index: "/tags",
        store: "/tags",
        relation: "/tags/relation",
        relationDestroy: "/tags/relation",
        destroyMany: "/tags/multiple",
      },
      logs: {
        index: "/logs",
        store: "/logs",
        task: (id: number) => `/logs/task/${id}`,
      },
      profiles: {
        show: "/profiles",
        update: "/profiles",
        destroy: "/profiles",
        passwordUpdate: "/profiles/password",
      },
      preferences: {
        update: "/preferences",
      },
    },
  },
} as const;

export type Backend = keyof typeof backendEndpoints;
const envBackend = import.meta.env.VITE_BACKEND as Backend | undefined;
export const currentBackend: Backend = envBackend ?? "axum";
type AxumEndpoints = (typeof backendEndpoints)["axum"]["v1"];
export const endpoints: AxumEndpoints =
  backendEndpoints[currentBackend].v1 as AxumEndpoints;
