import crypto from 'crypto';
import { Response } from 'express';
import { LinearClient } from '@linear/sdk';
import dotenv from 'dotenv';
import { WebhookRequest, Notification, NotificationType } from './types/index';

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

// Handle different notification types
async function handleNotification(notification: Notification, organizationId: string): Promise<void> {
  const { type, action } = notification;
  
  console.log(`Received notification: ${type} - ${action}`);
  
  // Get the Linear client for this organization
  // In production, you would retrieve the token from your database
  const token = LINEAR_TOKEN; // This should be organization-specific in production
  if (!token) {
    console.error('No token available for this organization');
    return;
  }
  
  const linearClient = new LinearClient({ accessToken: token });
  
  // Handle different notification types
  switch (action) {
    case NotificationType.IssueMention:
    case NotificationType.IssueCommentMention:
      await handleMention(notification, linearClient);
      break;
    
    case NotificationType.IssueAssignedToYou:
      await handleAssignment(notification, linearClient);
      break;
      
    // Add more handlers for other notification types
    default:
      console.log(`No handler for notification type: ${action}`);
  }
}

// Handle when the agent is mentioned
async function handleMention(notification: Notification, linearClient: LinearClient): Promise<void> {
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
async function handleAssignment(notification: Notification, linearClient: LinearClient): Promise<void> {
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

