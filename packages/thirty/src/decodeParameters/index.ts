import { Middleware } from '../core';

interface Parameters {
  [name: string]: string | undefined;
}
interface MultiValueParameters {
  [name: string]: string[] | undefined;
}

export interface DecodedParametersRequiredEvent {
  pathParameters: Parameters | null;
  queryStringParameters: Parameters | null;
  multiValueQueryStringParameters: MultiValueParameters | null;
}
export interface DecodedParametersEvent {
  decodedPathParameters: Parameters;
  decodedQueryStringParameters: Parameters;
  decodedMultiValueQueryStringParameters: MultiValueParameters;
}

export const decodeParameters = <T extends DecodedParametersRequiredEvent>(): Middleware<
  T,
  T & DecodedParametersEvent
> => handler => (event, ...args) =>
  handler(
    Object.assign(event, {
      decodedPathParameters: decode<Parameters>(event.pathParameters),
      decodedQueryStringParameters: decode<Parameters>(event.queryStringParameters),
      decodedMultiValueQueryStringParameters: decode<MultiValueParameters>(
        event.multiValueQueryStringParameters,
      ),
    }),
    ...args,
  );

export const decode = <T extends object>(parameters: T | null) => {
  const safeParameters = parameters ? parameters : {};
  return Object.keys(safeParameters).reduce((decodedParameters, parameterName) => {
    const value = safeParameters[parameterName];
    return {
      ...decodedParameters,
      [parameterName]: Array.isArray(value)
        ? value.map(val => decodeUriComponent(val))
        : decodeUriComponent(value),
    };
  }, {} as T);
};

const decodeUriComponent = value => {
  if (value !== undefined && value !== null) {
    return decodeURIComponent(value);
  }
  return value;
};
