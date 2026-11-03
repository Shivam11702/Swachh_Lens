const { 
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
} = require('../src/validators/schemas');

describe('Validators', () => {
  describe('reportCreateSchema', () => {
    it('validates valid report data', () => {
      const data = {
        photos: [{ url: 'http://example.com/photo.jpg', thumbnail_url: 'http://example.com/thumb.jpg' }],
        gps: { lat: 12.9716, lon: 77.5946 },
        timestamp: '2024-01-01T10:00:00Z',
        comment: 'Test comment',
        user_id: 'U123',
      };
      const result = reportCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects empty photos array', () => {
      const data = {
        photos: [],
        gps: { lat: 12.9716, lon: 77.5946 },
      };
      const result = reportCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid GPS coordinates', () => {
      const data = {
        photos: [{ url: 'http://example.com/photo.jpg' }],
        gps: { lat: 100, lon: 200 },
      };
      const result = reportCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('reportActionSchema', () => {
    it('validates valid action data', () => {
      const data = {
        team_id: 'team-1',
        vehicle_id: 'vehicle-1',
        scheduled_time: '2024-01-01T10:00:00Z',
        note: 'Assigned to team',
      };
      const result = reportActionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing required fields', () => {
      const data = {};
      const result = reportActionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('reportStatusSchema', () => {
    it('validates valid status transitions', () => {
      const validStatuses = ['pending', 'processing', 'ready', 'assigned', 'in_progress', 'completed', 'closed', 'cancelled'];
      for (const status of validStatuses) {
        const result = reportStatusSchema.safeParse({ status, note: 'Test' });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid status', () => {
      const result = reportStatusSchema.safeParse({ status: 'invalid_status' });
      expect(result.success).toBe(false);
    });
  });

  describe('teamCreateSchema', () => {
    it('validates valid team data', () => {
      const data = {
        team_id: 'team-new',
        name: 'New Team',
        capabilities: ['garbage_dump', 'plastic_waste'],
        vehicle_types: ['small_van'],
      };
      const result = teamCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects invalid team_id format', () => {
      const data = {
        team_id: 'Team New',
        name: 'New Team',
      };
      const result = teamCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('vehicleCreateSchema', () => {
    it('validates valid vehicle data', () => {
      const data = {
        vehicle_id: 'vehicle-new',
        type: 'small_van',
        capacity_m3: 1.5,
      };
      const result = vehicleCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects invalid vehicle type', () => {
      const data = {
        vehicle_id: 'vehicle-new',
        type: 'invalid_type',
        capacity_m3: 1.5,
      };
      const result = vehicleCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects negative capacity', () => {
      const data = {
        vehicle_id: 'vehicle-new',
        type: 'small_van',
        capacity_m3: -1,
      };
      const result = vehicleCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('userRegisterSchema', () => {
    it('validates valid user registration', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'citizen',
      };
      const result = userRegisterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects short password', () => {
      const data = {
        email: 'test@example.com',
        password: 'short',
      };
      const result = userRegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const data = {
        email: 'not-an-email',
        password: 'password123',
      };
      const result = userRegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('userLoginSchema', () => {
    it('validates valid login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = userLoginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('listQuerySchema', () => {
    it('validates valid query params', () => {
      const data = {
        page: '1',
        limit: '20',
        status: 'pending',
        priority: 'high',
        sortBy: 'created_at',
        sortOrder: 'desc',
      };
      const result = listQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('uses defaults for missing params', () => {
      const data = {};
      const result = listQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    });

    it('rejects invalid limit', () => {
      const data = { limit: '200' };
      const result = listQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('webhookCreateSchema', () => {
    it('validates valid webhook data', () => {
      const data = {
        url: 'https://example.com/webhook',
        events: ['report.created', 'report.assigned'],
        secret: 'secret123',
        active: true,
      };
      const result = webhookCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL', () => {
      const data = {
        url: 'not-a-url',
        events: ['report.created'],
      };
      const result = webhookCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects empty events', () => {
      const data = {
        url: 'https://example.com/webhook',
        events: [],
      };
      const result = webhookCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid event types', () => {
      const data = {
        url: 'https://example.com/webhook',
        events: ['invalid.event'],
      };
      const result = webhookCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});