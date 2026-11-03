const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SwachhLens API',
      version: '1.0.0',
      description: 'AI-powered waste response decision support system API',
      contact: {
        name: 'SwachhLens Team',
        email: 'support@swachhlens.local',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Report: {
          type: 'object',
          properties: {
            report_id: { type: 'string', example: 'R00001' },
            user_id: { type: 'string', nullable: true },
            photos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string', format: 'uri' },
                  thumbnail_url: { type: 'string', format: 'uri', nullable: true },
                },
              },
            },
            videos: { type: 'array', items: { type: 'string' } },
            gps: {
              type: 'object',
              properties: {
                lat: { type: 'number', format: 'double' },
                lon: { type: 'number', format: 'double' },
              },
              nullable: true,
            },
            timestamp: { type: 'string', format: 'date-time' },
            comment: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['pending', 'processing', 'ready', 'assigned', 'in_progress', 'completed', 'closed', 'cancelled'] },
            ml_results: {
              type: 'object',
              properties: {
                classification: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      confidence: { type: 'number' },
                    },
                  },
                },
                volume_bin: { type: 'string', enum: ['small', 'medium', 'large', 'very_large'] },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                triage_score: { type: 'number' },
                suggested_team_id: { type: 'string', nullable: true },
                suggested_vehicle_type: { type: 'string', nullable: true },
                duplicate_of: { type: 'string', nullable: true },
              },
            },
            assignment: {
              type: 'object',
              properties: {
                team_id: { type: 'string' },
                vehicle_id: { type: 'string' },
                scheduled_time: { type: 'string', format: 'date-time', nullable: true },
                note: { type: 'string', nullable: true },
              },
              nullable: true,
            },
            comments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  author: { type: 'string', nullable: true },
                  text: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' },
                },
              },
            },
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  payload: { type: 'object' },
                  created_at: { type: 'string', format: 'date-time' },
                },
              },
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Team: {
          type: 'object',
          properties: {
            team_id: { type: 'string' },
            name: { type: 'string' },
            capabilities: { type: 'array', items: { type: 'string' } },
            vehicle_types: { type: 'array', items: { type: 'string' } },
            available: { type: 'boolean' },
            members: { type: 'array', items: { type: 'string' } },
            lead_id: { type: 'string', nullable: true },
            coverage_area: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['Polygon'] },
                coordinates: { type: 'array', items: { type: 'array', items: { type: 'array', items: { type: 'number' } } } },
              },
            },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Vehicle: {
          type: 'object',
          properties: {
            vehicle_id: { type: 'string' },
            type: { type: 'string', enum: ['small_van', 'medium_truck', 'large_truck', 'other'] },
            capacity_m3: { type: 'number' },
            available: { type: 'boolean' },
            team_id: { type: 'string', nullable: true },
            current_location: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lon: { type: 'number' },
              },
              nullable: true,
            },
            last_maintenance: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['citizen', 'team_member', 'team_lead', 'admin', 'super_admin'] },
            team_id: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            avatar_url: { type: 'string', format: 'uri', nullable: true },
            preferences: {
              type: 'object',
              properties: {
                notifications: {
                  type: 'object',
                  properties: {
                    email: { type: 'boolean' },
                    push: { type: 'boolean' },
                    sms: { type: 'boolean' },
                  },
                },
                language: { type: 'string' },
                theme: { type: 'string', enum: ['light', 'dark', 'system'] },
              },
            },
            is_active: { type: 'boolean' },
            last_login: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { type: 'object' } },
            meta: {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' },
                    teamId: { type: 'string', nullable: true },
                  },
                },
                token: { type: 'string' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Reports', description: 'Waste report management' },
      { name: 'Teams', description: 'Team and vehicle management' },
      { name: 'Auth', description: 'Authentication' },
      { name: 'Admin', description: 'Admin user management' },
      { name: 'ML', description: 'Machine learning integration' },
      { name: 'Webhooks', description: 'Webhook management' },
      { name: 'Health', description: 'Health check' },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

module.exports = swaggerJsdoc(options);