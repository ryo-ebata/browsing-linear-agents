import crypto from 'crypto';
import { LinearClient } from '@linear/sdk';
import dotenv from 'dotenv';

dotenv.config();

const { LINEAR_WEBHOOK_SECRET, LINEAR_APP_USER_ID } = process.env;

// Verify webhook signature
function verifyWebhookSignature(payload, signature) {
  if (!LINEAR_WEBHOOK_SECRET) {
    console.warn('LINEAR_WEBHOOK_SECRET not set, skipping signature verification');
    return true;
  }

  const hmac = crypto.createHmac('sha256', LINEAR_WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}

// Handle different notification types
async function handleNotification(notification, organizationId) {
  const { type, action } = notification;
  
  console.log(`Received notification: ${type} - ${action}`);
  
  // Get the Linear client for this organization
  // In production, you would retrieve the token from your database
  const token = process.env.LINEAR_TOKEN; // This should be organization-specific in production
  if (!token) {
    console.error('No token available for this organization');
    return;
  }
  
  const linearClient = new LinearClient({ accessToken: token });
  
  // Handle different notification types
  switch (action) {
    case 'issueMention':
    case 'issueCommentMention':
      await handleMention(notification, linearClient);
      break;
    
    case 'issueAssignedToYou':
      await handleAssignment(notification, linearClient);
      break;
      
    // Add more handlers for other notification types
    default:
      console.log(`No handler for notification type: ${action}`);
  }
}

// Handle when the agent is mentioned
async function handleMention(notification, linearClient) {
  const { issue, comment } = notification;
  
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
async function handleAssignment(notification, linearClient) {
  const { issue } = notification;
  
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
export async function handleWebhook(req, res) {
  const signature = req.headers['linear-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify the webhook signature
  if (!verifyWebhookSignature(payload, signature)) {
    return res.status(401).send('Invalid signature');
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

