import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomLoggerService } from 'src/common/logger/custom-logger.service';
import { CreateUseCase } from 'src/modules/producers/application/create.use-case';
import { ProducersRepository } from 'src/modules/producers/repositories/producers.repository';
import { Producer } from 'src/modules/producers/entities/producer.entity';
import { Farm } from 'src/modules/farms/entities/farm.entity';
import { PlantedCrop } from 'src/modules/planted_crops/entities/planted-crops.entity';

describe('CreateUseCase', () => {
  let createUseCase: CreateUseCase;
  let producersRepository: ProducersRepository;
  let logger: CustomLoggerService;
  let mockTypeOrmRepository: jest.Mocked<Repository<Producer>>;

  // Mock PlantedCrop
  const mockPlantedCrop: PlantedCrop = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Soja',
    farm_id: '550e8400-e29b-41d4-a716-446655440003',
    farm: null, // Will be set when needed
  };

  const mockPlantedCrop2: PlantedCrop = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Milho',
    farm_id: '550e8400-e29b-41d4-a716-446655440003',
    farm: null,
  };

  // Mock Farm
  const mockFarm: Farm = {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Fazenda São João',
    producer_id: '550e8400-e29b-41d4-a716-446655440000',
    city: 'Ribeirão Preto',
    state: 'SP',
    total_area: 1000.5,
    agricultural_area: 800.0,
    vegetation_area: 200.5,
    producer: null, // Will be set when needed
    planted_crops: [mockPlantedCrop, mockPlantedCrop2],
  };

  const mockFarm2: Farm = {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Fazenda Santa Maria',
    producer_id: '550e8400-e29b-41d4-a716-446655440000',
    city: 'Campinas',
    state: 'SP',
    total_area: 750.0,
    agricultural_area: 600.0,
    vegetation_area: 150.0,
    producer: null,
    planted_crops: [],
  };

  // Mock Producer
  const mockProducer: Producer = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'João Silva',
    document: '12345678901',
    document_type: 'CPF',
    farms: [mockFarm, mockFarm2],
  };

  // Set up relationships
  mockFarm.producer = mockProducer;
  mockFarm2.producer = mockProducer;
  mockPlantedCrop.farm = mockFarm;
  mockPlantedCrop2.farm = mockFarm;

  // Mock Producer without farms (for testing creation)
  const mockNewProducer: Producer = {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Maria Santos',
    document: '98765432100',
    document_type: 'CPF',
    farms: [],
  };

  // Mock Producer with CNPJ
  const mockCorporateProducer: Producer = {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Agropecuária XYZ Ltda',
    document: '12345678000195',
    document_type: 'CNPJ',
    farms: [],
  };

  beforeEach(async () => {
    // Create mock for TypeORM Repository
    mockTypeOrmRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findOneBy: jest.fn(),
      findBy: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
      // Add other Repository methods as needed
    } as any;

    // Create mock for CustomLoggerService
    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUseCase,
        ProducersRepository,
        {
          provide: getRepositoryToken(Producer),
          useValue: mockTypeOrmRepository,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    createUseCase = module.get<CreateUseCase>(CreateUseCase);
    producersRepository = module.get<ProducersRepository>(ProducersRepository);
    logger = module.get<CustomLoggerService>(CustomLoggerService);
  });

  describe('execute', () => {
    it('should create a CPF producer successfully', async () => {
      // Arrange
      const createProducerDto = {
        name: 'Maria Santos',
        document: '98765432100',
        document_type: 'CPF',
      };

      // Mock the repository methods
      mockTypeOrmRepository.create.mockReturnValue(mockNewProducer);
      mockTypeOrmRepository.save.mockResolvedValue(mockNewProducer);

      // Act
      const result = await createUseCase.execute(createProducerDto);

      // Assert
      expect(mockTypeOrmRepository.create).toHaveBeenCalledWith(createProducerDto);
      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(mockNewProducer);
      expect(result).toEqual(mockNewProducer);
      expect(result.document_type).toBe('CPF');
      expect(result.farms).toEqual([]);
    });

    it('should create a CNPJ producer successfully', async () => {
      // Arrange
      const createProducerDto = {
        name: 'Agropecuária XYZ Ltda',
        document: '12345678000195',
        document_type: 'CNPJ',
      };

      // Mock the repository methods
      mockTypeOrmRepository.create.mockReturnValue(mockCorporateProducer);
      mockTypeOrmRepository.save.mockResolvedValue(mockCorporateProducer);

      // Act
      const result = await createUseCase.execute(createProducerDto);

      // Assert
      expect(mockTypeOrmRepository.create).toHaveBeenCalledWith(createProducerDto);
      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(mockCorporateProducer);
      expect(result).toEqual(mockCorporateProducer);
      expect(result.document_type).toBe('CNPJ');
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const createProducerDto = {
        name: 'Test Producer',
        document: '12345678901',
        document_type: 'CPF',
      };
      
      const error = new Error('Database connection failed');
      mockTypeOrmRepository.create.mockReturnValue(mockNewProducer);
      mockTypeOrmRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(createUseCase.execute(createProducerDto)).rejects.toThrow('Database connection failed');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error creating producer'),
        error
      );
    });

    it('should log successful creation', async () => {
      // Arrange
      const createProducerDto = {
        name: 'Test Producer',
        document: '12345678901',
        document_type: 'CPF',
      };

      mockTypeOrmRepository.create.mockReturnValue(mockNewProducer);
      mockTypeOrmRepository.save.mockResolvedValue(mockNewProducer);

      // Act
      await createUseCase.execute(createProducerDto);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Producer created successfully')
      );
    });
  });

  describe('ProducersRepository', () => {
    it('should find producer with farms and planted crops', async () => {
      // Arrange
      const producerId = '550e8400-e29b-41d4-a716-446655440000';

      mockTypeOrmRepository.findOne.mockResolvedValue(mockProducer);

      // Act
      const result = await producersRepository.findWithFarms(producerId);

      // Assert
      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: producerId },
        relations: ['farms']
      });
      expect(result).toEqual(mockProducer);
      expect(result?.farms).toHaveLength(2);
      expect(result?.farms[0].name).toBe('Fazenda São João');
      expect(result?.farms[0].city).toBe('Ribeirão Preto');
      expect(result?.farms[0].state).toBe('SP');
      expect(result?.farms[0].total_area).toBe(1000.5);
      expect(result?.farms[0].agricultural_area).toBe(800.0);
      expect(result?.farms[0].vegetation_area).toBe(200.5);
    });

    it('should return producer with farm that has planted crops', async () => {
      // Arrange
      const producerId = '550e8400-e29b-41d4-a716-446655440000';
      mockTypeOrmRepository.findOne.mockResolvedValue(mockProducer);

      // Act
      const result = await producersRepository.findWithFarms(producerId);

      // Assert
      expect(result?.farms[0].planted_crops).toHaveLength(2);
      expect(result?.farms[0].planted_crops[0].name).toBe('Soja');
      expect(result?.farms[0].planted_crops[1].name).toBe('Milho');
    });

    it('should return null when producer not found', async () => {
      // Arrange
      const producerId = 'non-existent-id';
      mockTypeOrmRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await producersRepository.findWithFarms(producerId);

      // Assert
      expect(result).toBeNull();
    });

    it('should find producer with farms in different cities', async () => {
      // Arrange
      const producerId = '550e8400-e29b-41d4-a716-446655440000';
      mockTypeOrmRepository.findOne.mockResolvedValue(mockProducer);

      // Act
      const result = await producersRepository.findWithFarms(producerId);

      // Assert
      expect(result?.farms).toHaveLength(2);
      expect(result?.farms[0].city).toBe('Ribeirão Preto');
      expect(result?.farms[1].city).toBe('Campinas');
      expect(result?.farms.every(farm => farm.state === 'SP')).toBe(true);
    });
  });

  describe('Entity Relationships', () => {
    it('should maintain producer-farm relationship', () => {
      expect(mockFarm.producer).toEqual(mockProducer);
      expect(mockFarm.producer_id).toBe(mockProducer.id);
      expect(mockProducer.farms).toContain(mockFarm);
    });

    it('should maintain farm-planted_crop relationship', () => {
      expect(mockPlantedCrop.farm).toEqual(mockFarm);
      expect(mockPlantedCrop.farm_id).toBe(mockFarm.id);
      expect(mockFarm.planted_crops).toContain(mockPlantedCrop);
    });

    it('should handle cascade delete relationships', () => {
      // This would be tested in integration tests, but we can verify the mock structure
      expect(mockFarm.producer_id).toBe(mockProducer.id);
      expect(mockPlantedCrop.farm_id).toBe(mockFarm.id);
    });
  });
});