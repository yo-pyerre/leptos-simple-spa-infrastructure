#!/usr/bin/env node
import { App } from 'aws-cdk-lib';

import { APIGWStack, WebsiteStack } from './lib';

const app = new App();

// Should keep stack nomenclature consistent and s.t. stack names remain unique 
// after multiple regionalized deployments
const appName = "PastebinLeptosApp-"
// Can add proper staging later

const websiteStack = new WebsiteStack(app, appName + "WebsiteStack");

const apigwStack = new APIGWStack(app, appName + "APIGWStack", {
    deploymentBucketName: websiteStack.bucketName
})