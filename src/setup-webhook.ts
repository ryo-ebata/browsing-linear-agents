import { LinearClient } from '@linear/sdk';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// This script helps set up the webhook URL for your Linear application
async function setupWebhook(organizationId: string, accessToken: string): Promise<void> {
  try {
    const linearClient = new LinearClient({ accessToken });
    
    // Get the OAuth application ID
    const { nodes: applications } = await linearClient.oauthApplications();
    const appId = applications[0]?.id;
    
    if (!appId) {
      console.error('No OAuth application found');
      return;
    }
    
    // Check if webhook already exists
    const { nodes: webhooks } = await linearClient.webhooks();
    const existingWebhook = webhooks.find(webhook => 
      webhook.url === WEBHOOK_URL && webhook.resource === 'AppUserNotification'
    );
    
    if (existingWebhook) {
      console.log('Webhook already exists');
      return;
    }
    
    // Create webhook
    const webhookSecret = process.env.LINEAR_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Missing LINEAR_WEBHOOK_SECRET environment variable');
      return;
    }
    
    // Get API keys for the application
    // Note: This is unused but kept for future reference
    // const apiKeys = await linearClient.apiKeys();
    
    // Create webhook for the application
    await linearClient.webhookCreate({
      url: WEBHOOK_URL,
      resource: 'AppUserNotification',
      secret: webhookSecret,
      enabled: true,
      label: 'Linear Agent Webhook'
    });
    
    console.log('Webhook created successfully');
  } catch (error) {
    console.error('Error setting up webhook:', error);
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupWebhook();
}

export { setupWebhook };
