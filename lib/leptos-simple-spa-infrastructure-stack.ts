import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { CfnBucket, CfnBucketPolicy } from 'aws-cdk-lib/aws-s3'

export class LeptosSimpleSpaInfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucketName: string = "leptos-simple-spa-bucket";
    
    const siteBucket = new CfnBucket(this, "LeptosSimpleSPABucket", {
      bucketName: bucketName,
      publicAccessBlockConfiguration: {
        blockPublicPolicy: false,
      },
      websiteConfiguration: {
        indexDocument: 'index.html',
      }
    });

  const publicAccessBucketPolicy = new CfnBucketPolicy(this, "PublicAccessBucketPolicy", {
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
            }
        ]
    }
  });
}
}
