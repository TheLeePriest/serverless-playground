// import {v4 as uuid} from 'uuid';
import AWS from 'aws-sdk';
// import commonMiddleware from "../lib/commonMiddleware";
// import createError from 'http-errors';
// import validator from '@middy/validator';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, ListUserPoolsCommand } from "@aws-sdk/client-cognito-identity-provider";
const userPoolClient = new CognitoIdentityProviderClient({region: 'eu-west-2'});

async function createUser(event, context) {
    const { body } = event;

    if(!body) {
        throw new createError.InternalServerError('No data has been passed from the event - createUser');
    }

    const clientUserPoolCommand = ListUserPoolsCommand({MaxResults: 15});
    const {UserPools} = await userPoolClient.send(clientUserPoolCommand);
    const [clientUserPool] = UserPools.filter(userPool => userPool.Name ===  `${body.clientName}-${process.env.STAGE}`);
    const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: clientUserPool.id,
        UserName: body.email,
        UserAttributes: [body]
    });
    const response = await userPoolClient.send(createUserCommand);

    //
    // try {
    //     await dynamoDB.put({
    //         TableName: process.env.AUCTIONS_TABLE_NAME,
    //         Item: auction
    //     }).promise();
    // } catch(error) {
    //     console.log(error);
    //     throw new createError.InternalServerError(error);
    // }

    return {
        statusCode: 201,
        body: JSON.stringify(response),
    };
}

// export const handler = commonMiddleware(createAuction).use(validator({ inputSchema: createAuctionSchema, ajvOptions: { strict: false }} ));
export const handler = createUser


