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
async function setupWebhook(): Promise<void> {
  const { LINEAR_TOKEN, LINEAR_CLIENT_ID, LINEAR_WEBHOOK_URL } = process.env;
  const WEBHOOK_URL = LINEAR_WEBHOOK_URL || '';
  
  if (!LINEAR_TOKEN) {
    console.error('ERROR: LINEAR_TOKEN environment variable is not set');
    console.log('Please set LINEAR_TOKEN in your .env file after installing the agent');
    process.exit(1);
  }
  
  if (!LINEAR_CLIENT_ID) {
    console.error('ERROR: LINEAR_CLIENT_ID environment variable is not set');
    console.log('Please set LINEAR_CLIENT_ID in your .env file');
    process.exit(1);
  }
  
  if (!WEBHOOK_URL) {
    console.error('ERROR: LINEAR_WEBHOOK_URL environment variable is not set');
    console.log('Please set LINEAR_WEBHOOK_URL in your .env file');
    process.exit(1);
  }
  
  try {
    console.log('Setting up webhook for your Linear application...');
    
    const linearClient = new LinearClient({ accessToken: LINEAR_TOKEN });
    
    try {
      // Create webhook for the application using the raw API method
      // @ts-ignore - The LinearClient type definitions are incomplete
      await linearClient.webhookCreate({
        url: WEBHOOK_URL,
        resourceTypes: ['AppUserNotification'],
        label: 'Linear Agent Webhook'
      });
      
      console.log(`✅ Webhook created successfully at: ${WEBHOOK_URL}`);
      console.log('Your Linear Agent is now ready to receive webhook notifications!');
    } catch (error) {
      console.error('❌ Failed to create webhook:', error instanceof Error ? error.message : String(error));
    }
  } catch (error) {
    console.error('❌ Connection failed:', error instanceof Error ? error.message : String(error));
    console.log('Please check your LINEAR_TOKEN and try again');
  } finally {
    rl.close();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupWebhook();
}

export { setupWebhook };

