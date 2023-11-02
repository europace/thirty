import { APIGatewayProxyResult as AwsLambdaAPIGatewayProxyResult } from 'aws-lambda';

export type APIGatewayProxyResult = Omit<AwsLambdaAPIGatewayProxyResult, 'body'> & {
  body?: string;
};
