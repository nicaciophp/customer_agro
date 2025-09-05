import { Injectable } from "@nestjs/common";
import { LogMethod } from "../../../common/decorators/log-method.decorator";
import { CustomLoggerService } from "../../../common/logger/custom-logger.service";
import { FarmRepository } from "../repositories/farm.repository";

@Injectable()
export class DeleteUseCase {
    constructor(
        private readonly farmsRepository: FarmRepository,
        private readonly logger: CustomLoggerService,
    ) { }
    @LogMethod('Remove farm')
    async execute(id: string) {
        const farm = await this.farmsRepository.findOne(id);

        this.logger.logBusinessEvent('farm_deletion_started', {
            farmId: id,
            farmName: farm?.name
        });

        const result = await this.farmsRepository.deleteEntity(id);

        if (result.success) {
            this.logger.logBusinessEvent('farm_deleted', {
                farmId: id,
                farmName: farm?.name
            });
        }

        return result;
    }
}