export type Handler<EventType> = (event: EventType) => Promise<any>;
