import { StateMachine } from '../src/state-machine.decorator';
import { Entity, getRepository, Column, createConnection, ConnectionOptions, PrimaryGeneratedColumn } from 'typeorm';

@StateMachine({
    transitions: [
        { name: 'walk', from: 'init', to: 'walking' },
        { name: 'stop', from: 'walking', to: 'stopped' },
        { name: 'meow', from: ['stopped', 'walking'], to: 'meowed' },
    ],
    options: {
        //errorFactory: (t, from, to) => {
            //return new Error('Haha');
        //},
    },
})
@Entity()
export class Example {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    status: string;

    @Column()
    name: string;
}

export interface Example {
    walk(): void;
    stop(): void;
    meow(): void;
}

const options: ConnectionOptions = {
    type: 'sqlite',
    database: ':memory:',
    entities: [Example],
    synchronize: true,
};

(async () => {
    await createConnection(options);
    const repo = getRepository(Example);
    await repo.insert({ status: 'init', name: 'Ivan' });

    const user = await repo.findOne();

    user.walk();
    user.stop();
    user.meow();
    user.meow();

    console.log(user);
})();
