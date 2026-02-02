import { z } from 'zod';
import { insertUserSchema, insertUploadSchema, uploads, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    changePassword: {
        method: 'POST' as const,
        path: '/api/change-password',
        input: z.object({
            currentPassword: z.string(),
            newPassword: z.string(),
        }),
        responses: {
            200: z.object({ message: z.string() }),
            400: errorSchemas.validation,
            401: errorSchemas.unauthorized,
        }
    }
  },
  uploads: {
    listPublic: {
      method: 'GET' as const,
      path: '/api/uploads/public',
      responses: {
        200: z.array(z.custom<typeof uploads.$inferSelect>()),
      },
    },
    listAll: { // For admin
      method: 'GET' as const,
      path: '/api/uploads/all',
      input: z.object({
          folder: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof uploads.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/uploads/:id',
      responses: {
        200: z.custom<typeof uploads.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/uploads',
      // Input is FormData, so we don't strictly validate body structure here with Zod in the same way, 
      // but we can define what fields we expect in the form data.
      // The actual file handling happens in the route.
      // We'll use the schema for the text fields.
      input: z.any(), 
      responses: {
        201: z.custom<typeof uploads.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/uploads/:id',
      input: insertUploadSchema.partial(),
      responses: {
        200: z.custom<typeof uploads.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/uploads/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
