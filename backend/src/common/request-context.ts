import { randomUUID } from 'node:crypto';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ApiResponseMetaDto } from '@gradion/shared/common';
import type { NextFunction, Request, Response } from 'express';

import type { UserRole } from '@backend/modules/users/domain/user-role.enum';

export const REQUEST_ID_HEADER = 'x-request-id';

/** Canonical shape of the authenticated user placed on the request by Passport JWT. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AppRequest extends Request {
  requestId: string;
  user?: AuthenticatedUser;
}

/** Alias used by controllers that need typed access to `request.user`. */
export type AuthenticatedRequest = AppRequest;

/** Asserts the request is authenticated and returns the user. */
export function getAuthenticatedUser(request: AuthenticatedRequest): AuthenticatedUser {
  if (!request.user) {
    throw new UnauthorizedException('Authentication is required.');
  }
  return request.user;
}

/** Asserts the request is authenticated and the user holds the given role. */
export function getAuthenticatedUserWithRole(
  request: AuthenticatedRequest,
  role: UserRole,
): AuthenticatedUser {
  const user = getAuthenticatedUser(request);
  if (user.role !== role) {
    throw new ForbiddenException('You do not have access to this resource.');
  }
  return user;
}

export function attachRequestContext(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const requestId = resolveRequestId(request.headers[REQUEST_ID_HEADER]);
  const appRequest = request as AppRequest;

  appRequest.requestId = requestId;
  response.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}

export function createResponseMeta(request?: Partial<AppRequest>): ApiResponseMetaDto {
  return {
    requestId: request?.requestId ?? randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

function resolveRequestId(headerValue: string | string[] | undefined): string {
  if (Array.isArray(headerValue)) {
    return headerValue[0] ?? randomUUID();
  }

  if (typeof headerValue === 'string' && headerValue.length > 0) {
    return headerValue;
  }

  return randomUUID();
}
