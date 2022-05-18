// import {v4 as uuid} from 'uuid';
import AWS from 'aws-sdk';
// import commonMiddleware from "../lib/commonMiddleware";
import createError from 'http-errors';
// import validator from '@middy/validator';
import { CognitoIdentityProviderClient, CreateUserPoolCommand, CreateUserPoolClientCommand } from "@aws-sdk/client-cognito-identity-provider";
import {userSchema} from "../../schema/userSchema";

const userPoolClient = new CognitoIdentityProviderClient({region: 'eu-west-2'});

async function createUserPool(event, context) {
    const {detail: { data } } = event;

    if(!data) {
        throw new createError.InternalServerError('No data has been passed from the event - createUserPool');
    }

    const createUserPoolCommand = new CreateUserPoolCommand({
        PoolName: `${data.clientName}-${process.env.STAGE}`,
        Policies: {
            PasswordPolicy: {
                MinimumLength: 8,
            },
            UsernameAttributes: 'email',
            AutoVerifiedAttributes: 'email',
            Schema: userSchema,
        },
    });
    const { UserPool } = await userPoolClient.send(createUserPoolCommand);
    const createUserPoolClientCommand = new CreateUserPoolClientCommand({
        ClientName: `serverless-playground-${process.env.STAGE}`,
        UserPoolId: UserPool.Id,
        CallbackURLs: ['http://localhost:3000/token'],
        LogoutURLs: ['http://localhost:3000/']
    });
    const response = await userPoolClient.send(createUserPoolClientCommand);

    return {
        statusCode: 201,
        body: JSON.stringify(response),
    };
}

// export const handler = commonMiddleware(createAuction).use(validator({ inputSchema: createAuctionSchema, ajvOptions: { strict: false }} ));
export const handler = createUserPool


