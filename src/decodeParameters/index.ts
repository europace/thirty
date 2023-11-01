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

export const decodeParameters =
  <T extends DecodedParametersRequiredEvent, R>(): Middleware<
    T,
    T & DecodedParametersEvent,
    R,
    R
  > =>
  (handler) =>
  (event, ...args) =>
    handler(
      Object.assign(event, {
        decodedPathParameters: exports.decode(event.pathParameters),
        decodedQueryStringParameters: exports.decode(event.queryStringParameters),
        decodedMultiValueQueryStringParameters: exports.decode(
          event.multiValueQueryStringParameters,
        ),
      }),
      ...args,
    );

export const decode = <T extends object>(parameters: T | null): T => {
  const safeParameters = parameters ? parameters : {};
  return Object.keys(safeParameters).reduce((decodedParameters, parameterName) => {
    const value = safeParameters[parameterName];
    return Object.assign(Object.assign({}, decodedParameters), {
      [parameterName]: Array.isArray(value)
        ? value.map((val) => decodeUriComponent(val))
        : decodeUriComponent(value),
    });
  }, {} as T);
};

const decodeUriComponent = (value) => {
  if (value !== undefined && value !== null) {
    return decodeURIComponent(value);
  }
  return value;
};
