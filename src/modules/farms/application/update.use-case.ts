import { Injectable } from "@nestjs/common";
import { CustomLoggerService } from "../../../common/logger/custom-logger.service";
import { FarmRepository } from "../repositories/farm.repository";
import { UpdateFarmDto } from "../dto/update-farm.dto";

@Injectable()
export class UpdateUseCase {
    constructor(
        private readonly farmsRepository: FarmRepository,
        private readonly logger: CustomLoggerService
    ) { }
    async execute(id: string, data: UpdateFarmDto) {
        const existingFarm = await this.farmsRepository.findOne(id);

        this.logger.logBusinessEvent('farm_update_started', {
            farmId: id,
            changes: data
        });

        const updatedFarm = await this.farmsRepository.updateEntity(
            id,
            data,
            ['producer']
        );

        this.logger.logBusinessEvent('farm_updated', {
            farmId: id,
            oldData: existingFarm,
            newData: updatedFarm
        });

        return updatedFarm;
    }
}