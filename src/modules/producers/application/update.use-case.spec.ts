import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUseCase } from './update.use-case';
import { ProducersRepository } from '../repositories/producers.repository';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';
import { UpdateProducerDto } from '../dto/update-producer.dto';
import { Producer } from '../entities/producer.entity';

describe('UpdateUseCase (Producer)', () => {
  let updateUseCase: UpdateUseCase;
  let producersRepository: jest.Mocked<ProducersRepository>;
  let logger: jest.Mocked<CustomLoggerService>;

  const mockUpdatedProducer: Producer = {
    id: 'producer-1',
    name: 'João Silva Santos',
    document: '12345678901',
    document_type: 'pf',
    farms: [],
  };

  const mockUpdateDto: UpdateProducerDto = {
    name: 'João Silva Santos',
  };

  beforeEach(async () => {
    const mockRepository = {
      updateEntity: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUseCase,
        { provide: ProducersRepository, useValue: mockRepository },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    updateUseCase = module.get<UpdateUseCase>(UpdateUseCase);
    producersRepository = module.get(ProducersRepository);
    logger = module.get(CustomLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update producer successfully', async () => {
      const producerId = 'producer-1';
      producersRepository.updateEntity.mockResolvedValue(mockUpdatedProducer);

      const result = await updateUseCase.execute(producerId, mockUpdateDto);

      expect(producersRepository.updateEntity).toHaveBeenCalledWith(producerId, mockUpdateDto);
      expect(result).toEqual(mockUpdatedProducer);
      expect(result?.name).toBe('João Silva Santos');
    });

    it('should log update process', async () => {
      const producerId = 'producer-1';
      producersRepository.updateEntity.mockResolvedValue(mockUpdatedProducer);

      await updateUseCase.execute(producerId, mockUpdateDto);

      expect(logger.log).toHaveBeenCalledWith('Starting producer update',
        expect.objectContaining({
          producerId: producerId,
          updateFields: ['name'],
        })
      );
      expect(logger.debug).toHaveBeenCalledWith('Updating producer in database',
        expect.objectContaining({
          producerId: producerId,
          data: mockUpdateDto,
        })
      );
      expect(logger.log).toHaveBeenCalledWith('Producer updated successfully',
        expect.objectContaining({
          producerId: producerId,
          producerName: mockUpdatedProducer.name,
          updatedFields: ['name'],
          success: true,
        })
      );
    });

    it('should handle repository errors', async () => {
      const producerId = 'producer-1';
      const repositoryError = new Error('Database connection failed');
      producersRepository.updateEntity.mockRejectedValue(repositoryError);

      await expect(updateUseCase.execute(producerId, mockUpdateDto)).rejects.toThrow('Database connection failed');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Producer update failed',
        repositoryError.stack,
        expect.objectContaining({
          producerId: producerId,
          updateFields: ['name'],
          errorMessage: 'Database connection failed',
        })
      );
    });

    it('should handle multiple field updates', async () => {
      const producerId = 'producer-1';
      const multiFieldUpdateDto: UpdateProducerDto = {
        name: 'João Silva Santos',
      };
      const updatedProducerMultiField = {
        ...mockUpdatedProducer,
      };
      producersRepository.updateEntity.mockResolvedValue(updatedProducerMultiField);

      const result = await updateUseCase.execute(producerId, multiFieldUpdateDto);

      expect(producersRepository.updateEntity).toHaveBeenCalledWith(producerId, multiFieldUpdateDto);
      expect(result?.name).toBe('João Silva Santos');
      expect(logger.log).toHaveBeenCalledWith('Starting producer update',
        expect.objectContaining({
          updateFields: ['name'],
        })
      );
    });

    it('should handle empty update data', async () => {
      const producerId = 'producer-1';
      const emptyUpdateDto: UpdateProducerDto = {};
      producersRepository.updateEntity.mockResolvedValue(mockUpdatedProducer);

      const result = await updateUseCase.execute(producerId, emptyUpdateDto);

      expect(producersRepository.updateEntity).toHaveBeenCalledWith(producerId, emptyUpdateDto);
      expect(result).toEqual(mockUpdatedProducer);
      expect(logger.log).toHaveBeenCalledWith('Starting producer update',
        expect.objectContaining({
          updateFields: [],
        })
      );
    });
  });
});