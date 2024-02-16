import { machinetje } from "$lib/index.js";

export const stopwatchMachine = machinetje({
    stopped: {
        on: {
            start: 'running',
            reset: 'stopped',
        },
        effect({ action, context, setContext }) {
            switch (action) {
                case 'stop': {
                    const pauseTime = new Date().getTime() - context!.startDate!.getTime();
                    return setContext({
                        pauseTime,
                        startDate: null,
                    });
                }
                case 'reset': {
                    return setContext({
                        pauseTime: null,
                        startDate: null,
                    });
                }
                default: {
                    return;
                }
            }
        }
    },
    running: {
        on: {
            stop: 'stopped',
            reset: 'stopped',
        },
        effect({ context, setContext }) {
            const pausedTime = context!.pauseTime || 0;
            setContext({
                startDate: new Date(new Date().getTime() - pausedTime),
                pauseTime: null,
            });
        }
    }
}, 'stopped', {
    startDate: null as Date | null,
    pauseTime: null as number | null,
});
