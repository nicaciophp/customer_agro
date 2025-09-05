import { Farm } from "../../../modules/farms/entites/farm.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PlantedCrop {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    farm_id: string;

    @ManyToOne(() => Farm, (farm) => farm.planted_crops, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    @JoinColumn({ name: 'farm_id' })
    farm: Farm;
}
