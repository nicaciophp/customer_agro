import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetByIdUseCase } from './get-by-id.use-case';
import { ProducersRepository } from '../repositories/producers.repository';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';
import { Producer } from '../entities/producer.entity';

describe('GetByIdUseCase (Producer)', () => {
  let getByIdUseCase: GetByIdUseCase;
  let producersRepository: jest.Mocked<ProducersRepository>;
  let logger: jest.Mocked<CustomLoggerService>;

  const mockProducer: Producer = {
    id: 'producer-1',
    name: 'João Silva',
    document: '12345678901',
    document_type: 'pf',
    farms: [
      {
        id: 'farm-1',
        name: 'Fazenda Santa Rita',
        producer_id: 'producer-1',
        city: 'Ribeirão Preto',
        state: 'SP',
        total_area: 1000,
        agricultural_area: 800,
        vegetation_area: 200,
        producer: null as any,
        planted_crops: [],
      }
    ],
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetByIdUseCase,
        { provide: ProducersRepository, useValue: mockRepository },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    getByIdUseCase = module.get<GetByIdUseCase>(GetByIdUseCase);
    producersRepository = module.get(ProducersRepository);
    logger = module.get(CustomLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return producer with farms when found', async () => {
      const producerId = 'producer-1';
      producersRepository.findOne.mockResolvedValue(mockProducer);

      const result = await getByIdUseCase.execute(producerId);

      expect(producersRepository.findOne).toHaveBeenCalledWith(producerId, {
        relations: ['farms']
      });
      expect(result).toEqual(mockProducer);
      expect(result.id).toBe(producerId);
      expect(result.name).toBe('João Silva');
      expect(result.farms).toHaveLength(1);
    });

    it('should log successful retrieval', async () => {
      const producerId = 'producer-1';
      producersRepository.findOne.mockResolvedValue(mockProducer);

      await getByIdUseCase.execute(producerId);

      expect(logger.log).toHaveBeenCalledWith('Starting producer retrieval by ID', 
        expect.objectContaining({
          producerId: producerId,
        })
      );
      expect(logger.log).toHaveBeenCalledWith('Producer retrieved successfully',
        expect.objectContaining({
          producerId: producerId,
          producerName: mockProducer.name,
          farmsCount: 1,
          success: true,
        })
      );
    });

    it('should throw NotFoundException when producer not found', async () => {
      const producerId = 'non-existent-id';
      producersRepository.findOne.mockResolvedValue(null);

      await expect(getByIdUseCase.execute(producerId)).rejects.toThrow(NotFoundException);
      await expect(getByIdUseCase.execute(producerId)).rejects.toThrow('Producer not found');
    });

    it('should log warning and not-found info when producer not found', async () => {
      const producerId = 'non-existent-id';
      producersRepository.findOne.mockResolvedValue(null);

      try {
        await getByIdUseCase.execute(producerId);
      } catch (error) {
      }

      expect(logger.warn).toHaveBeenCalledWith('Producer not found',
        expect.objectContaining({
          producerId: producerId,
        })
      );
      expect(logger.log).toHaveBeenCalledWith('Producer retrieval completed - not found',
        expect.objectContaining({
          producerId: producerId,
          found: false,
        })
      );
    });

    it('should handle repository errors', async () => {
      const producerId = 'producer-1';
      const repositoryError = new Error('Database connection failed');
      producersRepository.findOne.mockRejectedValue(repositoryError);

      await expect(getByIdUseCase.execute(producerId)).rejects.toThrow('Database connection failed');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Producer retrieval failed',
        repositoryError.stack,
        expect.objectContaining({
          producerId: producerId,
          errorMessage: 'Database connection failed',
        })
      );
    });

    it('should include debug logs for database fetch', async () => {
      const producerId = 'producer-1';
      producersRepository.findOne.mockResolvedValue(mockProducer);

      await getByIdUseCase.execute(producerId);

      expect(logger.debug).toHaveBeenCalledWith('Fetching producer from database',
        expect.objectContaining({
          producerId: producerId,
          includeRelations: ['farms'],
        })
      );
    });

    it('should handle producer without farms', async () => {
      const producerId = 'producer-1';
      const producerWithoutFarms = { ...mockProducer, farms: [] };
      producersRepository.findOne.mockResolvedValue(producerWithoutFarms);

      const result = await getByIdUseCase.execute(producerId);

      expect(result.farms).toHaveLength(0);
      expect(logger.log).toHaveBeenCalledWith('Producer retrieved successfully',
        expect.objectContaining({
          farmsCount: 0,
        })
      );
    });
  });
});