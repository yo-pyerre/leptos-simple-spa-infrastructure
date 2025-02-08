import { Stack, StackProps, CfnOutput, Fn } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { BlockPublicAccess, CfnBucket, CfnBucketPolicy } from 'aws-cdk-lib/aws-s3';
import { CfnTable } from 'aws-cdk-lib/aws-dynamodb';
import { reformatBucketConstructLogicalId } from './helpers';

export class StorageStack extends Stack {
    public readonly bucketName: string;
    
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);

      const pasteLambdaRole = Fn.importValue('PasteLambdaRoleArn')

      this.createStorageBucket([pasteLambdaRole]);

      this.createMetadataTable();
      
      this.createFilesTable();
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

    private createMetadataTable() {
      new CfnTable(this, `${this.node.id}MetadataTable`, {
        tableName: 'PastebinMetadataTable',
        keySchema: [{
          attributeName: 'pasteId',
          keyType: 'HASH',
        }],
        attributeDefinitions: [
        // each paste will have a unique UUID
        {
          attributeName: 'pasteId',
          attributeType: 'S',
        },
        {
          attributeName: 'createdAt',
          attributeType: 'S'
        },
        {
          attributeName: 'isPublic',
          attributeType: 'B'
        },
        {
          attributeName: 'owner',
          attributeType: 'S'
        }
      ],
      billingMode: 'PAY_PER_REQUEST',
      globalSecondaryIndexes: [
        {
          indexName: 'OwnerIndex',
          keySchema: [
            {
              attributeName: 'owner',
              keyType: 'HASH',
            },
            {
              attributeName: 'createdAt',
              keyType: 'RANGE',
            },
          ],
          projection: {
            projectionType: 'ALL',
          },
        },
        {
          indexName: 'PublicIndex',
          keySchema: [
            {
              attributeName: 'isPublic',
              keyType: 'HASH', // HASH = Partition Key
            },
            {
              attributeName: 'createdAt',
              keyType: 'RANGE', // RANGE = Sort Key
            },
          ],
          projection: {
            projectionType: 'ALL', // Include all attributes
          },
        },
      ],
      timeToLiveSpecification: {
        enabled: true,
        attributeName: 'TTL',
      },
      sseSpecification: {
        sseEnabled: true, // Enable server-side encryption
      }
    });
  }

    private createFilesTable() {
      new CfnTable(this, `${this.node.id}FilesTable`, {
        tableName: 'PastebinFilesTable',
        keySchema: [
        {
          attributeName: 'pasteId',
          keyType: 'HASH',
        },
        {
          attributeName: 'fileName',
          keyType: 'RANGE'
        }
      ],
        attributeDefinitions: [
        {
          attributeName: 'pasteId',
          attributeType: 'S',
        },
        {
          attributeName: 'fileName',
          attributeType: 'S'
        }
      ],
      billingMode: 'PAY_PER_REQUEST',
      sseSpecification: {
        sseEnabled: true, 
      }
    });
  }
}