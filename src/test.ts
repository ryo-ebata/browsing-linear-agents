import { LinearClient } from '@linear/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// This script tests the Linear API connection
async function testLinearConnection(): Promise<void> {
  const { LINEAR_TOKEN } = process.env;
  
  if (!LINEAR_TOKEN) {
    console.error('ERROR: LINEAR_TOKEN environment variable is not set');
    console.log('Please set LINEAR_TOKEN in your .env file after installing the agent');
    process.exit(1);
  }
  
  try {
    console.log('Testing Linear API connection...');
    
    const linearClient = new LinearClient({ accessToken: LINEAR_TOKEN });
    // @ts-ignore - The LinearClient type definitions are incomplete
    const viewerData = await linearClient.viewer;
    
    console.log('✅ Connection successful!');
    // @ts-ignore - The LinearClient type definitions are incomplete
    console.log(`Connected as: ${viewerData.name || viewerData.id}`);
    // @ts-ignore - The LinearClient type definitions are incomplete
    console.log(`Organization: ${viewerData.organization.name}`);
    
    // Test getting teams
    const teams = await linearClient.teams();
    console.log(`\nTeams in your organization:`);
    teams.nodes.forEach(team => {
      console.log(`- ${team.name} (${team.key})`);
    });
    
    console.log('\nYour Linear Agent environment is set up correctly!');
  } catch (error) {
    console.error('❌ Connection failed:', error instanceof Error ? error.message : String(error));
    console.log('Please check your LINEAR_TOKEN and try again');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testLinearConnection();
}

export { testLinearConnection };

