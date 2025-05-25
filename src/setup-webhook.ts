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
    
    // Ask for the webhook URL if not provided in environment
    const askForWebhookUrl = (): Promise<string> => {
      return new Promise((resolve) => {
        if (LINEAR_WEBHOOK_URL) {
          resolve(LINEAR_WEBHOOK_URL);
          return;
        }
        
        rl.question('Enter your webhook URL (e.g., https://your-domain.com/webhook): ', (webhookUrl: string) => {
          if (!webhookUrl) {
            console.error('Webhook URL is required');
            rl.close();
            process.exit(1);
          }
          resolve(webhookUrl);
        });
      });
    };
    
    const webhookUrl = await askForWebhookUrl();
    
    try {
      // Get the current application
      const apiKeys = await linearClient.apiKeys();
      const clientId = LINEAR_CLIENT_ID;
      
      // Find the OAuth application
      // @ts-ignore - The LinearClient type definitions don't include oauthApplications method
      const oauthApps = await linearClient.oauthApplications();
      // @ts-ignore - Using any type for app since we don't have proper type definitions
      const app: any = oauthApps.nodes.find((app: any) => app.clientId === clientId);
      
      if (!app) {
        console.error(`Could not find OAuth application with client ID: ${clientId}`);
        rl.close();
        return;
      }
      
      // Update the webhook URL
      // @ts-ignore - The LinearClient type definitions are incomplete
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
