import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { CfnFunction } from 'aws-cdk-lib/aws-lambda'
import { CfnRole } from 'aws-cdk-lib/aws-iam'
import { CfnApi } from 'aws-cdk-lib/aws-apigatewayv2'

export interface APIGWStackProps extends StackProps {
    deploymentBucketName: string
}

export class APIGWStack extends Stack {
    public readonly lambdaRolesMapping: string;

    constructor(scope: Construct, id: string, props: APIGWStackProps) {
        super(scope, id, props);

        const lambdaNames = ["Paste"]

        let lambdaRoleMap = new Map<string, string>()

        const lambdaRolesMapping = lambdaNames.reduce((mapping, name) => {
            mapping[name] = this.createLambdaAndRole(name, props.deploymentBucketName, 'lambdas/bootstrap.zip')
            return mapping;
        }, {} as Record<string, string>)

        new CfnOutput(this, 'LambdaRolesMapping', {
            value: JSON.stringify(lambdaRolesMapping),
            exportName: 'LambdaRolesMapping'
        })
        this.lambdaRolesMapping = JSON.stringify(lambdaRolesMapping)

        this.createApi();
    };

    // Returns ARN reference to lambda role
    private createLambdaAndRole(name: string, deploymentBucket: string, deploymentKey: string): string {
        const lambdaName = `${this.node.id}-${name}Lambda`

        const pasteLambdaRoleName = `${lambdaName}ExecutionRole`
        const pasteLambdaRole = new CfnRole(this, pasteLambdaRoleName, {
            roleName: pasteLambdaRoleName,
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

        const pasteLambdaFn = new CfnFunction(this, lambdaName, {
            description: 'Lambda backing "/paste"',
            functionName: lambdaName,
            code: {
                s3Bucket: deploymentBucket,
                s3Key: deploymentKey,
            },
            role: pasteLambdaRole.attrArn,
            memorySize: 128,
            packageType: 'Zip',
            handler: 'not.needed',
            // For Rust lambdas, need to use 'OS-only' runtime
            runtime: 'provided.al2023'
        })

        return pasteLambdaRole.attrArn
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