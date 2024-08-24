This CDK app will define infrastructure for hostic a static website in S3. Website will be build in rust using Leptos framework.

1) Followed [cdk installation tutorial](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)
2) Ran `cdk init app --language typescript`

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
