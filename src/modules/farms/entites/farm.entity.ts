import { PlantedCrop } from "../../../modules/planted_crops/entities/planted-crops.entity";
import { Producer } from "../../../modules/producers/entities/producer.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Farm {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    producer_id: string;

    @Column()
    city: string;

    @Column()
    state: string;

    @Column()
    total_area: number;

    @Column()
    agricultural_area: number;

    @Column()
    vegetation_area: number;

    @ManyToOne(() => Producer, (producer) => producer.farms, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    @JoinColumn({ name: 'producer_id' })
    producer: Producer;

    @OneToMany(() => PlantedCrop, (planted_crop) => planted_crop.farm)
    planted_crops: PlantedCrop[];

}
