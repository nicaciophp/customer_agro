import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUseCase } from './delete.use-case';
import { FarmRepository } from '../repositories/farm.repository';
import { CustomLoggerService } from '../../../common/logger/custom-logger.service';
import { Farm } from '../entites/farm.entity';

describe('DeleteUseCase (Farm)', () => {
    let deleteUseCase: DeleteUseCase;
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

    const mockSuccessResult = {
        affected: 1,   
        success: true,
    };

    const mockFailureResult = { affected: 1, success: true, }

    beforeEach(async () => {
        const mockFarmRepository = {
            findOne: jest.fn(),
            deleteEntity: jest.fn(),
            find: jest.fn(),
            createEntity: jest.fn(),
            update: jest.fn(),
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
                DeleteUseCase,
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

        deleteUseCase = module.get<DeleteUseCase>(DeleteUseCase);
        farmRepository = module.get(FarmRepository);
        logger = module.get(CustomLoggerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('execute', () => {
        it('should delete a farm successfully', async () => {
            const farmId = '550e8400-e29b-41d4-a716-446655440001';
            farmRepository.findOne.mockResolvedValue(mockFarm);
            farmRepository.deleteEntity.mockResolvedValue(mockSuccessResult);

            const result = await deleteUseCase.execute(farmId);

            expect(farmRepository.findOne).toHaveBeenCalledWith(farmId);
            expect(farmRepository.deleteEntity).toHaveBeenCalledWith(farmId);
            expect(result).toEqual(mockSuccessResult);
            expect(result.success).toBe(true);
        });

        it('should log business event when deletion starts', async () => {
            const farmId = '550e8400-e29b-41d4-a716-446655440001';
            farmRepository.findOne.mockResolvedValue(mockFarm);
            farmRepository.deleteEntity.mockResolvedValue(mockSuccessResult);

            await deleteUseCase.execute(farmId);

            expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_deletion_started', {
                farmId: farmId,
                farmName: mockFarm.name,
            });
        });

        it('should log business event when deletion succeeds', async () => {
            const farmId = '550e8400-e29b-41d4-a716-446655440001';
            farmRepository.findOne.mockResolvedValue(mockFarm);
            farmRepository.deleteEntity.mockResolvedValue(mockSuccessResult);

            await deleteUseCase.execute(farmId);

            expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_deleted', {
                farmId: farmId,
                farmName: mockFarm.name,
            });
        });

        it('should call logger.logBusinessEvent twice when deletion succeeds', async () => {
            const farmId = '550e8400-e29b-41d4-a716-446655440001';
            farmRepository.findOne.mockResolvedValue(mockFarm);
            farmRepository.deleteEntity.mockResolvedValue(mockSuccessResult);

            await deleteUseCase.execute(farmId);

            expect(logger.logBusinessEvent).toHaveBeenCalledTimes(2);
        });

        it('should log deletion start even when farm not found', async () => {
            const farmId = 'non-existent-farm-id';
            farmRepository.findOne.mockResolvedValue(null);
            farmRepository.deleteEntity.mockResolvedValue(mockFailureResult);

            await deleteUseCase.execute(farmId);

            expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_deletion_started', {
                farmId: farmId,
                farmName: undefined,
            });
        });

        it('should handle repository errors during findOne', async () => {
            const farmId = '550e8400-e29b-41d4-a716-446655440001';
            const findError = new Error('Database connection failed during find');
            farmRepository.findOne.mockRejectedValue(findError);

            await expect(deleteUseCase.execute(farmId)).rejects.toThrow('Database connection failed during find');
            expect(farmRepository.findOne).toHaveBeenCalledWith(farmId);
            expect(farmRepository.deleteEntity).not.toHaveBeenCalled();
            expect(logger.logBusinessEvent).not.toHaveBeenCalled();
        });

        it('should handle repository errors during deleteEntity', async () => {
            const farmId = '550e8400-e29b-41d4-a716-446655440001';
            const deleteError = new Error('Database connection failed during delete');
            farmRepository.findOne.mockResolvedValue(mockFarm);
            farmRepository.deleteEntity.mockRejectedValue(deleteError);

            await expect(deleteUseCase.execute(farmId)).rejects.toThrow('Database connection failed during delete');
            expect(farmRepository.findOne).toHaveBeenCalledWith(farmId);
            expect(farmRepository.deleteEntity).toHaveBeenCalledWith(farmId);
            expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_deletion_started', expect.any(Object));
            expect(logger.logBusinessEvent).not.toHaveBeenCalledWith('farm_deleted', expect.any(Object));
        });

        it('should handle farm with special characters in name', async () => {
            const farmId = '550e8400-e29b-41d4-a716-446655440001';
            const farmWithSpecialName = {
                ...mockFarm,
                name: 'Fazenda São João & Cia Ltda.',
            };
            farmRepository.findOne.mockResolvedValue(farmWithSpecialName);
            farmRepository.deleteEntity.mockResolvedValue(mockSuccessResult);

            await deleteUseCase.execute(farmId);

            expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_deletion_started', {
                farmId: farmId,
                farmName: 'Fazenda São João & Cia Ltda.',
            });
            expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_deleted', {
                farmId: farmId,
                farmName: 'Fazenda São João & Cia Ltda.',
            });
        });

        it('should handle farm with very long name', async () => {
            const farmId = '550e8400-e29b-41d4-a716-446655440001';
            const farmWithLongName = {
                ...mockFarm,
                name: 'Fazenda Agrícola de Produção Sustentável e Desenvolvimento Rural Integrado do Vale do Paraíba e Região Metropolitana de São Paulo',
            };
            farmRepository.findOne.mockResolvedValue(farmWithLongName);
            farmRepository.deleteEntity.mockResolvedValue(mockSuccessResult);

            await deleteUseCase.execute(farmId);

            expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_deletion_started', {
                farmId: farmId,
                farmName: farmWithLongName.name,
            });
            expect(logger.logBusinessEvent).toHaveBeenCalledWith('farm_deleted', {
                farmId: farmId,
                farmName: farmWithLongName.name,
            });
        });
    });

    describe('business logic edge cases', () => {
        it('should preserve original deletion result structure', async () => {
            const farmId = '550e8400-e29b-41d4-a716-446655440001';
            const customResult = {
                affected: 1,
                success: true,
            }

            farmRepository.findOne.mockResolvedValue(mockFarm);
            farmRepository.deleteEntity.mockResolvedValue(customResult);

            const result = await deleteUseCase.execute(farmId);

            expect(result).toEqual(customResult);
        });
    });
});