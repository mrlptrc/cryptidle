import { test } from 'node:test';
import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CryptidleStack } from './stack.js';
test('private database host, retained encrypted disk, no SSH, restricted OIDC', () => {
  const template = Template.fromStack(new CryptidleStack(new App(), 'Test', { env: { account: '111111111111', region: 'us-east-1' } }));
  template.resourceCountIs('AWS::EC2::Instance', 1);
  template.hasResourceProperties('AWS::EC2::Instance', { DisableApiTermination: true, BlockDeviceMappings: Match.arrayWith([Match.objectLike({ Ebs: Match.objectLike({ Encrypted: true, DeleteOnTermination: false }) })]) });
  template.hasResourceProperties('AWS::EC2::LaunchTemplate', { LaunchTemplateData: Match.objectLike({ MetadataOptions: Match.objectLike({ HttpTokens: 'required' }) }) });
  template.hasResourceProperties('AWS::EC2::SecurityGroup', { SecurityGroupIngress: [{ CidrIp: '0.0.0.0/0', Description: 'from 0.0.0.0/0:443', FromPort: 443, IpProtocol: 'tcp', ToPort: 443 }, { CidrIp: '0.0.0.0/0', Description: 'from 0.0.0.0/0:80', FromPort: 80, IpProtocol: 'tcp', ToPort: 80 }] });
  template.hasResourceProperties('AWS::S3::Bucket', { PublicAccessBlockConfiguration: { BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true } });
  template.hasResourceProperties('AWS::IAM::Role', { AssumeRolePolicyDocument: Match.objectLike({ Statement: Match.arrayWith([Match.objectLike({ Condition: { StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com', 'token.actions.githubusercontent.com:sub': 'repo:mrlptrc/cryptidle:environment:production' } } })]) }) });
});
