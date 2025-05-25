import crypto from 'crypto';
import { Response } from 'express';
import { LinearClient } from '@linear/sdk';
import dotenv from 'dotenv';
import { WebhookRequest, Notification, NotificationType, AppUserNotification } from './types/index';

dotenv.config();

const { LINEAR_WEBHOOK_SECRET, LINEAR_APP_USER_ID, LINEAR_TOKEN } = process.env;

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature?: string): boolean {
  if (!LINEAR_WEBHOOK_SECRET || !signature) {
    console.warn('LINEAR_WEBHOOK_SECRET not set or signature missing, skipping signature verification');
    return true;
  }

  try {
    const hmac = crypto.createHmac('sha256', LINEAR_WEBHOOK_SECRET);
    const digest = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Handle webhook notifications
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const webhookReq = req as WebhookRequest;
  const signature = webhookReq.headers['linear-signature'];
  const payload = webhookReq.body;
  
  // Verify webhook signature
  if (!verifyWebhookSignature(signature, JSON.stringify(payload))) {
    res.status(401).send('Invalid webhook signature');
    return;
  }
  
  // Check if this is an app user notification
  if (payload.type !== 'AppUserNotification') {
    res.status(200).send('Not an app user notification');
    return;
  }
  
  try {
    // Get the Linear token for this organization
    const token = await getLinearToken(payload.organizationId);
    
    if (!token) {
      res.status(404).send('Token not found for this organization');
      return;
    }
    
    // Process the notification
    await processNotification(payload, token);
    
    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
}

// Process different types of notifications
async function processNotification(notification: AppUserNotification, token: string): Promise<void> {
  const { action } = notification;
  const linearClient = new LinearClient({ accessToken: token });
  
  // Get the app user ID from environment variables
  const appUserId = process.env.LINEAR_APP_USER_ID;
  
  if (!appUserId) {
    console.error('LINEAR_APP_USER_ID environment variable is not set');
    return;
  }
  
  // Only process notifications for our app user
  if (notification.appUserId !== appUserId) {
    console.log('Notification is not for our app user');
    return;
  }
  
  // Log the notification type
  console.log(`Processing notification: ${notification.action}`);
  
  // Handle different notification types
  switch (notification.action) {
    case NotificationType.IssueMention:
    case NotificationType.IssueCommentMention:
      await handleMention(linearClient, notification);
      break;
      
    case NotificationType.IssueAssignedToYou:
      await handleAssignment(linearClient, notification);
      break;
      
    case NotificationType.IssueCommentReaction:
      await handleReaction(linearClient, notification);
      break;
      
    case NotificationType.IssueStatusChanged:
      await handleStatusChange(linearClient, notification);
      break;
      
    default:
      console.log(`Unhandled notification type: ${notification.action}`);
  }
}

// Handle when the agent is mentioned
async function handleMention(linearClient: LinearClient, notification: AppUserNotification): Promise<void> {
  const { issue, comment } = notification;
  
  if (!issue) {
    console.error('Issue not found in notification');
    return;
  }
  
  // Acknowledge the mention with a reaction
  if (comment) {
    await linearClient.commentAddReaction(comment.id, 'eyes');
    
    // Reply to the comment
    await linearClient.commentCreate({
      issueId: issue.id,
      body: 'I received your mention! How can I help?',
      parentId: comment.id
    });
  } else {
    // React to the issue
    await linearClient.issueAddReaction(issue.id, 'eyes');
    
    // Comment on the issue
    await linearClient.commentCreate({
      issueId: issue.id,
      body: 'I received your mention! How can I help?'
    });
  }
}

// Handle when the agent is assigned to an issue
async function handleAssignment(linearClient: LinearClient, notification: AppUserNotification): Promise<void> {
  const { issue } = notification;
  
  if (!issue) {
    console.error('Issue not found in notification');
    return;
  }
  
  // Get the issue details
  const issueDetails = await linearClient.issue(issue.id);
  
  // If the issue is not in a started state, move it to the first started state
  if (issueDetails.state.type !== 'started') {
    // Get all states for the team
    const states = await linearClient.workflowStates({
      filter: {
        team: { id: { eq: issueDetails.team.id } }
      }
    });
    
    // Find the first started state
    const startedState = states.nodes.find(state => state.type === 'started');
    
    if (startedState) {
      // Update the issue state
      await linearClient.issueUpdate(issue.id, {
        stateId: startedState.id
      });
      
      // Add a comment
      await linearClient.commentCreate({
        issueId: issue.id,
        body: 'I\'ve started working on this issue!'
      });
    }
  }
}

// Handle when a comment reaction is added
async function handleReaction(linearClient: LinearClient, notification: AppUserNotification): Promise<void> {
  const { comment } = notification;
  
  if (!comment) {
    console.error('Comment not found in notification');
    return;
  }
  
  // React to the comment
  await linearClient.commentAddReaction(comment.id, 'eyes');
}

// Handle when an issue status changes
async function handleStatusChange(linearClient: LinearClient, notification: AppUserNotification): Promise<void> {
  const { issue } = notification;
  
  if (!issue) {
    console.error('Issue not found in notification');
    return;
  }
  
  // Get the issue details
  const issueDetails = await linearClient.issue(issue.id);
  
  // Log the new status
  console.log(`Issue status changed to: ${issueDetails.state.name}`);
}

// Get the Linear token for a given organization
async function getLinearToken(organizationId: string): Promise<string> {
  // In production, you would retrieve the token from your database
  return LINEAR_TOKEN; // This should be organization-specific in production
}

// Main webhook handler
export async function handleWebhook(req: WebhookRequest, res: Response): Promise<void> {
  const signature = req.headers['linear-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify the webhook signature
  if (!verifyWebhookSignature(payload, signature)) {
    res.status(401).send('Invalid signature');
    return;
  }
  
  const { type, action, organizationId, appUserId, notification } = req.body;
  
  // Check if this notification is for our app user
  if (type === 'AppUserNotification' && appUserId === LINEAR_APP_USER_ID) {
    try {
      await handleNotification(notification, organizationId);
      res.status(200).send('Webhook processed');
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Error processing webhook');
    }
  } else {
    // Not for our app user or not an app user notification
    res.status(200).send('Webhook ignored');
  }
}
