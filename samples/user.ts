import { StateMachine } from '../src/state-machine.decorator';
import { Entity, getRepository, Column, createConnection, ConnectionOptions, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@StateMachine({
    transitions: [
        { name: 'walk', from: 'init', to: 'walking' },
        { name: 'stop', from: 'walking', to: 'stopped' },
        { name: 'meow', from: ['stopped', 'walking'], to: 'meowed' },
    ],
    options: { saveAfterTransition: true },
})
@Entity()
export class Example extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    status: string;

    @Column()
    name: string;
}

export interface Example {
    walk(): Promise<void>;
    stop(): Promise<void>;
    meow(): Promise<void>;
}

const options: ConnectionOptions = {
    type: 'sqlite',
    database: ':memory:',
    entities: [Example],
    logging: true,
    synchronize: true,
};

(async () => {
    await createConnection(options);
    const repo = getRepository(Example);
    await repo.insert({ status: 'init', name: 'Ivan' });

    const user = await repo.findOne();

    await user.walk();
    await user.stop();
    const saved = await user.meow();
    //const savedawait user.meow();

    console.log(user);
    console.log(saved);
})();
