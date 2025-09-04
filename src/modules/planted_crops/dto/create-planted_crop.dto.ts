import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID, Length } from "class-validator";

export class CreatePlantedCropDto {
    @ApiProperty({ example: 'Feijão', description: 'Nome da cultura plantada' })
    @IsString()
    @Length(1, 100)
    name: string

    @ApiProperty({ example: 'c9105338-bc6b-4f6b-a384-fccea3a91100', description: 'Id interno da propriedade' })
    @IsUUID()
    farm_id: string
}
