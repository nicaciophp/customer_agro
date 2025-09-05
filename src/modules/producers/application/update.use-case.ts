import { Injectable } from "@nestjs/common";
import { ProducersRepository } from "../repositories/producers.repository";
import { UpdateProducerDto } from "../dto/update-producer.dto";
import { CustomLoggerService } from "../../../common/logger/custom-logger.service";
import { LogMethod } from "../../../common/decorators/log-method.decorator";

@Injectable()
export class UpdateUseCase {
    constructor(
        private readonly producersRepository: ProducersRepository,
        private readonly logger: CustomLoggerService,
    ) {}

    @LogMethod('Update producer')
    async execute(id: string, data: UpdateProducerDto) {
        const startTime = Date.now();
        const operationId = `update-producer-${Date.now()}`;
        
        try {
            this.logger.log('Starting producer update', {
                operationId,
                producerId: id,
                updateFields: Object.keys(data)
            });

            this.logger.debug('Updating producer in database', {
                operationId,
                producerId: id,
                data: {
                    ...data,
                }
            });

            const updatedProducer = await this.producersRepository.updateEntity(id, data);

            const duration = Date.now() - startTime;

            this.logger.log('Producer updated successfully', {
                operationId,
                producerId: id,
                producerName: updatedProducer?.name,
                updatedFields: Object.keys(data),
                duration,
                success: true
            });

            return updatedProducer;

        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.logger.error('Producer update failed', error.stack, {
                operationId,
                producerId: id,
                updateFields: Object.keys(data),
                duration,
                errorMessage: error.message,
                errorType: error.constructor.name
            });

            throw error;
        }
    }
}