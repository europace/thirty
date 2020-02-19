export type Handler<EventType> = (event: EventType, ...args: any[]) => Promise<any>;
