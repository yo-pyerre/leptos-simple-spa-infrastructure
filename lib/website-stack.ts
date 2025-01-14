import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { CfnBucket, CfnBucketPolicy } from 'aws-cdk-lib/aws-s3'

import { reformatBucketConstructLogicalId } from './helpers';

export class WebsiteStack extends Stack {
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucketName: string = "pastebin-leptos-app-deployment-bucket";
    const bucketLogicalId: string = reformatBucketConstructLogicalId(bucketName)
  
    this.bucketName = bucketName;

    new CfnOutput(this, 'DeploymentBucket', { 
      value: this.bucketName,
      exportName: 'DeploymentBucket'
     });

    const siteBucket = new CfnBucket(this, bucketLogicalId, {
      bucketName: bucketName,
      publicAccessBlockConfiguration: {
        blockPublicPolicy: false,
      },
      websiteConfiguration: {
        indexDocument: 'index.html',
      }
    });

    const publicAccessBucketPolicy = new CfnBucketPolicy(this, bucketLogicalId + "PublicAccessBucketPolicy", {
      bucket: bucketName,
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
                    `arn:aws:s3:::${bucketName}/*`
                ]
            },
            {
              "Sid": "DenyAccessToLambdaSubfolder",
              "Effect": "Deny",
              "Principal": "*",
              "Action": [
                  "s3:GetObject"
              ],
              "Resource": [
                  `arn:aws:s3:::${bucketName}/lambdas/*`
              ]
          }
          ]
      }
    });
  }
}
