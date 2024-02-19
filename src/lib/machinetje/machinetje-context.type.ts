
export interface MachinetjeContext {}

export type ContextOrUpdateContext<Context extends MachinetjeContext> = Context | ((context: Context) => Context);
