export const endpoints = {
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
} as const;

export type Endpoints = typeof endpoints;
