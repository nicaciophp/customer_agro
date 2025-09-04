import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "src/common/base/base.respository";
import { PlantedCrop } from "../entities/planted-crops.entity";

@Injectable()
export class PlantedCropsRepository extends BaseRepository<PlantedCrop> {
    constructor(
        @InjectRepository(PlantedCrop)
        producerRepository: Repository<PlantedCrop>
    ) {
        super(producerRepository);
    }

    async getCropsByType(): Promise<Array<{ name: string; value: number; totalArea?: number }>> {
        const result = await this.createQueryBuilder('crop')
            .select('crop.name', 'name')
            .addSelect('COUNT(crop.id)', 'value')
            .groupBy('crop.name')
            .orderBy('value', 'DESC')
            .getRawMany();

        return result.map(item => ({
            name: item.name,
            value: parseInt(item.value),
            totalArea: 0,
        }));
    }

    async getCropStatistics() {
        return await this.createQueryBuilder('crop')
            .leftJoinAndSelect('crop.farm', 'farm')
            .select([
                'crop.name as cropName',
                'COUNT(crop.id) as plantCount',
                'COUNT(DISTINCT farm.id) as farmCount',
            ])
            .groupBy('crop.name')
            .orderBy('plantCount', 'DESC')
            .getRawMany();
    }
} 