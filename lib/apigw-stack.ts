import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { CfnFunction } from 'aws-cdk-lib/aws-lambda';
import { CfnRole } from 'aws-cdk-lib/aws-iam';
import { CfnApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { CfnBucketPolicy } from 'aws-cdk-lib/aws-s3';

import { StorageStack } from './storage-stack';
import { WebsiteStack } from './website-stack';

export interface APIGWStackProps extends StackProps {
    websiteStack: WebsiteStack
    storageStack: StorageStack
}

export class APIGWStack extends Stack {

    constructor(scope: Construct, id: string, props: APIGWStackProps) {
        super(scope, id, props);

        const lambdaNames = ["Paste"]

        const lambdaRoleArns = []

        for (const fnName in lambdaNames) {
            const roleArn = this.createLambdaAndRole(fnName, 'lambdas/bootstrap.zip', props.websiteStack, props.storageStack)
            lambdaRoleArns.push(roleArn)
        }

        this.updateStorageBucketPolicy(props.storageStack, lambdaRoleArns);

        this.createApi();
    };

    // Returns lambda execution role arn
    private createLambdaAndRole(name: string, deploymentKey: string, websiteStack: WebsiteStack, storageStack: StorageStack): string {
        const lambdaName = `${this.node.id}-${name}Lambda`

        const lambdaRoleName = `${lambdaName}Role`
        const lambdaRole = new CfnRole(this, lambdaRoleName, {
            roleName: lambdaRoleName,
            description: `Execution role for ${lambdaName}`,
            assumeRolePolicyDocument: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                    }
                ]
            },
            policies: [{
                policyName: 'PastebinLambdaFunctionPolicy',
                policyDocument: {
                  Version: '2012-10-17',
                  Statement: [
                    {
                      Effect: 'Allow',
                      Action: [
                        's3:PutObject',
                        's3:GetObject',
                      ],
                      Resource: [`arn:aws:s3:::${storageStack.bucketName}/*`],
                    },
                    {
                      Effect: 'Allow',
                      Action: [
                        'dynamodb:PutItem',
                        'dynamodb:GetItem',
                        'dynamodb:Query',
                      ],
                      Resource: [
                        storageStack.metadataTable.attrArn,
                        storageStack.filesTable.attrArn,
                      ],
                    },
                  ],
                },
              },]
        })

        const lambdaKey = 'lambdas/bootstrap.zip'

        const lambdaFn = new CfnFunction(this, lambdaName, {
            description: `Lambda backing "/${name}"`,
            functionName: lambdaName,
            code: {
                s3Bucket: websiteStack.lambdaDeploymentBucketName,
                s3Key: deploymentKey,
            },
            role: lambdaRole.attrArn,
            memorySize: 128,
            packageType: 'Zip',
            handler: 'not.needed',
            // For Rust lambdas, need to use 'OS-only' runtime
            runtime: 'provided.al2023'
        })

        return lambdaRole.attrArn;
    }

    // Update bucket policy so only Lambda roles can interact with storage bucket and ddb
    private updateStorageBucketPolicy(storageStack: StorageStack, lambdaRoles: string[]) {
        const storageBucket = storageStack.bucketName
        return new CfnBucketPolicy(this, storageBucket + "Policy", {
            bucket: storageStack.bucketName,
            policyDocument: {
                Statement: [
                {
                    Action: 's3:*',
                    Effect: 'Deny',
                    Principal: '*',
                    Resource: [`arn:aws:s3:::${storageBucket}/*`],
                },
                {
                    Action: 's3:*',
                    Effect: 'Allow',
                    Principal: {
                    'AWS': lambdaRoles
                    },
                    Resource: [`arn:aws:s3:::${storageBucket}/*`],
                }
                ],
                Version: '2012-10-17',
            },
        });
    }

    // need to setup auth later
    private createApi(): void {
        const apiName = `${this.node.id}HTTPAPI`
        const cfnRestAPI = new CfnApi(this, apiName, {
            description: 'HTTP APIs that forward requests to Lambdas',
            name: apiName,
            protocolType: 'HTTP'
          });
    }
}