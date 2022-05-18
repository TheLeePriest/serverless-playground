import {v4 as uuid} from 'uuid';
import createError from 'http-errors';
import commonMiddleware from "../../middleware/commonMiddleware";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, PutCommand} from "@aws-sdk/lib-dynamodb";
import {EventBridgeClient, PutEventsCommand} from "@aws-sdk/client-eventbridge";

const dynamoClient = new DynamoDBClient({ region: "eu-west-2" });
const documentClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBridgeClient = new EventBridgeClient({region: "eu-west-2"});

async function createWebsite(event, context) {
    const { siteName } = event?.body || event?.arguments;
    const now = new Date().toISOString();

    if(!siteName) {
        throw new createError.Forbidden('You can\'t create a new website without a site name!')
    }

    const newWebsite = {
        id: uuid(),
        siteName,
        createdAt: now,
    }

    try {
        const dynamoDBCommand = new PutCommand({
            TableName: process.env.WEBSITES_TABLE_NAME,
            Item: newWebsite
        })
        await documentClient.send(dynamoDBCommand);

        const newWebsiteEvent = new PutEventsCommand({
            Entries: [
                {
                    Detail: JSON.stringify({
                        metadata: {
                            domain: 'WEBSITE',
                            service: 'service-website',
                            category: 'website',
                            type: 'website-creation',
                        },
                        data: {
                            clientName,
                        },
                    }),
                    DetailType: 'event',
                    EventBusName: `website-event-bus-${process.env.STAGE}`,
                    Source: 'createWebsite'
                }
            ]
        });

        await eventBridgeClient.send(newWebsiteEvent);

        if(event?.typeName === 'Mutation') {
            return newWebsite;
        }

        return {
            statusCode: 201,
            body: JSON.stringify(newWebsite),
        };
    } catch(error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }
}

export const handler = commonMiddleware(createWebsite);
