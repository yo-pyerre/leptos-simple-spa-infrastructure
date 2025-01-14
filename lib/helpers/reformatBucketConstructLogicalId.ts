// Takes a lowercase, hyphenated bucket name ("my-bucket") and returns it in a prettier CDK-friendly format ("MyBucket")
export const reformatBucketConstructLogicalId = (bucketName: string) => {
    return bucketName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}