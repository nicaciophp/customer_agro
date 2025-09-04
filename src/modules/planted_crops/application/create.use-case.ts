import { Injectable } from "@nestjs/common";
import { CustomLoggerService } from "src/common/logger/custom-logger.service";
import { LogMethod } from "src/common/decorators/log-method.decorator";
import { PlantedCropsRepository } from "../repositories/planted-crops.repository";
import { CreatePlantedCropDto } from "../dto/create-planted_crop.dto";

@Injectable()
export class CreateUseCase {
    constructor(
        private readonly plantedCropsRepository: PlantedCropsRepository,
        private readonly logger: CustomLoggerService,
    ) { }
    @LogMethod('Create planted crops')
    async execute(data: CreatePlantedCropDto) {
        try {
            this.logger.logBusinessEvent('planted_crops_creation_started', {
                farmId: data.farm_id,
                farmName: data.name
            });

            const planted_crops = await this.plantedCropsRepository.createEntity(data);

            this.logger.logBusinessEvent('planted_crops_created', {
                plantedCropsId: planted_crops.id,
                farmId: planted_crops.farm_id,
                farmName: planted_crops.name,
            });

            return planted_crops;
        } catch (error) {
            this.logger.error('Failed to create planted crops', error.stack, {
               farmId: data.farm_id,
            });
            throw error;
        }
    }
}