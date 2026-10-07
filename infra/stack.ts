import { Stack, type StackProps, RemovalPolicy, Duration, CfnOutput, Tags, aws_ec2 as ec2, aws_iam as iam, aws_ecr as ecr, aws_s3 as s3, aws_logs as logs, aws_ssm as ssm, aws_budgets as budgets, aws_cloudwatch as cw } from 'aws-cdk-lib';
import { Construct } from 'constructs';
export class CryptidleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    Tags.of(this).add('Project', 'Cryptidle'); Tags.of(this).add('Environment', 'private-mvp');
    const vpc = new ec2.Vpc(this, 'Network', { maxAzs: 1, natGateways: 0, subnetConfiguration: [{ name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 }] });
    const sg = new ec2.SecurityGroup(this, 'WebSecurity', { vpc, description: 'HTTPS and ACME only; administration via SSM' });
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443)); sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    const repo = new ecr.Repository(this, 'Images', { imageScanOnPush: true, imageTagMutability: ecr.TagMutability.IMMUTABLE, removalPolicy: RemovalPolicy.RETAIN, lifecycleRules: [{ maxImageCount: 30 }] });
    const backups = new s3.Bucket(this, 'Backups', { blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, enforceSSL: true, encryption: s3.BucketEncryption.S3_MANAGED, versioned: true, removalPolicy: RemovalPolicy.RETAIN, lifecycleRules: [{ expiration: Duration.days(35), noncurrentVersionExpiration: Duration.days(35) }] });
    const logGroup = new logs.LogGroup(this, 'Logs', { retention: logs.RetentionDays.TWO_WEEKS, removalPolicy: RemovalPolicy.RETAIN });
    const role = new iam.Role(this, 'HostRole', { assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'), managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')] });
    repo.grantPull(role); backups.grantPut(role, 'database/*'); logGroup.grantWrite(role);
    role.addToPolicy(new iam.PolicyStatement({ actions: ['ssm:GetParameter'], resources: [this.formatArn({ service: 'ssm', resource: 'parameter', resourceName: 'cryptidle/runtime-env' })] }));
    const host = new ec2.Instance(this, 'Host', { vpc, vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }, securityGroup: sg, role, instanceType: new ec2.InstanceType(this.node.tryGetContext('instanceType') || 't3.small'), machineImage: ec2.MachineImage.latestAmazonLinux2023(), requireImdsv2: true, blockDevices: [{ deviceName: '/dev/xvda', volume: ec2.BlockDeviceVolume.ebs(30, { encrypted: true, volumeType: ec2.EbsDeviceVolumeType.GP3, deleteOnTermination: false }) }] });
    host.applyRemovalPolicy(RemovalPolicy.RETAIN);
    (host.node.defaultChild as ec2.CfnInstance).disableApiTermination = true;
    host.addUserData('dnf install -y docker amazon-cloudwatch-agent', 'systemctl enable --now docker', 'mkdir -p /usr/local/lib/docker/cli-plugins /opt/cryptidle', 'curl -fsSL https://github.com/docker/compose/releases/download/v2.39.4/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose', 'chmod 755 /usr/local/lib/docker/cli-plugins/docker-compose', 'chmod 700 /opt/cryptidle');
    const address = new ec2.CfnEIP(this, 'Address', { domain: 'vpc' }); new ec2.CfnEIPAssociation(this, 'AddressAttachment', { allocationId: address.attrAllocationId, instanceId: host.instanceId });
    const providerArn = this.node.tryGetContext('oidcProviderArn');
    const provider = providerArn ? iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(this, 'GitHubProvider', providerArn) : new iam.OpenIdConnectProvider(this, 'GitHubProvider', { url: 'https://token.actions.githubusercontent.com', clientIds: ['sts.amazonaws.com'] });
    const deployRole = new iam.Role(this, 'DeployRole', { assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, { StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com', 'token.actions.githubusercontent.com:sub': `repo:${this.node.tryGetContext('githubRepository') || 'mrlptrc/cryptidle'}:environment:${this.node.tryGetContext('environment') || 'production'}` } }) });
    repo.grantPullPush(deployRole);
    deployRole.addToPolicy(new iam.PolicyStatement({ actions: ['ssm:SendCommand'], resources: [this.formatArn({ service: 'ec2', resource: 'instance', resourceName: host.instanceId }), this.formatArn({ service: 'ssm', account: '', resource: 'document', resourceName: 'AWS-RunShellScript' })] }));
    deployRole.addToPolicy(new iam.PolicyStatement({ actions: ['ssm:GetCommandInvocation'], resources: ['*'] }));
    const cpuAlarm = new cw.Alarm(this, 'CpuAlarm', { metric: new cw.Metric({ namespace: 'AWS/EC2', metricName: 'CPUUtilization', dimensionsMap: { InstanceId: host.instanceId }, statistic: 'Average', period: Duration.minutes(5) }), threshold: 85, evaluationPeriods: 3 });
    const email = this.node.tryGetContext('budgetEmail');
    if (email) new budgets.CfnBudget(this, 'Budget', { budget: { budgetName: 'cryptidle-monthly', budgetType: 'COST', timeUnit: 'MONTHLY', budgetLimit: { amount: this.node.tryGetContext('budgetUsd') || 30, unit: 'USD' } }, notificationsWithSubscribers: [{ notification: { comparisonOperator: 'GREATER_THAN', notificationType: 'ACTUAL', threshold: 80, thresholdType: 'PERCENTAGE' }, subscribers: [{ subscriptionType: 'EMAIL', address: email }] }] });
    new ssm.StringParameter(this, 'BackupBucketParameter', { parameterName: '/cryptidle/backup-bucket', stringValue: backups.bucketName });
    for (const [key, value] of Object.entries({ InstanceId: host.instanceId, PublicIp: address.ref, RepositoryUri: repo.repositoryUri, BackupBucket: backups.bucketName, LogGroup: logGroup.logGroupName, DeployRoleArn: deployRole.roleArn, CpuAlarmName: cpuAlarm.alarmName })) new CfnOutput(this, key, { value });
  }
}
