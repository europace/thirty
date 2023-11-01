export type Next<EventType, ReturnType> = (event: EventType, ...args: any[]) => ReturnType;
