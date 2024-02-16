import type { MachinetjeConfig } from "../machinetje-config.type.js";

export function statesWithoutActions(config: MachinetjeConfig<any, any, any>) {
    return Object.keys(config).filter(state => {
        if (!('on' in config[state]) || !(config[state].on)) {
            return true;
        }
        const actions = Object.keys(config[state].on!);
        if (actions.length === 0) {
            return true;
        }
        return false;
    });
}
