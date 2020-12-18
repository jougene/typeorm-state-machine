import { StateMachine, HookParam } from '../src/state-machine.decorator';
import { Entity, getRepository, Column, createConnection, ConnectionOptions, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@StateMachine([
    {
        transitions: [
            { name: 'walk', from: 'init', to: 'walking' },
            { name: 'stop', from: 'walking', to: 'stopped' },
            { name: 'meow', from: ['stopped', 'walking'], to: 'meowed' },
        ],
        options: { saveAfterTransition: true, afterTransition: [async (param: HookParam) => console.log(param)] },
    },
    {
        stateField: 'status1',
        transitions: [
            { name: 'walk1', from: 'init', to: 'walking' },
            { name: 'stop1', from: 'walking', to: 'stopped' },
            { name: 'meow1', from: ['stopped', 'walking'], to: 'meowed' },
        ],
        options: { saveAfterTransition: true },
    },
])
@Entity()
export class Example extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    status: string;

    @Column()
    status1: string;

    @Column()
    name: string;
}

export interface Example {
    walk(): Promise<void>;
    stop(): Promise<void>;
    meow(): Promise<void>;

    walk1(): Promise<void>;
    stop1(): Promise<void>;
    meow1(): Promise<void>;
}

const options: ConnectionOptions = {
    type: 'sqlite',
    database: ':memory:',
    entities: [Example],
    //logging: true,
    synchronize: true,
};

(async () => {
    await createConnection(options);
    const repo = getRepository(Example);
    await repo.insert({ status: 'init', status1: 'init', name: 'Ivan' });

    const user = await repo.findOne();

    await user.walk();
    //await user.stop();
    //const saved = await user.meow();
    //const savedawait user.meow();

    console.log(user);
    //await user.walk1();
    //console.log(user);
})();
