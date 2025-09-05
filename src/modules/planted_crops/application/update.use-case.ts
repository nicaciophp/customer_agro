import { Injectable } from "@nestjs/common";
import { CustomLoggerService } from "../../../common/logger/custom-logger.service";
import { PlantedCropsRepository } from "../repositories/planted-crops.repository";
import { UpdatePlantedCropDto } from "../dto/update-planted_crop.dto";

@Injectable()
export class UpdateUseCase {
    constructor(
        private readonly farmsRepository: PlantedCropsRepository,
        private readonly logger: CustomLoggerService
    ) { }
    async execute(id: string, data: UpdatePlantedCropDto) {
        const existingFarm = await this.farmsRepository.findOne(id);

        this.logger.logBusinessEvent('planted_crop_update_started', {
            plantedCropId: id,
            changes: data
        });

        const updatedFarm = await this.farmsRepository.updateEntity(
            id,
            data,
            ['farm']
        );

        this.logger.logBusinessEvent('planted_crop_updated', {
            plantedCropId: id,
            oldData: existingFarm,
            newData: updatedFarm
        });

        return updatedFarm;
    }
}