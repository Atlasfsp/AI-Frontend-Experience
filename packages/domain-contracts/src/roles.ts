/**
 * Unified BAC platform roles.
 *
 * Web-origin roles: VIEWER, MEMBER, ADMIN, PLATFORM_ADMIN, OPERATOR
 * Mobile-persona roles: APPROVER, EXECUTIVE, SUPPORT_ENGINEER, COMPLIANCE_REVIEWER
 */

export const BAC_ROLES = [
  'VIEWER',
  'MEMBER',
  'ADMIN',
  'PLATFORM_ADMIN',
  'OPERATOR',
  'APPROVER',
  'EXECUTIVE',
  'SUPPORT_ENGINEER',
  'COMPLIANCE_REVIEWER',
] as const;

export type BacRole = (typeof BAC_ROLES)[number];

/** Roles ordered by ascending privilege level. */
export const roleHierarchy: readonly BacRole[] = [
  'VIEWER',
  'MEMBER',
  'APPROVER',
  'EXECUTIVE',
  'SUPPORT_ENGINEER',
  'COMPLIANCE_REVIEWER',
  'ADMIN',
  'PLATFORM_ADMIN',
  'OPERATOR',
] as const;

/** Roles that originate from the web platform. */
export const WEB_ROLES: readonly BacRole[] = [
  'VIEWER',
  'MEMBER',
  'ADMIN',
  'PLATFORM_ADMIN',
  'OPERATOR',
] as const;

/** Roles that originate from the mobile companion app. */
export const MOBILE_ROLES: readonly BacRole[] = [
  'APPROVER',
  'EXECUTIVE',
  'SUPPORT_ENGINEER',
  'COMPLIANCE_REVIEWER',
] as const;

/** Roles with elevated platform access (ADMIN and above in the hierarchy). */
const PRIVILEGED_ROLES = new Set<BacRole>(['ADMIN', 'PLATFORM_ADMIN', 'OPERATOR']);

/** Returns true if the role carries elevated platform privileges. */
export function isPrivilegedRole(role: BacRole): boolean {
  return PRIVILEGED_ROLES.has(role);
}

const MOBILE_PERSONA_SET = new Set<BacRole>(MOBILE_ROLES);

/** Returns true if the role is a mobile-persona role. */
export function isMobilePersonaRole(role: BacRole): boolean {
  return MOBILE_PERSONA_SET.has(role);
}
