import { Injectable } from '@nestjs/common';
import { FarmRepository } from '../../../modules/farms/repositories/farm.repository';
import { PlantedCropsRepository } from '../../../modules/planted_crops/repositories/planted-crops.repository';
import { ProducersRepository } from '../../../modules/producers/repositories/producers.repository';

export interface DashboardData {
    totalFarms: number;
    totalHectares: number;
    totalProducers: number;
    chartData: {
        farmsByState: Array<{ name: string; value: number; percentage: number }>;
        cropsByType: Array<{ name: string; value: number; percentage: number }>;
        landUse: Array<{ name: string; value: number; percentage: number }>;
    };
    averages: {
        avgFarmSize: number;
        avgAgriculturalArea: number;
        avgVegetationArea: number;
    };
    topStates: Array<{ name: string; value: number; totalArea?: number }>;
    topCrops: Array<{ name: string; value: number; totalArea?: number }>;
}

@Injectable()
export class FindUseCase {
    constructor(
        private readonly farmRepository: FarmRepository,
        private readonly producerRepository: ProducersRepository,
        private readonly plantedCropRepository: PlantedCropsRepository,
    ) { }

    async getDashboardData(): Promise<DashboardData> {
        const [
            totalFarms,
            totalHectares,
            totalProducers,
            farmsByState,
            cropsData,
            landUseData,
            averagesData,
        ] = await Promise.all([
            this.getTotalFarms(),
            this.getTotalHectares(),
            this.getTotalProducers(),
            this.getFarmsByState(),
            this.getCropsByType(),
            this.getLandUseData(),
            this.getAverageData(),
        ]);

        return {
            totalFarms,
            totalHectares,
            totalProducers,
            chartData: {
                farmsByState: this.calculatePercentages(farmsByState),
                cropsByType: this.calculatePercentages(cropsData),
                landUse: this.calculatePercentages(landUseData),
            },
            averages: averagesData,
            topStates: farmsByState.slice(0, 5),
            topCrops: cropsData.slice(0, 5),
        };
    }

    private async getTotalFarms(): Promise<number> {
        return await this.farmRepository.count();
    }

    private async getTotalHectares(): Promise<number> {
        return await this.farmRepository.getTotalHectares();
    }

    private async getTotalProducers(): Promise<number> {
        return await this.producerRepository.count();
    }

    private async getFarmsByState(): Promise<Array<{ name: string; value: number; totalArea?: number }>> {
        return await this.farmRepository.getFarmsByState();
    }

    private async getCropsByType(): Promise<Array<{ name: string; value: number; totalArea?: number }>> {
        return await this.plantedCropRepository.getCropsByType();
    }

    private async getLandUseData(): Promise<Array<{ name: string; value: number }>> {
        return await this.farmRepository.getLandUseData();
    }

    private async getAverageData() {
        return await this.farmRepository.getAverageData();
    }

    private calculatePercentages(data: Array<{ name: string; value: number; totalArea?: number }>) {
        const total = data.reduce((sum, item) => sum + item.value, 0);

        return data.map(item => ({
            name: item.name,
            value: item.value,
            percentage: total > 0 ? parseFloat(((item.value / total) * 100).toFixed(2)) : 0,
        }));
    }

    async getStateStatistics() {
        return await this.farmRepository.getStateStatistics();
    }

    async getCropStatistics() {
        return await this.plantedCropRepository.getCropStatistics();
    }

    async getTopProductiveFarms(limit: number = 10) {
        return await this.farmRepository.getTopProductiveFarms(limit);
    }
}