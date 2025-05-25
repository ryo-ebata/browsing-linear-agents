import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import { handleWebhook } from './webhooks';
import { WebhookRequest, NotificationType } from './types/index';

// Mock the LinearClient
vi.mock('@linear/sdk', () => ({
  LinearClient: vi.fn().mockImplementation(() => ({
    viewer: { viewer: { id: 'test-user-id', organization: { name: 'Test Org' } } },
    commentAddReaction: vi.fn().mockResolvedValue(true),
    issueAddReaction: vi.fn().mockResolvedValue(true),
    commentCreate: vi.fn().mockResolvedValue({ id: 'comment-id' }),
    issue: vi.fn().mockResolvedValue({
      id: 'issue-id',
      state: { type: 'backlog' },
      team: { id: 'team-id' }
    }),
    workflowStates: vi.fn().mockResolvedValue({
      nodes: [
        { id: 'state-1', type: 'backlog' },
        { id: 'state-2', type: 'started' }
      ]
    }),
    issueUpdate: vi.fn().mockResolvedValue({ id: 'issue-id' })
  }))
}));

// Mock environment variables
vi.mock('dotenv', () => ({
  config: vi.fn()
}));

// Set environment variables for tests
process.env.LINEAR_WEBHOOK_SECRET = 'test-secret';
process.env.LINEAR_APP_USER_ID = 'test-app-user-id';
process.env.LINEAR_TOKEN = 'test-token';

describe('Webhook Handler', () => {
  let req: Partial<WebhookRequest>;
  let res: Partial<Response>;
  
  beforeEach(() => {
    req = {
      headers: {
        'linear-signature': 'valid-signature'
      },
      body: {
        type: 'AppUserNotification',
        action: NotificationType.IssueMention,
        createdAt: '2023-01-01T00:00:00Z',
        organizationId: 'org-id',
        oauthClientId: 'client-id',
        appUserId: 'test-app-user-id',
        notification: {
          id: 'notification-id',
          issue: {
            id: 'issue-id',
            title: 'Test Issue'
          }
        }
      }
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    };
    
    // Mock the crypto module
    vi.mock('crypto', () => ({
      createHmac: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('valid-signature')
      }),
      timingSafeEqual: vi.fn().mockReturnValue(true)
    }));
  });
  
  it('should process valid webhooks for the app user', async () => {
    await handleWebhook(req as WebhookRequest, res as Response);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('Webhook processed');
  });
  
  it('should ignore webhooks not for the app user', async () => {
    req.body.appUserId = 'different-user-id';
    
    await handleWebhook(req as WebhookRequest, res as Response);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('Webhook ignored');
  });
});

