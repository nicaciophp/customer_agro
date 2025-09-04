import { Injectable, NotFoundException } from "@nestjs/common";
import { ProducersRepository } from "../repositories/producers.repository";
import { CustomLoggerService } from "src/common/logger/custom-logger.service";
import { LogMethod } from "src/common/decorators/log-method.decorator";

@Injectable()
export class GetByIdUseCase {
    constructor(
        private readonly producersRepository: ProducersRepository,
        private readonly logger: CustomLoggerService,
    ) {}

    @LogMethod('Get producer by ID')
    async execute(id: string) {
        const startTime = Date.now();
        const operationId = `get-producer-${Date.now()}`;
        
        try {
            this.logger.log('Starting producer retrieval by ID', {
                operationId,
                producerId: id
            });

            this.logger.debug('Fetching producer from database', {
                operationId,
                producerId: id,
                includeRelations: ['farms']
            });

            const producer = await this.producersRepository.findOne(id, {
                relations: ["farms"]
            });

            if (!producer) {
                this.logger.warn('Producer not found', {
                    operationId,
                    producerId: id
                });
                throw new NotFoundException("Producer not found");
            }

            const duration = Date.now() - startTime;

            this.logger.log('Producer retrieved successfully', {
                operationId,
                producerId: id,
                producerName: producer.name,
                farmsCount: producer.farms?.length || 0,
                duration,
                success: true
            });

            return producer;

        } catch (error) {
            const duration = Date.now() - startTime;
            
            if (error instanceof NotFoundException) {
                this.logger.log('Producer retrieval completed - not found', {
                    operationId,
                    producerId: id,
                    duration,
                    found: false
                });
            } else {
                this.logger.error('Producer retrieval failed', error.stack, {
                    operationId,
                    producerId: id,
                    duration,
                    errorMessage: error.message,
                    errorType: error.constructor.name
                });
            }

            throw error;
        }
    }
}