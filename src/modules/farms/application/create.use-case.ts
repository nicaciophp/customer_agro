import { Injectable } from "@nestjs/common";
import { CustomLoggerService } from "../../../common/logger/custom-logger.service";
import { LogMethod } from "../../../common/decorators/log-method.decorator";
import { FarmRepository } from "../repositories/farm.repository";
import { CreateFarmDto } from "../dto/create-farm.dto";

@Injectable()
export class CreateUseCase {
    constructor(
        private readonly farmsRepository: FarmRepository,
        private readonly logger: CustomLoggerService,
    ) { }
    @LogMethod('Create farm')
    async execute(data: CreateFarmDto) {
        try {
            this.logger.logBusinessEvent('farm_creation_started', {
                producerId: data.producer_id,
                farmName: data.name
            });

            const farm = await this.farmsRepository.createEntity(data);

            this.logger.logBusinessEvent('farm_created', {
                farmId: farm.id,
                producerId: farm.producer_id,
                farmName: farm.name,
                totalArea: farm.total_area
            });

            return farm;
        } catch (error) {
            this.logger.error('Failed to create farm', error.stack, {
                producerId: data.producer_id
            });
            throw error;
        }
    }
}