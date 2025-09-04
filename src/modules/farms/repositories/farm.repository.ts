import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "src/common/base/base.respository";
import { Farm } from "../entites/farm.entity";

@Injectable()
export class FarmRepository extends BaseRepository<Farm> {
    constructor(
        @InjectRepository(Farm)
        producerRepository: Repository<Farm>
    ) {
        super(producerRepository);
    }

    async getTotalHectares(): Promise<number> {
        const result = await this.createQueryBuilder('farm')
            .select('SUM(farm.total_area)', 'total')
            .getRawOne();
        
        return parseFloat(result.total) || 0;
    }

    async getFarmsByState(): Promise<Array<{ name: string; value: number; totalArea?: number }>> {
        const result = await this.createQueryBuilder('farm')
            .select('farm.state', 'name')
            .addSelect('COUNT(farm.id)', 'value')
            .addSelect('SUM(farm.total_area)', 'totalArea')
            .groupBy('farm.state')
            .orderBy('value', 'DESC')
            .getRawMany();

        return result.map(item => ({
            name: item.name,
            value: parseInt(item.value),
            totalArea: parseFloat(item.totalarea) || 0,
        }));
    }

    async getLandUseData(): Promise<Array<{ name: string; value: number }>> {
        const result = await this.createQueryBuilder('farm')
            .select([
                'SUM(farm.agricultural_area) as agricultural',
                'SUM(farm.vegetation_area) as vegetation',
            ])
            .getRawOne();

        const agricultural = parseFloat(result.agricultural) || 0;
        const vegetation = parseFloat(result.vegetation) || 0;

        return [
            { name: 'Área Agricultável', value: agricultural },
            { name: 'Área de Vegetação', value: vegetation },
        ];
    }

    async getAverageData() {
        const result = await this.createQueryBuilder('farm')
            .select([
                'AVG(farm.total_area) as avgFarmSize',
                'AVG(farm.agricultural_area) as avgAgriculturalArea',
                'AVG(farm.vegetation_area) as avgVegetationArea',
            ])
            .getRawOne();

        return {
            avgFarmSize: parseFloat(result.avgfarmsize) || 0,
            avgAgriculturalArea: parseFloat(result.avgagriculturalarea) || 0,
            avgVegetationArea: parseFloat(result.avgvegetationarea) || 0,
        };
    }

    async getStateStatistics() {
        return await this.createQueryBuilder('farm')
            .select([
                'farm.state as state',
                'COUNT(farm.id) as farmCount',
                'SUM(farm.total_area) as totalArea',
                'AVG(farm.total_area) as avgArea',
                'SUM(farm.agricultural_area) as totalAgricultural',
                'SUM(farm.vegetation_area) as totalVegetation',
            ])
            .groupBy('farm.state')
            .orderBy('totalArea', 'DESC')
            .getRawMany();
    }

    async getTopProductiveFarms(limit: number = 10) {
        return await this.createQueryBuilder('farm')
            .leftJoinAndSelect('farm.producer', 'producer')
            .leftJoinAndSelect('farm.planted_crops', 'crops')
            .select([
                'farm.id',
                'farm.name',
                'farm.city',
                'farm.state',
                'farm.total_area',
                'farm.agricultural_area',
                'producer.name',
                'COUNT(crops.id) as cropCount',
            ])
            .groupBy('farm.id, producer.id')
            .orderBy('farm.agricultural_area', 'DESC')
            .limit(limit)
            .getRawMany();
    }
} 