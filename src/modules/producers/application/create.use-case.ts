import { Injectable } from "@nestjs/common";
import { CreateProducerDto } from "../dto/create-producer.dto";
import { ProducersRepository } from "../repositories/producers.repository";
import { LogMethod } from "../../../common/decorators/log-method.decorator";
import { CustomLoggerService } from "../../../common/logger/custom-logger.service";
import { maskDocument } from "../../../common/helpers/mask-document.helpers";

@Injectable()
export class CreateUseCase {
    constructor(
        private readonly producersRepository: ProducersRepository,
        private readonly logger: CustomLoggerService,
    ) {}

    @LogMethod('Create new producer')
    async execute(data: CreateProducerDto) {
        const startTime = Date.now();
        const operationId = `create-producer-${Date.now()}`;
        
        try {
            this.logger.log('Starting producer creation process', {
                operationId,
                inputData: {
                    name: data.name,
                    document: maskDocument(data.document)
                }
            });

            this.logger.debug('Determining document type', { 
                operationId,
                documentLength: data.document?.length
            });

            data.document_type = this.verifyDocumentType(data.document);
            
            this.logger.log('Document type determined', {
                operationId,
                documentType: data.document_type,
                maskedDocument: maskDocument(data.document)
            });

            this.logger.logBusinessEvent('producer_creation_started', {
                operationId,
                producerName: data.name,
                documentType: data.document_type,
                maskedDocument: maskDocument(data.document)
            });

            this.logger.debug('Creating producer entity in database', { operationId });
            const producer = await this.producersRepository.createEntity(data);

            const duration = Date.now() - startTime;

            this.logger.logBusinessEvent('producer_created', {
                operationId,
                producerId: producer.id,
                producerName: producer.name,
                documentType: producer.document_type,
                maskedDocument: maskDocument(producer.document),
                duration
            });

            this.logger.logPerformanceMetric('producer_creation_duration', duration, 'ms', {
                operationId,
                producerId: producer.id
            });

            this.logger.log('Producer creation completed successfully', {
                operationId,
                producerId: producer.id,
                producerName: producer.name,
                documentType: producer.document_type,
                duration,
                success: true
            });

            return producer;

        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.logger.error('Producer creation failed', error.stack, {
                operationId,
                inputData: {
                    name: data.name,
                    maskedDocument: maskDocument(data.document),
                    documentType: data.document_type
                },
                duration,
                errorMessage: error.message,
                errorType: error.constructor.name
            });

            this.logger.logBusinessEvent('producer_creation_failed', {
                operationId,
                producerName: data.name,
                errorMessage: error.message,
                duration
            });

            throw error;
        }
    }

    verifyDocumentType(document: string) {
        try {
            this.logger.debug('Starting document type verification', {
                hasDocument: !!document,
                documentLength: document?.length
            });

            const removeCharacters = (document ?? '').toString().replace(/\D/g, '');
            
            this.logger.debug('Document processed for type verification', {
                originalLength: document?.length,
                cleanLength: removeCharacters.length,
                maskedDocument: maskDocument(removeCharacters)
            });

            let documentType: string;
            
            if(removeCharacters.length === 11) {
                documentType = 'pf';
                this.logger.log('Document identified as PF (11 digits)', {
                    documentType,
                    maskedDocument: maskDocument(removeCharacters)
                });
            } else {
                documentType = 'pj';
                this.logger.log('Document identified as PJ (not 11 digits)', {
                    documentType,
                    cleanLength: removeCharacters.length,
                    maskedDocument: maskDocument(removeCharacters)
                });
            }

            this.logger.debug('Document type verification completed', {
                documentType,
                maskedDocument: maskDocument(removeCharacters)
            });

            return documentType;

        } catch (error) {
            this.logger.error('Error during document type verification', error.stack, {
                hasDocument: !!document,
                documentLength: document?.length,
                errorMessage: error.message
            });
            throw error;
        }
    }
}