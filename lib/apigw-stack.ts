import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { CfnFunction } from 'aws-cdk-lib/aws-lambda'
import { CfnRole } from 'aws-cdk-lib/aws-iam'
import { CfnApi } from 'aws-cdk-lib/aws-apigatewayv2'

export interface APIGWStackProps extends StackProps {
    deploymentBucketName: string
}

export class APIGWStack extends Stack {

    constructor(scope: Construct, id: string, props: APIGWStackProps) {
        super(scope, id, props);

        const lambdaNames = ["Paste"]

        this.createLambdaAndRole(lambdaNames[0], props.deploymentBucketName, 'lambdas/bootstrap.zip')

        this.createApi();
    };

    private createLambdaAndRole(name: string, deploymentBucket: string, deploymentKey: string) {
        const lambdaName = `${this.node.id}-${name}Lambda`

        const lambdaRoleName = `${lambdaName}Role`
        const lambdaRole = new CfnRole(this, lambdaRoleName, {
            roleName: lambdaRoleName,
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
            }
        })

        const lambdaKey = 'lambdas/bootstrap.zip'

        const lambdaFn = new CfnFunction(this, lambdaName, {
            description: `Lambda backing "/${name}"`,
            functionName: lambdaName,
            code: {
                s3Bucket: deploymentBucket,
                s3Key: deploymentKey,
            },
            role: lambdaRole.attrArn,
            memorySize: 128,
            packageType: 'Zip',
            handler: 'not.needed',
            // For Rust lambdas, need to use 'OS-only' runtime
            runtime: 'provided.al2023'
        })
        
        new CfnOutput(this, `${name}LambdaRoleArn`, {
            value: lambdaRole.attrArn,
            exportName: `${name}LambdaRoleArn`
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