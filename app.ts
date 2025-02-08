#!/usr/bin/env node
import { App } from 'aws-cdk-lib';

import { APIGWStack, WebsiteStack, StorageStack } from './lib';

const app = new App();

// Should keep stack nomenclature consistent and s.t. stack names remain unique 
// after multiple regionalized deployments
const appName = "PastebinLeptosApp-"
// Can add proper staging later

const websiteStack = new WebsiteStack(app, appName + "WebsiteStack");

const storageStack = new StorageStack(app, appName + "StorageStack");

const apigwStack = new APIGWStack(app, appName + "APIGWStack", {
    websiteStack,
    storageStack
});

apigwStack.addDependency(storageStack)
apigwStack.addDependency(websiteStack)