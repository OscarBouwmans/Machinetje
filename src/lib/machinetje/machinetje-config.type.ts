import type { Effectje } from "./effectje.type.js";

export type MachinetjeConfig<
    State extends string,
    Action extends string,
    Context,
> = {
    [state in State]: {
        on?: {
            [action in Action]?: State;
        },
        effect?: Effectje<Action, Context>;
    }
};
