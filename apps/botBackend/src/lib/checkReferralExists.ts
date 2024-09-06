import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { client, referralPointsTableName } from "./db";

export default async function checkReferralExists(referralID:string){

    const referralQuery = await client.send(
        new GetItemCommand({
            TableName:referralPointsTableName,
            Key:{
                "referralID": {
                    S:referralID
                }
            },
        })
    );

    return referralQuery.Item !==undefined
}
