import { Farm } from "src/modules/farms/entites/farm.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Producer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    document: string;

    @Column()
    document_type: string;

    @OneToMany(() => Farm, (farm) => farm.producer)
    farms: Farm[];
}
