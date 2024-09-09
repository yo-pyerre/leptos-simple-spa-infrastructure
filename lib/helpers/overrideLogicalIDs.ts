import { Construct, IConstruct } from 'constructs';
import { CfnElement } from 'aws-cdk-lib'

export const overrideLogicalIDs = (construct: IConstruct, id: string): void => {
    const element: CfnElement = construct.node.defaultChild as CfnElement;

    if (element !== undefined) {
        console.log(`Original logical id: ${element.logicalId}`)
        element.overrideLogicalId(id)
        console.log(`New logical id: ${element.logicalId}`)
    }

    construct.node.children.forEach((child) => {
        overrideLogicalIDs(child, id + child.node.id)
    })
}