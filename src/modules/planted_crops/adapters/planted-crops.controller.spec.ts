import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from "@nestjs/common";
import * as request from 'supertest';
import { PlantedCropsController } from './planted-crops.controller';
import { CreateUseCase } from '../application/create.use-case';
import { GetByIdUseCase } from "../application/get-by-id.use-case";
import { UpdateUseCase } from '../application/update.use-case';
import { DeleteUseCase } from "../application/delete.use-case";
import { CreatePlantedCropDto } from '../dto/create-planted_crop.dto';
import { UpdatePlantedCropDto } from "../dto/update-planted_crop.dto";
import { NotFoundException } from "@nestjs/common";
import { PlantedCrop } from '../entities/planted-crops.entity';

describe('PlantedCropsController (integraion)', () => {
    let app: INestApplication;
    let createUseCase: jest.Mocked<CreateUseCase>;
    let getByIdUseCase: jest.Mocked<GetByIdUseCase>;
    let updateUseCase: jest.Mocked<UpdateUseCase>;
    let deleteUseCase: jest.Mocked<DeleteUseCase>;

    const mockPlantedCrop: PlantedCrop = {
        id: "crop-1",
        name: 'Soja',
        farm_id: "farm-1",
        farm: null as any,
    };

    const mockUpdatedCrop: PlantedCrop = {
        ...mockPlantedCrop,
        name: "Milho",
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
            controllers: [PlantedCropsController],
            providers: [
                { provide: CreateUseCase, useValue: mockCreateUseCase },
                { provide: GetByIdUseCase, useValue: mockGetByIdUseCase },
                { provide: UpdateUseCase, useValue: mockUpdateUseCase },
                { provide: DeleteUseCase, useValue: mockDeleteUseCase },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        createUseCase = moduleFixture.get(CreateUseCase)
        getByIdUseCase = moduleFixture.get(GetByIdUseCase);
        updateUseCase = moduleFixture.get(UpdateUseCase)
        deleteUseCase = moduleFixture.get(DeleteUseCase);
    });

    afterAll(async () => {
        await app.close()
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    describe("POST /planted-crops", () => {
        it('should create a planted crop sucessfuly', async () => {
            const createDto: CreatePlantedCropDto = {
                name: "Soja",
                farm_id: 'farm-1',
            };
            createUseCase.execute.mockResolvedValue(mockPlantedCrop);

            const response = await request(app.getHttpServer())
                .post("/planted-crops")
                .send(createDto)
                .expect(201);

            expect(response.body).toEqual(mockPlantedCrop)
            expect(createUseCase.execute).toHaveBeenCalledWith(createDto);
        })

        it('should handle usecase errors', async () => {
            const createDto: CreatePlantedCropDto = {
                name: "Soja",
                farm_id: 'farm-1',
            };
            createUseCase.execute.mockRejectedValue(new Error('Database error'))

            await request(app.getHttpServer())
                .post('/planted-crops')
                .send(createDto)
                .expect(500)

            expect(createUseCase.execute).toHaveBeenCalledWith(createDto);
        });
    });

    describe('GET /planted-crops/:id', () => {
        it("should return planted crop when found", async () => {
            const cropId = 'crop-1';
            getByIdUseCase.execute.mockResolvedValue(mockPlantedCrop);

            const response = await request(app.getHttpServer())
                .get(`/planted-crops/${cropId}`)
                .expect(200);

            expect(response.body).toEqual(mockPlantedCrop);
            expect(getByIdUseCase.execute).toHaveBeenCalledWith(cropId)
        });

        it('should return 404 when crop not find', async () => {
            const cropId = "non-existent-id";
            getByIdUseCase.execute.mockRejectedValue(new NotFoundException('Planted Crop not found'))

            await request(app.getHttpServer())
                .get(`/planted-crops/${cropId}`)
                .expect(404)

            expect(getByIdUseCase.execute).toHaveBeenCalledWith(cropId)
        });
    });

    describe("PATCH /planted-crops/:id", () => {
        it('should update planted crop sucessfully', async () => {
            const cropId = "crop-1";
            const updateDto: UpdatePlantedCropDto = {
                name: 'Milho',
            };
            updateUseCase.execute.mockResolvedValue(mockUpdatedCrop);

            const response = await request(app.getHttpServer())
                .patch(`/planted-crops/${cropId}`)
                .send(updateDto)
                .expect(200);

            expect(response.body).toEqual(mockUpdatedCrop)
            expect(updateUseCase.execute).toHaveBeenCalledWith(cropId, updateDto);
        });

        it("should handle emty update body", async () => {
            const cropId = 'crop-1';
            const emptyUpdateDto = {};
            updateUseCase.execute.mockResolvedValue(mockPlantedCrop);

            const response = await request(app.getHttpServer())
                .patch(`/planted-crops/${cropId}`)
                .send(emptyUpdateDto)
                .expect(200);

            expect(response.body).toEqual(mockPlantedCrop);
            expect(updateUseCase.execute).toHaveBeenCalledWith(cropId, emptyUpdateDto);
        });

        it('should handle update erors', async () => {
            const cropId = "crop-1";
            const updateDto: UpdatePlantedCropDto = {
                name: 'Milho',
            };
            updateUseCase.execute.mockRejectedValue(new Error("Update failed"));

            await request(app.getHttpServer())
                .patch(`/planted-crops/${cropId}`)
                .send(updateDto)
                .expect(500);

            expect(updateUseCase.execute).toHaveBeenCalledWith(cropId, updateDto);
        });
    });

    describe('DELETE /planted-crops/:id', () => {
        it("should delete planted crop sucessfuly", async () => {
            const cropId = 'crop-1';
            const deleteResult = {
                affected: 1,
                success: true,
            };
            deleteUseCase.execute.mockResolvedValue(deleteResult);

            const response = await request(app.getHttpServer())
                .delete(`/planted-crops/${cropId}`)
                .expect(200)

            expect(response.body).toEqual(deleteResult)
            expect(deleteUseCase.execute).toHaveBeenCalledWith(cropId)
        });

        it('should handle delete erros', async () => {
            const cropId = "crop-1";
            deleteUseCase.execute.mockRejectedValue(new Error('Delete failed'))

            await request(app.getHttpServer())
                .delete(`/planted-crops/${cropId}`)
                .expect(500);

            expect(deleteUseCase.execute).toHaveBeenCalledWith(cropId);
        });

        it("should handle crop not found for deletion", async () => {
            const cropId = 'non-existent-id';
            deleteUseCase.execute.mockRejectedValue(new NotFoundException("Planted Crop not found"));

            await request(app.getHttpServer())
                .delete(`/planted-crops/${cropId}`)
                .expect(404);

            expect(deleteUseCase.execute).toHaveBeenCalledWith(cropId);
        });
    });

    describe('HTTP metods and Routes', () => {
        it("should not alow GET on /planted-crops (without ID)", async () => {
            await request(app.getHttpServer())
                .get('/planted-crops')
                .expect(404)
        });

        it('should not alow PUT method', async () => {
            await request(app.getHttpServer())
                .put("/planted-crops/crop-1")
                .send({ name: 'Test' })
                .expect(404);
        });

        it("should handle invalid UUID format gracefuly", async () => {
            const invalidId = 'invalid-uuid';
            getByIdUseCase.execute.mockResolvedValue(mockPlantedCrop);

            await request(app.getHttpServer())
                .get(`/planted-crops/${invalidId}`)
                .expect(200);

            expect(getByIdUseCase.execute).toHaveBeenCalledWith(invalidId);
        })
    })
});