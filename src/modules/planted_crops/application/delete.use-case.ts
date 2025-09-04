import { Injectable } from "@nestjs/common";
import { LogMethod } from "src/common/decorators/log-method.decorator";
import { CustomLoggerService } from "src/common/logger/custom-logger.service";
import { PlantedCropsRepository } from "../repositories/planted-crops.repository";

@Injectable()
export class DeleteUseCase {
    constructor(
        private readonly plantedCropRepository: PlantedCropsRepository,
        private readonly logger: CustomLoggerService,
    ) { }
    @LogMethod('Remove planted crop')
    async execute(id: string) {
        const planted_crop = await this.plantedCropRepository.findOne(id);

        this.logger.logBusinessEvent('planted_crop_deletion_started', {
            plantedCropId: id,
            plantedCropName: planted_crop?.name
        });

        const result = await this.plantedCropRepository.deleteEntity(id);

        if (result.success) {
            this.logger.logBusinessEvent('planted_crop_deleted', {
                plantedCropId: id,
                plantedCropName: planted_crop?.name
            });
        }

        return result;
    }
}