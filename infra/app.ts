import { App } from 'aws-cdk-lib';
import { CryptidleStack } from './stack.js';
const app = new App();
new CryptidleStack(app, 'Cryptidle', { env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: app.node.tryGetContext('region') || 'us-east-1' }, terminationProtection: true });
