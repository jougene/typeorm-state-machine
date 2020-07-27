import { getMetadataArgsStorage } from 'typeorm';
import { StateMachineLoader } from './state-machine.loader';

export type Options = {
    transitions: any[];
    stateField?: string;
    options?: {
        autoImplementAll?: boolean;
        autoImplementOnly?: string[];
        autoImplementExcept?: string[];
        errorFactory?: (transition: string, from: string, to: string) => Error;
    };
};

const defaultOptions: Partial<Options> = {
    stateField: 'status',
    options: {
        autoImplementAll: true,
    },
};

export function StateMachine(data: Options) {
    const options = data;
    options.stateField = data.stateField || defaultOptions.stateField;
    options.options = { ...data.options, ...defaultOptions.options };

    return function<T extends { new (...args: any[]): {} }>(ctor: T) {
        const load = function() {
            return StateMachineLoader.load(this, options);
        };

        const afterLoadMethodName = '__initStateMachine';
        Object.defineProperty(ctor.prototype, afterLoadMethodName, {
            value: load,
        });

        getMetadataArgsStorage().entityListeners.push({
            target: ctor,
            propertyName: afterLoadMethodName,
            type: 'after-load',
        });
    };
}

