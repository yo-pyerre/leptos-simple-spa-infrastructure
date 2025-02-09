import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { BlockPublicAccess, CfnBucket } from 'aws-cdk-lib/aws-s3';
import { CfnTable } from 'aws-cdk-lib/aws-dynamodb';

import { reformatBucketConstructLogicalId } from './helpers';

export class StorageStack extends Stack {
    public readonly bucketName: string;
    public readonly metadataTable: CfnTable;
    public readonly filesTable: CfnTable;
    
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);

      this.bucketName = this.createStorageBucket();

      this.metadataTable = this.createMetadataTable();
      
      this.filesTable = this.createFilesTable();

      // Export resources for other stacks
      new CfnOutput(this, 'StorageBucketName', { 
        value: this.bucketName,
        exportName: 'StorageBucketName'
      });

      new CfnOutput(this, 'MetadataTableArn', {
        value: this.metadataTable.attrArn,
        exportName: 'MetadataTableArn'
      });

      new CfnOutput(this, 'FilesTableArn', {
        value: this.filesTable.attrArn,
        exportName: 'FilesTableArn'
      });
    }

    private createStorageBucket(): string {
      const bucketName: string = "pastebin-leptos-app-storage";
      const bucketLogicalId : string = reformatBucketConstructLogicalId(bucketName);
    
      const storageBucket = new CfnBucket(this, bucketLogicalId, {
          bucketName: bucketName,
          publicAccessBlockConfiguration: BlockPublicAccess.BLOCK_ALL
      });

      return bucketName;
    }

    private createMetadataTable(): CfnTable {
      return new CfnTable(this, `${this.node.id}MetadataTable`, {
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

    private createFilesTable(): CfnTable {
      return new CfnTable(this, `${this.node.id}FilesTable`, {
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
      }
    );
  }
}