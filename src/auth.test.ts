import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupAuthRoutes } from './auth';
import { Express, Request, Response } from 'express';

// Mock the LinearClient
vi.mock('@linear/sdk', () => ({
  LinearClient: vi.fn().mockImplementation(() => ({
    viewer: { viewer: { id: 'test-user-id', organization: { name: 'Test Org' } } }
  }))
}));

// Mock fetch
vi.mock('node-fetch', async () => {
  const actual = await vi.importActual('node-fetch');
  return {
    ...actual,
    default: vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        access_token: 'test-access-token',
        organization_id: 'test-org-id'
      })
    })
  };
});

// Mock environment variables
vi.mock('dotenv', () => ({
  config: vi.fn()
}));

// Set environment variables for tests
process.env.LINEAR_CLIENT_ID = 'test-client-id';
process.env.LINEAR_CLIENT_SECRET = 'test-client-secret';
process.env.LINEAR_REDIRECT_URI = 'http://localhost:3000/auth/callback';

describe('Auth Routes', () => {
  let app: Partial<Express>;
  let routes: Record<string, (req: Request, res: Response) => void> = {};
  
  beforeEach(() => {
    routes = {};
    app = {
      get: vi.fn().mockImplementation((path, handler) => {
        routes[path] = handler;
      })
    };
    
    setupAuthRoutes(app as Express);
  });
  
  it('should set up auth routes', () => {
    expect(app.get).toHaveBeenCalledWith('/auth', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/auth/callback', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/api/token/:orgId', expect.any(Function));
  });
  
  it('should redirect to Linear OAuth page', () => {
    const req = {} as Request;
    const res = {
      redirect: vi.fn()
    } as unknown as Response;
    
    routes['/auth'](req, res);
    
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('https://linear.app/oauth/authorize'));
  });
  
  it('should handle OAuth callback', async () => {
    const req = {
      query: { code: 'test-auth-code' }
    } as unknown as Request;
    
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    } as unknown as Response;
    
    await routes['/auth/callback'](req, res);
    
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Linear Agent Installed Successfully'));
  });
});

