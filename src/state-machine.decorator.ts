import { getMetadataArgsStorage } from 'typeorm';
import { StateMachineLoader } from './state-machine.loader';

export type ErrorFactory = (entity: string, transition: string, from: string, to: string) => Error;

export type Options = {
    transitions: any[];
    stateField?: string;
    options?: {
        saveAfterTransition?: boolean;
        autoImplementAll?: boolean;
        autoImplementOnly?: string[];
        autoImplementExcept?: string[];
        errorFactory?: ErrorFactory;
    };
};

const defaultOptions: Partial<Options> = {
    stateField: 'status',
    options: {
        autoImplementAll: true,
        saveAfterTransition: false,
    },
};

export function StateMachine(data: Options) {
    console.log(data);
    const options = data;
    options.stateField = data.stateField || defaultOptions.stateField;
    options.options = { ...defaultOptions.options, ...data.options };

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
        getMetadataArgsStorage().entityListeners.push({
            target: ctor,
            propertyName: afterLoadMethodName,
            type: 'after-insert',
        });
    };
}
