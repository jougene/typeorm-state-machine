import * as StateMachine from 'javascript-state-machine';
import { Options } from './state-machine.decorator';

export class StateMachineLoader {
    static load(entity: any, options: Options) {
        const { transitions, stateField } = options;
        const defaultErrorFactory = (transition: string, from: string, to: string) => {
            return new Error(`Invalid ${entity.constructor.name} transition <${transition}> from [${from}] to [${to}]`);
        };
        const errorFactory = options.options.errorFactory || defaultErrorFactory;

        const transitionMethodWrapper = (stateMachine: StateMachine, transition: string) => {
            return () => {
                try {
                    return stateMachine[transition]();
                } catch (e) {
                    const { to } = transitions.find(e => e.name === transition);
                    throw errorFactory(transition, e.from, to);
                }
            };
        };

        const stateMachine = new StateMachine({
            init: entity.status,
            transitions,
            methods: {
                onTransition: (s: any): void => {
                    entity[stateField] = s.to;
                },
            },
        });

        const stateMachineClone = { ...stateMachine };

        // implement all transition methods in entity class
        if (options.options.autoImplementAll) {
            transitions
                .map(t => t.name)
                .forEach(transition => {
                    Object.defineProperty(entity, transition, {
                        value: transitionMethodWrapper(stateMachineClone, transition),
                    });
                });
        }

        // wrap all transition methods for better error handling
        transitions
            .map(t => t.name)
            .forEach(transition => {
                stateMachine[transition] = transitionMethodWrapper(stateMachineClone, transition);
            });
    }
}
