import * as StateMachine from 'javascript-state-machine';
import { Options, HookParam } from './state-machine.decorator';
import { EventEmitter } from 'events';

export class StateMachineLoader {
    static load(entity: any, options: Options) {
        const emitter = new EventEmitter();
        if (options.options.afterTransition.length > 0) {
            options.options.afterTransition.forEach(async hook => {
                emitter.on('transition', async (s: HookParam) => {
                    await hook(s);
                });
            });
        }
        const { transitions, stateField } = options;
        const defaultErrorFactory = (entity: string, transition: string, from: string, to: string) => {
            return new Error(`Invalid ${entity} transition <${transition}> from [${from}] to [${to}]`);
        };
        const errorFactory = options.options.errorFactory || defaultErrorFactory;

        const transitionMethodWrapper = (stateMachine: StateMachine, transition: string) => {
            return async () => {
                const { to } = transitions.find(e => e.name === transition);
                try {
                    const from = entity[stateField];
                    stateMachine[transition]();
                    if (options.options.saveAfterTransition && entity.save) {
                        entity = await entity.save();
                    }
                    emitter.emit('transition', { from, to, transition, entity, field: stateField });
                    return entity;
                } catch (e) {
                    throw errorFactory(entity.constructor.name, transition, e.from, to);
                }
            };
        };

        const stateMachine = new StateMachine({
            init: entity[stateField],
            transitions,
            methods: {
                onTransition(s: any): void {
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
                        writable: true, // hack for Typeorm reload method
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
