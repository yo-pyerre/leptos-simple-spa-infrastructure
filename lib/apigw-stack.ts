import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { CfnFunction } from 'aws-cdk-lib/aws-lambda'
import { CfnRole } from 'aws-cdk-lib/aws-iam'
import { CfnApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class APIGWStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const pasteLambdaName = id + '-' + 'PasteLambda'

        const pasteLambdaRoleName = pasteLambdaName + 'ExecutionRole'
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
        const pasteLambdaFn = new CfnFunction(this, pasteLambdaName, {
            description: 'Lambda backing "/paste"',
            functionName: pasteLambdaName,
            code: {
                s3Bucket: '',
                s3Key: '',
            },
            role: pasteLambdaRoleName,
            environment: {
            },
            memorySize: 128,
            packageType: 'Zip',
            // runtime:
        })

        const apiName = pasteLambdaName + 'HTTPAPI'
        const cfnRestAPI = new CfnApi(this, apiName, {
            description: 'HTTP APIs that forward requests to Lambdas',
            name: apiName,
            // apiKeySelectionExpression: 'apiKeySelectionExpression',
            // basePath: 'basePath',
            // body: body,
            // bodyS3Location: {
            //   bucket: 'bucket',
            //   etag: 'etag',
            //   key: 'key',
            //   version: 'version',
            // },
            // corsConfiguration: {
            //   allowCredentials: false,
            //   allowHeaders: ['allowHeaders'],
            //   allowMethods: ['allowMethods'],
            //   allowOrigins: ['allowOrigins'],
            //   exposeHeaders: ['exposeHeaders'],
            //   maxAge: 123,
            // },
            // credentialsArn: 'credentialsArn',
            // disableExecuteApiEndpoint: false,
            // disableSchemaValidation: false,
            // failOnWarnings: false,
            // protocolType: 'protocolType',
            // routeKey: 'routeKey',
            // routeSelectionExpression: 'routeSelectionExpression',
            // tags: {
            //   tagsKey: 'tags',
            // },
            // target: 'target',
            // version: 'version',
          });
    };
}