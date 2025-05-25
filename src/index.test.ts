import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from './index';

// Mock the auth and webhook modules
vi.mock('./auth', () => ({
  setupAuthRoutes: vi.fn()
}));

vi.mock('./webhooks', () => ({
  handleWebhook: vi.fn((req, res) => res.status(200).send('Webhook processed'))
}));

describe('Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should serve static files', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  it('should handle webhook requests', async () => {
    const response = await request(app)
      .post('/webhook')
      .send({ type: 'AppUserNotification' });
    
    expect(response.status).toBe(200);
    expect(response.text).toBe('Webhook processed');
  });
});

