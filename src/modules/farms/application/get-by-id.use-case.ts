import { Injectable, NotFoundException } from "@nestjs/common";
import { FarmRepository } from "../repositories/farm.repository";

@Injectable()
export class GetByIdUseCase {
    constructor(private readonly producersRepository: FarmRepository) {}
    async execute(id: string) {
        const producer = await this.producersRepository.findOne(id)
        if(!producer) throw new NotFoundException("Farm not found")
        return producer
    }
}