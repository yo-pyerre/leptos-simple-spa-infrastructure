import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { BlockPublicAccess, CfnBucket, CfnBucketPolicy } from 'aws-cdk-lib/aws-s3';
import { reformatBucketConstructLogicalId } from './helpers';

export interface StorageStackProps extends StackProps {
    lambdaRolesMapping: string
}

export class StorageStack extends Stack {
    public readonly bucketName: string;
    
    constructor(scope: Construct, id: string, props: StorageStackProps) {
      super(scope, id, props);

      // extract lambda roles from role mapping
      const lambdaRoles = Object.values(JSON.parse(props.lambdaRolesMapping) as string[]);

      this.createStorageBucket(lambdaRoles);

    }

      private createStorageBucket(lambdaRoles: string[]): string {
        const bucketName: string = "pastebin-leptos-app-storage-bucket";
        const bucketLogicalId : string = reformatBucketConstructLogicalId(bucketName);
      
        const storageBucket = new CfnBucket(this, bucketLogicalId, {
            bucketName: bucketName,
            publicAccessBlockConfiguration: BlockPublicAccess.BLOCK_ALL
        });

        new CfnOutput(this, 'StorageBucketName', { 
          value: bucketName,
          exportName: 'StorageBucketName'
        });

        // Should deny all access to bucket contents / actions excpet explicitly allowed lambda roles
        const storageBucketPolicy = new CfnBucketPolicy(this, bucketLogicalId + "Policy", {
            bucket: bucketName,
            policyDocument: {
                Statement: [
                    {
                      Action: 's3:*',
                      Effect: 'Deny',
                      Principal: '*',
                      Resource: [
                          `arn:aws:s3:::${bucketName}/*`
                        ],
                    },
                    {
                      Action: 's3:*',
                      Effect: 'Allow',
                      Principal: {
                        'AWS': lambdaRoles
                      },
                      Resource: [
                        `arn:aws:s3:::${bucketName}/*`
                      ],
                    }
                  ],
                  Version: '2012-10-17',
                },
            }
        );
      return bucketName;
    }
}