import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ProducersController } from './producers.controller';
import { CreateUseCase } from '../application/create.use-case';
import { GetByIdUseCase } from '../application/get-by-id.use-case';
import { UpdateUseCase } from '../application/update.use-case';
import { DeleteUseCase } from '../application/delete.use-case';
import { CreateProducerDto } from '../dto/create-producer.dto';
import { UpdateProducerDto } from '../dto/update-producer.dto';
import { Producer } from '../entities/producer.entity';
import { NotFoundException } from '@nestjs/common';

describe('ProducersController (Integration)', () => {
    let app: INestApplication;
    let createUseCase: jest.Mocked<CreateUseCase>;
    let getByIdUseCase: jest.Mocked<GetByIdUseCase>;
    let updateUseCase: jest.Mocked<UpdateUseCase>;
    let deleteUseCase: jest.Mocked<DeleteUseCase>;

    const mockProducer: Producer = {
        id: 'producer-1',
        name: 'João Silva',
        document: '12345678901',
        document_type: 'pf',
        farms: [],
    };

    const mockUpdatedProducer: Producer = {
        ...mockProducer,
        name: 'João Silva Santos',
    };

    beforeAll(async () => {
        const mockCreateUseCase = {
            execute: jest.fn(),
        };

        const mockGetByIdUseCase = {
            execute: jest.fn(),
        };

        const mockUpdateUseCase = {
            execute: jest.fn(),
        };

        const mockDeleteUseCase = {
            execute: jest.fn(),
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [ProducersController],
            providers: [
                { provide: CreateUseCase, useValue: mockCreateUseCase },
                { provide: GetByIdUseCase, useValue: mockGetByIdUseCase },
                { provide: UpdateUseCase, useValue: mockUpdateUseCase },
                { provide: DeleteUseCase, useValue: mockDeleteUseCase },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        createUseCase = moduleFixture.get(CreateUseCase);
        getByIdUseCase = moduleFixture.get(GetByIdUseCase);
        updateUseCase = moduleFixture.get(UpdateUseCase);
        deleteUseCase = moduleFixture.get(DeleteUseCase);
    });

    afterAll(async () => {
        await app.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /producers', () => {
        it('should create a producer successfully', async () => {
            const createDto: CreateProducerDto = {
                name: 'João Silva',
                document: '12345678901',
                document_type: "pf"
            };
            createUseCase.execute.mockResolvedValue(mockProducer);

            const response = await request(app.getHttpServer())
                .post('/producers')
                .send(createDto)
                .expect(201);

            expect(response.body).toEqual(mockProducer);
            expect(createUseCase.execute).toHaveBeenCalledWith(createDto);
        });

        it('should handle use case errors', async () => {
            const createDto: CreateProducerDto = {
                name: 'João Silva',
                document: '12345678901',
                document_type: "pf"
            };
            createUseCase.execute.mockRejectedValue(new Error('Database error'));

            await request(app.getHttpServer())
                .post('/producers')
                .send(createDto)
                .expect(500);

            expect(createUseCase.execute).toHaveBeenCalledWith(createDto);
        });
    });

    describe('GET /producers/:id', () => {
        it('should return producer when found', async () => {
            const producerId = 'producer-1';
            getByIdUseCase.execute.mockResolvedValue(mockProducer);

            const response = await request(app.getHttpServer())
                .get(`/producers/${producerId}`)
                .expect(200);

            expect(response.body).toEqual(mockProducer);
            expect(getByIdUseCase.execute).toHaveBeenCalledWith(producerId);
        });

        it('should return 404 when producer not found', async () => {
            const producerId = 'non-existent-id';
            getByIdUseCase.execute.mockRejectedValue(new NotFoundException('Producer not found'));

            await request(app.getHttpServer())
                .get(`/producers/${producerId}`)
                .expect(404);

            expect(getByIdUseCase.execute).toHaveBeenCalledWith(producerId);
        });
    });

    describe('PATCH /producers/:id', () => {
        it('should update producer successfully', async () => {
            const producerId = 'producer-1';
            const updateDto: UpdateProducerDto = {
                name: 'João Silva Santos',
            };
            updateUseCase.execute.mockResolvedValue(mockUpdatedProducer);

            const response = await request(app.getHttpServer())
                .patch(`/producers/${producerId}`)
                .send(updateDto)
                .expect(200);

            expect(response.body).toEqual(mockUpdatedProducer);
            expect(updateUseCase.execute).toHaveBeenCalledWith(producerId, updateDto);
        });

        it('should handle empty update body', async () => {
            const producerId = 'producer-1';
            const emptyUpdateDto = {};
            updateUseCase.execute.mockResolvedValue(mockProducer);

            const response = await request(app.getHttpServer())
                .patch(`/producers/${producerId}`)
                .send(emptyUpdateDto)
                .expect(200);

            expect(response.body).toEqual(mockProducer);
            expect(updateUseCase.execute).toHaveBeenCalledWith(producerId, emptyUpdateDto);
        });

        it('should handle update errors', async () => {
            const producerId = 'producer-1';
            const updateDto: UpdateProducerDto = {
                name: 'João Silva Santos',
            };
            updateUseCase.execute.mockRejectedValue(new Error('Update failed'));

            await request(app.getHttpServer())
                .patch(`/producers/${producerId}`)
                .send(updateDto)
                .expect(500);

            expect(updateUseCase.execute).toHaveBeenCalledWith(producerId, updateDto);
        });
    });

    describe('DELETE /producers/:id', () => {
        it('should delete producer successfully', async () => {
            const producerId = 'producer-1';
            const deleteResult = { success: true, message: "success", deletedEntities: { producer: 1, farms: 1, plantedCrops: 1, totalEntities: 1, farmIds: [], totalFarmArea: 123 }, duration: 123 };
            deleteUseCase.execute.mockResolvedValue(deleteResult);

            const response = await request(app.getHttpServer())
                .delete(`/producers/${producerId}`)
                .expect(200);

            expect(response.body).toEqual(deleteResult);
            expect(deleteUseCase.execute).toHaveBeenCalledWith(producerId);
        });

        it('should handle delete errors', async () => {
            const producerId = 'producer-1';
            deleteUseCase.execute.mockRejectedValue(new Error('Delete failed'));

            await request(app.getHttpServer())
                .delete(`/producers/${producerId}`)
                .expect(500);

            expect(deleteUseCase.execute).toHaveBeenCalledWith(producerId);
        });

        it('should handle producer not found for deletion', async () => {
            const producerId = 'non-existent-id';
            deleteUseCase.execute.mockRejectedValue(new NotFoundException('Producer not found'));

            await request(app.getHttpServer())
                .delete(`/producers/${producerId}`)
                .expect(404);

            expect(deleteUseCase.execute).toHaveBeenCalledWith(producerId);
        });
    });

    describe('HTTP methods and Routes', () => {
        it('should not alow GET on /producers (without ID)', async () => {
            await request(app.getHttpServer())
                .get('/producers')
                .expect(404);
        });

        it('should not allow PUT method', async () => {
            await request(app.getHttpServer())
                .put('/producers/producer-1')
                .send({ name: 'Test' })
                .expect(404);
        });

        it('should handle invalid UUID format gracefully', async () => {
            const invalidId = 'invalid-uuid';
            getByIdUseCase.execute.mockResolvedValue(mockProducer);

            const response = await request(app.getHttpServer())
                .get(`/producers/${invalidId}`)
                .expect(200);

            expect(getByIdUseCase.execute).toHaveBeenCalledWith(invalidId);
        });
    });
});