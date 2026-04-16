export const USER_ROLES = ['user', 'admin', 'pm', 'pm-dev'] as const;

export type UserRole = (typeof USER_ROLES)[number];
