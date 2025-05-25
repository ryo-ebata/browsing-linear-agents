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
  const { LINEAR_TOKEN, LINEAR_CLIENT_ID } = process.env;
  
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
  
  try {
    console.log('Setting up webhook for your Linear application...');
    
    const linearClient = new LinearClient({ accessToken: LINEAR_TOKEN });
    
    // Ask for the webhook URL
    rl.question('Enter your webhook URL (e.g., https://your-domain.com/webhook): ', async (webhookUrl: string) => {
      if (!webhookUrl) {
        console.error('Webhook URL is required');
        rl.close();
        return;
      }
      
      try {
        // Find the OAuth application
        const clientId = LINEAR_CLIENT_ID;
        
        // Find the OAuth application
        const oauthApps = await linearClient.oauthApplications();
        const app = oauthApps.nodes.find(app => app.clientId === clientId);
        
        if (!app) {
          console.error(`Could not find OAuth application with client ID: ${clientId}`);
          rl.close();
          return;
        }
        
        // Update the webhook URL
        await linearClient.oauthApplicationUpdate(app.id, {
          webhookUrl
        });
        
        console.log(`✅ Webhook URL updated to: ${webhookUrl}`);
        console.log('Your Linear Agent is now ready to receive webhook notifications!');
      } catch (error) {
        console.error('❌ Failed to update webhook URL:', error instanceof Error ? error.message : String(error));
      } finally {
        rl.close();
      }
    });
  } catch (error) {
    console.error('❌ Connection failed:', error instanceof Error ? error.message : String(error));
    console.log('Please check your LINEAR_TOKEN and try again');
    rl.close();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupWebhook();
}

export { setupWebhook };

