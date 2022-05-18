import createError from 'http-errors';
import commonMiddleware from "../../middleware/commonMiddleware";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, GetCommand} from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({ region: "eu-west-2" });
const documentClient = DynamoDBDocumentClient.from(dynamoClient);

async function getWebsiteByClientName(event, context) {
    const { clientName } = event?.body || event?.arguments;
    const now = new Date().toISOString();

    if(!clientName) {
        throw new createError.Forbidden('You can\'t create a new website without a client name!')
    }

    try {
        const dynamoDBCommand = new GetCommand({
            TableName: process.env.WEBSITES_TABLE_NAME,
            Key: {
                primaryKey: '44a15b88-17db-4486-8337-8947d30e5a35',
            }
        })
        const website = await documentClient.send(dynamoDBCommand);

        if(event?.typeName === 'Mutation') {
            return website;
        }

        return {
            statusCode: 201,
            body: JSON.stringify(website),
        };
    } catch(error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }
}

export const handler = commonMiddleware(getWebsiteByClientName);
