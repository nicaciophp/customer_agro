import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "../../../common/base/base.respository";
import { Producer } from "../entities/producer.entity";

@Injectable()
export class ProducersRepository extends BaseRepository<Producer> {
    constructor(
        @InjectRepository(Producer)
        producerRepository: Repository<Producer>
    ) {
        super(producerRepository);
    }

    async findWithFarms(id: string): Promise<Producer | null> {
        return this.findOne(id, { relations: ['farms'] });
    }
} 