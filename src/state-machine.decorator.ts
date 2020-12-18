import { getMetadataArgsStorage } from 'typeorm';
import { StateMachineLoader } from './state-machine.loader';

export type ErrorFactory = (entity: string, transition: string, from: string, to: string) => Error;

export type HookParam = {
    transition: any;
    entity: string;
};

export type Options = {
    transitions: any[];
    stateField?: string;
    options?: {
        saveAfterTransition?: boolean;
        autoImplementAll?: boolean;
        autoImplementOnly?: string[];
        autoImplementExcept?: string[];
        errorFactory?: ErrorFactory;
        afterTransition?: Function[];
    };
};

const defaultOptions: Partial<Options> = {
    stateField: 'status',
    options: {
        autoImplementAll: true,
        saveAfterTransition: false,
        afterTransition: [],
    },
};

export function StateMachine(data: Options | Options[]) {
    const allOptions = [];
    if (!Array.isArray(data)) {
        const options = data;
        options.stateField = data.stateField || defaultOptions.stateField;
        options.options = { ...defaultOptions.options, ...data.options };
        allOptions.push(options);
    } else {
        for (const singleFsm of data) {
            const options = singleFsm;
            options.stateField = singleFsm.stateField || defaultOptions.stateField;
            options.options = { ...defaultOptions.options, ...singleFsm.options };
            allOptions.push(options);
        }
    }

    return function<T extends { new (...args: any[]): {} }>(ctor: T) {
        allOptions.forEach(options => {
            const load = function() {
                return StateMachineLoader.load(this, options);
            };

            const afterLoadMethodName = '__initStateMachine_' + options.stateField;
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
        });
    };
}
