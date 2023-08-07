import { Handler } from './Handler';

export type Middleware<InputType, ExtendedType, ExtendedHandlerType = {}> = (
  handler: Handler<ExtendedType>,
) => Handler<InputType> & ExtendedHandlerType;
