import type { Effectje } from "./effectje.type.js";
import type { MachinetjeContext } from "./machinetje-context.type.js";

export type MachinetjeConfig<
    State extends string,
    Action extends string,
    Context extends MachinetjeContext,
> = {
    [state in State]: {
        on?: {
            [action in Action]?: State;
        },
        effect?: Effectje<Action, Context>;
    }
};
