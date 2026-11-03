const { z } = require('zod');

const gpsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
}).optional().nullable();

const reportCreateSchema = z.object({
  gps: gpsSchema,
  timestamp: z.string().datetime().optional(),
  comment: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  estimated_volume: z.string().max(100).optional().nullable(),
  landmark: z.string().max(200).optional().nullable(),
  user_id: z.string().optional().nullable(),
  photos: z.array(z.object({
    url: z.string().url(),
    thumbnail_url: z.string().url().optional().nullable(),
  })).min(1, 'At least one photo is required'),
});

const reportActionSchema = z.object({
  team_id: z.string().min(1),
  vehicle_id: z.string().min(1),
  scheduled_time: z.string().datetime().optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

const reportUpdateSchema = z.object({
  comment: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  estimated_volume: z.string().max(100).optional().nullable(),
  landmark: z.string().max(200).optional().nullable(),
  gps: gpsSchema,
  user_id: z.string().optional().nullable(),
});

const reportStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'ready', 'assigned', 'in_progress', 'completed', 'closed', 'cancelled']),
  note: z.string().max(1000).optional().default(''),
});

const commentSchema = z.object({
  author: z.string().optional().nullable(),
  text: z.string().min(1).max(2000),
});

const teamCreateSchema = z.object({
  team_id: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(1).max(100),
  capabilities: z.array(z.string()).optional().default([]),
  vehicle_types: z.array(z.string()).optional().default([]),
  lead_id: z.string().optional().nullable(),
  coverage_area: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number()))).optional().default([]),
  }).optional(),
});

const teamUpdateSchema = teamCreateSchema.partial();

const vehicleCreateSchema = z.object({
  vehicle_id: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  type: z.enum(['small_van', 'medium_truck', 'large_truck', 'other']),
  capacity_m3: z.number().positive(),
  team_id: z.string().optional().nullable(),
});

const vehicleUpdateSchema = vehicleCreateSchema.partial();

const userRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['citizen', 'team_member', 'team_lead', 'admin', 'super_admin']).optional().default('citizen'),
  team_id: z.string().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
});

const userLoginSchema = z.object({
  email: z.string().min(1).max(200),
  password: z.string().min(1),
});

const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  preferences: z.object({
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
    }).optional(),
    language: z.string().optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
  }).optional(),
  role: z.enum(['citizen', 'team_member', 'team_lead', 'admin', 'super_admin']).optional(),
  team_id: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['pending', 'processing', 'ready', 'assigned', 'in_progress', 'completed', 'closed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  search: z.string().max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(100).optional(),
  assignedTeamId: z.string().optional(),
  assignedVehicleId: z.string().optional(),
  sortBy: z.string().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  role: z.enum(['citizen', 'team_member', 'team_lead', 'admin', 'super_admin']).optional(),
  team_id: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
});

const hotspotQuerySchema = z.object({
  bbox: z.string().optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  gridSize: z.coerce.number().positive().max(1).default(0.01),
});

const heatmapQuerySchema = z.object({
  bbox: z.string().optional(),
  gridSize: z.coerce.number().positive().max(1).default(0.005),
});

const timeseriesQuerySchema = z.object({
  interval: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
});

const webhookCreateSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'report.created',
    'report.updated',
    'report.status_changed',
    'report.assigned',
    'report.completed',
    'report.commented',
  ])).min(1),
  secret: z.string().optional(),
  active: z.boolean().default(true),
});

const webhookUpdateSchema = webhookCreateSchema.partial();

function validate(schema, part = 'body') {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req[part] || {});
      if (!result.success) {
        const details = result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details,
          },
        });
      }
      req.validated = { ...req.validated, [part]: result.data };
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  reportCreateSchema,
  reportActionSchema,
  reportStatusSchema,
  commentSchema,
  teamCreateSchema,
  teamUpdateSchema,
  vehicleCreateSchema,
  vehicleUpdateSchema,
  userRegisterSchema,
  userLoginSchema,
  userUpdateSchema,
  listQuerySchema,
  hotspotQuerySchema,
  heatmapQuerySchema,
  timeseriesQuerySchema,
  webhookCreateSchema,
  webhookUpdateSchema,
  validate,
};