import { Repository, DeepPartial, ObjectLiteral, FindManyOptions, FindOneOptions } from "typeorm";
import { Injectable } from "@nestjs/common";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

export interface FindOptions<T> {
  relations?: string[] | object;
  select?: (keyof T)[];
  where?: Partial<T>;
  order?: { [P in keyof T]?: 'ASC' | 'DESC' };
  take?: number;
  skip?: number;
}

@Injectable()
export class BaseRepository<T extends ObjectLiteral> {
  constructor(private readonly repository: Repository<T>) {}

  async createEntity(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findAll(options?: FindOptions<T>): Promise<T[]> {
    if (!options) {
      return this.repository.find();
    }

    const findOptions: FindManyOptions<T> = this.buildFindOptions(options);
    return this.repository.find(findOptions);
  }

  async findOne(id: string, options?: FindOptions<T>): Promise<T | null> {
    const findOptions: FindOneOptions<T> = {
      where: { id } as any,
      ...this.buildFindOptions(options)
    };

    return this.repository.findOne(findOptions);
  }

  async findOneWithRelations(id: string, relations: string[] = []): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as any,
      relations,
    });
  }

  async findOneBy(where: Partial<T>, options?: FindOptions<T>): Promise<T | null> {
    const findOptions: FindOneOptions<T> = {
      where: where as any,
      ...this.buildFindOptions(options)
    };

    return this.repository.findOne(findOptions);
  }

  async findBy(where: Partial<T>, options?: FindOptions<T>): Promise<T[]> {
    const findOptions: FindManyOptions<T> = {
      where: where as any,
      ...this.buildFindOptions(options)
    };

    return this.repository.find(findOptions);
  }

  async count(where?: Partial<T>): Promise<number> {
    if (where) {
      return this.repository.countBy(where as any);
    }
    return this.repository.count();
  }

  async exists(where: Partial<T>): Promise<boolean> {
    const count = await this.repository.countBy(where as any);
    return count > 0;
  }

  async updateEntity(id: string, data: QueryDeepPartialEntity<T>, returnWithRelations?: string[]): Promise<T | null> {
    await this.repository.update(id, data);
    
    if (returnWithRelations && returnWithRelations.length > 0) {
      return this.findOneWithRelations(id, returnWithRelations);
    }
    
    return this.findOne(id);
  }

  async deleteEntity(id: string) {
    const result = await this.repository.delete(id);
    return {
      affected: result.affected || 0,
      success: (result.affected || 0) > 0
    };
  }

  async softDeleteEntity(id: string) {
    const result = await this.repository.softDelete(id);
    return {
      affected: result.affected || 0,
      success: (result.affected || 0) > 0
    };
  }

  async restoreEntity(id: string) {
    const result = await this.repository.restore(id);
    return {
      affected: result.affected || 0,
      success: (result.affected || 0) > 0
    };
  }

  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    options?: FindOptions<T>
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const findOptions: FindManyOptions<T> = {
      ...this.buildFindOptions(options),
      take: limit,
      skip,
    };

    const [data, total] = await this.repository.findAndCount(findOptions);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  createQueryBuilder(alias: string) {
    return this.repository.createQueryBuilder(alias);
  }

  getRepository(): Repository<T> {
    return this.repository;
  }

  private buildFindOptions(options?: FindOptions<T>): FindOneOptions<T> | FindManyOptions<T> {
    if (!options) return {};

    const findOptions: any = {};

    if (options.relations) {
      findOptions.relations = options.relations;
    }

    if (options.select) {
      findOptions.select = options.select;
    }

    if (options.where) {
      findOptions.where = options.where;
    }

    if (options.order) {
      findOptions.order = options.order;
    }

    if (options.take) {
      findOptions.take = options.take;
    }

    if (options.skip) {
      findOptions.skip = options.skip;
    }

    return findOptions;
  }
}