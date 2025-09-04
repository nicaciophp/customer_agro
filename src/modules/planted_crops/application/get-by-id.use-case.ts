import { Injectable, NotFoundException } from "@nestjs/common";
import { CustomLoggerService } from "src/common/logger/custom-logger.service";
import { PlantedCropsRepository } from "../repositories/planted-crops.repository";

@Injectable()
export class GetByIdUseCase {
    constructor(
        private readonly plantedCropRepository: PlantedCropsRepository,
        private readonly logger: CustomLoggerService
    ) { }
    async execute(id: string) {
        const planted_crop = await this.plantedCropRepository.findOne(id, {
            relations: ['farm']
        });

        if (!planted_crop) {
            this.logger.warn(`Planted Crop not found: ${id}`);
            throw new NotFoundException(`Planted Crop with ID ${id} not found`);
        }

        this.logger.log(`Planted retrieved: ${planted_crop.name}`, { plantedCropId: id });
        return planted_crop;
    }
}