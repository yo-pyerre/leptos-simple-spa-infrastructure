import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { CfnBucket, CfnBucketPolicy } from 'aws-cdk-lib/aws-s3'

import { reformatBucketConstructLogicalId } from './helpers';

export class WebsiteStack extends Stack {
  public readonly frontendAssetsBucketName: string;
  public readonly lambdaDeploymentBucketName: string

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.frontendAssetsBucketName = this.createFrontendAssetsBucket();
    this.lambdaDeploymentBucketName = this.createLambdaBucket();
    
    new CfnOutput(this, `${this.node.id}-FrontendAssetsBucketName`, { 
      value: this.frontendAssetsBucketName,
      exportName: 'FrontendAssetsBucketName'
     });

     new CfnOutput(this, `${this.node.id}-LambdaDeploymentBucketName`, { 
      value: this.lambdaDeploymentBucketName,
      exportName: 'LambdaDeploymentBucketName'
     });
  }

  // Publically accessible bucket to serve static website
  private createFrontendAssetsBucket(): string {
    const frontendAssetsBucketName: string = "pastebin-leptos-app-frontend-assets";
    const frontendAssetsBucketLogicalId: string = reformatBucketConstructLogicalId(frontendAssetsBucketName)

    const frontendAssetsBucket = new CfnBucket(this, frontendAssetsBucketLogicalId, {
      bucketName: frontendAssetsBucketName,
      publicAccessBlockConfiguration: {
        blockPublicPolicy: false,
      },
      websiteConfiguration: {
        indexDocument: 'index.html',
      }
    });

    const publicAccessBucketPolicy = new CfnBucketPolicy(this, frontendAssetsBucketLogicalId + "PublicAccessBucketPolicy", {
      bucket: frontendAssetsBucketName,
      policyDocument: {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": [
                    "s3:GetObject"
                ],
                "Resource": [
                    `arn:aws:s3:::${frontendAssetsBucketName}/*`
                ]
            }
          ]
        } 
      }
    );

    return frontendAssetsBucketName;
  }

  // Bucket that will contain lambda code
  private createLambdaBucket(): string {
    const lambdaBucketName: string = "pastebin-leptos-app-lambda-deployment";
    const lambdaBucketLogicalId: string = reformatBucketConstructLogicalId(lambdaBucketName)

    const lambdaBucket = new CfnBucket(this, lambdaBucketLogicalId, {
      bucketName: lambdaBucketName,
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
      },
      bucketEncryption: {
        serverSideEncryptionConfiguration: [{
          serverSideEncryptionByDefault: {
            sseAlgorithm: 'AES256'
          }
        }]
      },
      versioningConfiguration: {
        status: 'Enabled'
      }
    });

    const lambdaBucketPolicy = new CfnBucketPolicy(this, lambdaBucketLogicalId + "LambdaDeploymentBucketPolicy", {
      bucket: lambdaBucketName,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          // Deny all public access
          {
            Sid: 'DenyPublicAccess',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [
              `arn:aws:s3:::${lambdaBucketName}`,
              `arn:aws:s3:::${lambdaBucketName}/*`
            ],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false'
              }
            }
          },
          // Allow Lambda service to access the code
          {
            Sid: 'AllowLambdaService',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com'
            },
            Action: [
              's3:GetObject',
              's3:ListBucket'
            ],
            Resource: [
              `arn:aws:s3:::${lambdaBucketName}`,
              `arn:aws:s3:::${lambdaBucketName}/*`
            ]
          },
          // Allow deployment account to manage the bucket
          {
            Sid: 'AllowAccountAccess',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${Stack.of(this).account}:root`
            },
            Action: [
              's3:PutObject',
              's3:GetObject',
              's3:DeleteObject',
              's3:ListBucket'
            ],
            Resource: [
              `arn:aws:s3:::${lambdaBucketName}`,
              `arn:aws:s3:::${lambdaBucketName}/*`
            ]
          }
        ]
      }
    });
    return lambdaBucketName;
  }
}
