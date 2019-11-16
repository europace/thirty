import { Handler } from './handler';

export type Middleware<InputType, ExtendedType, ExtendedHandlerType = {}> = (
  handler: Handler<ExtendedType & InputType>,
) => Handler<InputType> & ExtendedHandlerType;
