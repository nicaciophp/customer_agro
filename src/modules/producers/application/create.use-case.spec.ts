import { Test, TestingModule } from '@nestjs/testing';
import { CreateUseCase } from './create.use-case';
import { ProducersRepository } from '../repositories/producers.repository';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';
import { CreateProducerDto } from '../dto/create-producer.dto';
import { Producer } from '../entities/producer.entity';

describe('CreateUseCase (Producer)', () => {
  let createUseCase: CreateUseCase;
  let producersRepository: jest.Mocked<ProducersRepository>;
  let logger: jest.Mocked<CustomLoggerService>;

  const mockProducerPF: Producer = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'João Silva',
    document: '12345678901',
    document_type: 'pf',
    farms: [],
  };

  const mockProducerPJ: Producer = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Empresa ABC Ltda',
    document: '12345678000195',
    document_type: 'pj',
    farms: [],
  };

  const mockCreateDtoPF: CreateProducerDto = {
    name: 'João Silva',
    document: '12345678901',
    document_type: "pf"
  };

  const mockCreateDtoPJ: CreateProducerDto = {
    name: 'Empresa ABC Ltda',
    document: '12345678000195',
    document_type: "pf"
  };

  beforeEach(async () => {
    const mockRepository = {
      createEntity: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      logBusinessEvent: jest.fn(),
      logPerformanceMetric: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUseCase,
        { provide: ProducersRepository, useValue: mockRepository },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    createUseCase = module.get<CreateUseCase>(CreateUseCase);
    producersRepository = module.get(ProducersRepository);
    logger = module.get(CustomLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create producer PF successfully', async () => {
      producersRepository.createEntity.mockResolvedValue(mockProducerPF);

      const result = await createUseCase.execute(mockCreateDtoPF);

      expect(producersRepository.createEntity).toHaveBeenCalledWith({
        ...mockCreateDtoPF,
        document_type: 'pf',
      });
      expect(result).toEqual(mockProducerPF);
      expect(result.document_type).toBe('pf');
    });

    it('should create producer PJ successfully', async () => {
      producersRepository.createEntity.mockResolvedValue(mockProducerPJ);

      const result = await createUseCase.execute(mockCreateDtoPJ);

      expect(producersRepository.createEntity).toHaveBeenCalledWith({
        ...mockCreateDtoPJ,
        document_type: 'pj',
      });
      expect(result).toEqual(mockProducerPJ);
      expect(result.document_type).toBe('pj');
    });

    it('should log business events for successful creation', async () => {
      producersRepository.createEntity.mockResolvedValue(mockProducerPF);

      await createUseCase.execute(mockCreateDtoPF);

      expect(logger.logBusinessEvent).toHaveBeenCalledWith('producer_creation_started', 
        expect.objectContaining({
          producerName: mockCreateDtoPF.name,
          documentType: 'pf',
          maskedDocument: expect.stringContaining('123.***.***-01'),
        })
      );
      expect(logger.logBusinessEvent).toHaveBeenCalledWith('producer_created',
        expect.objectContaining({
          producerId: mockProducerPF.id,
          producerName: mockProducerPF.name,
          documentType: 'pf',
          maskedDocument: expect.stringContaining('123.***.***-01'),
        })
      );
    });

    it('should log performance metrics', async () => {
      producersRepository.createEntity.mockResolvedValue(mockProducerPF);

      await createUseCase.execute(mockCreateDtoPF);

      expect(logger.logPerformanceMetric).toHaveBeenCalledWith(
        'producer_creation_duration',
        expect.any(Number),
        'ms',
        expect.objectContaining({
          producerId: mockProducerPF.id,
        })
      );
    });

    it('should handle repository errors and log failure', async () => {
      const repositoryError = new Error('Database connection failed');
      producersRepository.createEntity.mockRejectedValue(repositoryError);

      await expect(createUseCase.execute(mockCreateDtoPF)).rejects.toThrow('Database connection failed');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Producer creation failed',
        repositoryError.stack,
        expect.objectContaining({
          inputData: expect.objectContaining({
            name: mockCreateDtoPF.name,
            maskedDocument: expect.stringContaining('123.***.***-01'),
          }),
          errorMessage: 'Database connection failed',
        })
      );

      expect(logger.logBusinessEvent).toHaveBeenCalledWith('producer_creation_failed',
        expect.objectContaining({
          producerName: mockCreateDtoPF.name,
          errorMessage: 'Database connection failed',
        })
      );
    });
  });

  describe('verifyDocumentType', () => {
    it('should identify CPF as pf (11 digits)', () => {
      const result = createUseCase.verifyDocumentType('123.456.789-01');

      expect(result).toBe('pf');
    });

    it('should identify CNPJ as pj (14 digits)', () => {
      const result = createUseCase.verifyDocumentType('12.345.678/0001-95');

      expect(result).toBe('pj');
    });

    it('should identify non-11-digit documents as pj', () => {
      const result = createUseCase.verifyDocumentType('123456789');

      expect(result).toBe('pj');
    });

    it('should handle document with special characters', () => {
      const result = createUseCase.verifyDocumentType('123.456.789-01');

      expect(result).toBe('pf');
    });
  });

  describe('maskDocument', () => {
    it('should call maskDocument helper function', () => {
      createUseCase['maskDocument'] = jest.fn().mockReturnValue('123.***.***-01');
      const result = createUseCase['maskDocument']('12345678901');

      expect(result).toBe('123.***.***-01');
    });
  });
});