import { Test, TestingModule } from '@nestjs/testing';
import { CreateUseCase } from './create.use-case';
import { FarmRepository } from '../repositories/farm.repository';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';
import { CreateFarmDto } from '../dto/create-farm.dto';
import { Farm } from '../entites/farm.entity';

describe('CreateUseCase (Farm)', () => {
  let createUseCase: CreateUseCase;
  let farmRepository: jest.Mocked<FarmRepository>;
  let logger: jest.Mocked<CustomLoggerService>;

  const mockFarm: Farm = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Fazenda Santa Rita',
    producer_id: '550e8400-e29b-41d4-a716-446655440000',
    city: 'Ribeirão Preto',
    state: 'SP',
    total_area: 1250.75,
    agricultural_area: 950.50,
    vegetation_area: 300.25,
    producer: null as any,
    planted_crops: [],
  };

  const mockCreateFarmDto: CreateFarmDto = {
    name: 'Fazenda Santa Rita',
    producer_id: '550e8400-e29b-41d4-a716-446655440000',
    city: 'Ribeirão Preto',
    state: 'SP',
    total_area: 1250.75,
    agricultural_area: 950.50,
    vegetation_area: 300.25,
  };

  beforeEach(async () => {
    const mockFarmRepository = {
      createEntity: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
    };

    const mockCustomLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      logBusinessEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUseCase,
        {
          provide: FarmRepository,
          useValue: mockFarmRepository,
        },
        {
          provide: CustomLoggerService,
          useValue: mockCustomLogger,
        },
      ],
    }).compile();

    createUseCase = module.get<CreateUseCase>(CreateUseCase);
    farmRepository = module.get(FarmRepository);
    logger = module.get(CustomLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a farm successfully', async () => {
      farmRepository.createEntity.mockResolvedValue(mockFarm);

      const result = await createUseCase.execute(mockCreateFarmDto);

      expect(farmRepository.createEntity).toHaveBeenCalledWith(mockCreateFarmDto);
      expect(farmRepository.createEntity).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockFarm);
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(result.name).toBe('Fazenda Santa Rita');
      expect(result.total_area).toBe(1250.75);
    });

    it('should log business event when farm creation starts', async () => {
      farmRepository.createEntity.mockResolvedValue(mockFarm);

      await createUseCase.execute(mockCreateFarmDto);

      expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_creation_started', {
        producerId: mockCreateFarmDto.producer_id,
        farmName: mockCreateFarmDto.name,
      });
    });

    it('should log business event when farm is created successfully', async () => {
      farmRepository.createEntity.mockResolvedValue(mockFarm);

      await createUseCase.execute(mockCreateFarmDto);

      expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_created', {
        farmId: mockFarm.id,
        producerId: mockFarm.producer_id,
        farmName: mockFarm.name,
        totalArea: mockFarm.total_area,
      });
    });

    it('should call logger.logBusinessEvent twice (start and success)', async () => {
      farmRepository.createEntity.mockResolvedValue(mockFarm);

      await createUseCase.execute(mockCreateFarmDto);

      expect(logger.logBusinessEvent).toHaveBeenCalledTimes(2);
    });

    it('should create farm with correct area calculations', async () => {
      const farmWithAreas = {
        ...mockFarm,
        total_area: 1000,
        agricultural_area: 750,
        vegetation_area: 250,
      };
      farmRepository.createEntity.mockResolvedValue(farmWithAreas);

      const dtoWithAreas = {
        ...mockCreateFarmDto,
        total_area: 1000,
        agricultural_area: 750,
        vegetation_area: 250,
      };

      const result = await createUseCase.execute(dtoWithAreas);

      expect(result.total_area).toBe(1000);
      expect(result.agricultural_area).toBe(750);
      expect(result.vegetation_area).toBe(250);
      expect(result.agricultural_area + result.vegetation_area).toBeLessThanOrEqual(result.total_area);
    });

    it('should handle repository errors and log them', async () => {
      const repositoryError = new Error('Database connection failed');
      farmRepository.createEntity.mockRejectedValue(repositoryError);

      await expect(createUseCase.execute(mockCreateFarmDto)).rejects.toThrow('Database connection failed');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create farm',
        repositoryError.stack,
        {
          producerId: mockCreateFarmDto.producer_id,
        }
      );
    });

    it('should not log success event when repository fails', async () => {
      const repositoryError = new Error('Database error');
      farmRepository.createEntity.mockRejectedValue(repositoryError);

      try {
        await createUseCase.execute(mockCreateFarmDto);
      } catch (error) {
      }

      expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_creation_started', expect.any(Object));
      expect(logger.logBusinessEvent).not.toHaveBeenCalledWith('farm_created', expect.any(Object));
      expect(logger.logBusinessEvent).toHaveBeenCalledTimes(1);
    });

    it('should handle validation errors from repository', async () => {
      const validationError = new Error('Invalid producer_id');
      farmRepository.createEntity.mockRejectedValue(validationError);

      await expect(createUseCase.execute(mockCreateFarmDto)).rejects.toThrow('Invalid producer_id');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create farm',
        validationError.stack,
        {
          producerId: mockCreateFarmDto.producer_id,
        }
      );
    });

    it('should create farm with minimum required fields', async () => {
      const minimumFarmDto: CreateFarmDto = {
        name: 'Fazenda Mínima',
        producer_id: '550e8400-e29b-41d4-a716-446655440000',
        city: 'Campinas',
        state: 'SP',
        total_area: 100,
        agricultural_area: 80,
        vegetation_area: 20,
      };

      const minimumFarm = {
        ...mockFarm,
        ...minimumFarmDto,
        id: '550e8400-e29b-41d4-a716-446655440002',
      };

      farmRepository.createEntity.mockResolvedValue(minimumFarm);

      const result = await createUseCase.execute(minimumFarmDto);

      expect(farmRepository.createEntity).toHaveBeenCalledWith(minimumFarmDto);
      expect(result.name).toBe('Fazenda Mínima');
      expect(result.city).toBe('Campinas');
      expect(result.total_area).toBe(100);
    });

    it('should handle large farm areas correctly', async () => {
      const largeFarmDto: CreateFarmDto = {
        name: 'Fazenda Gigante',
        producer_id: '550e8400-e29b-41d4-a716-446655440000',
        city: 'Ribeirão Preto',
        state: 'SP',
        total_area: 50000.99,
        agricultural_area: 35000.50,
        vegetation_area: 15000.49,
      };

      const largeFarm = {
        ...mockFarm,
        ...largeFarmDto,
        id: '550e8400-e29b-41d4-a716-446655440003',
      };

      farmRepository.createEntity.mockResolvedValue(largeFarm);

      const result = await createUseCase.execute(largeFarmDto);

      expect(result.total_area).toBe(50000.99);
      expect(result.agricultural_area).toBe(35000.50);
      expect(result.vegetation_area).toBe(15000.49);
      
      expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_created', {
        farmId: largeFarm.id,
        producerId: largeFarm.producer_id,
        farmName: largeFarm.name,
        totalArea: largeFarm.total_area,
      });
    });
  });

  describe('error scenarios', () => {
    it('should preserve original error when rethrowing', async () => {
      const originalError = new Error('Original database error');
      originalError.name = 'DatabaseError';
      farmRepository.createEntity.mockRejectedValue(originalError);

      try {
        await createUseCase.execute(mockCreateFarmDto);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBe(originalError);
        expect(error.name).toBe('DatabaseError');
        expect(error.message).toBe('Original database error');
      }
    }); 
  });
});