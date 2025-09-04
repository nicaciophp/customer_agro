import { ApiProperty } from "@nestjs/swagger";
import { 
  IsNumber, 
  IsOptional, 
  IsString, 
  IsUUID, 
  Length,
  Min,
  Validate 
} from "class-validator";
import { IsAreaValid } from "src/common/decorators/area-validation.decorator";
import { AreaValidator } from "src/common/validators/area.validator";

export class CreateFarmDto {
  @ApiProperty({ example: 'Fazenda São João', description: 'Nome da propriedade' })
  @IsString()
  @Length(3, 150)
  name: string;

  @ApiProperty({ example: 'c9105338-bc6b-4f6b-a384-fccea3a91100', description: 'Id interno do produtor' })
  @IsUUID()
  producer_id: string;

  @ApiProperty({ example: 'São Paulo', description: 'Cidade da propriedade' })
  @IsString()
  @Length(1, 100)
  city: string;

  @ApiProperty({ example: 'São Paulo', description: 'Estado da propriedade' })
  @IsString()
  @Length(3, 50)
  state: string;

  @ApiProperty({ example: 1000, description: 'Área total da propriedade em hectares' })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'A área total deve ser um valor positivo' })
  total_area: number;

  @ApiProperty({ example: 600, description: 'Área agricultável em hectares' })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'A área agricultável deve ser um valor positivo' })
  @IsAreaValid({
    message: 'A soma da área agricultável e área de vegetação não pode ultrapassar a área total'
  })
  agricultural_area: number;

  @ApiProperty({ example: 300, description: 'Área de vegetação em hectares' })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'A área de vegetação deve ser um valor positivo' })
  @Validate(AreaValidator, {
    message: 'Erro na validação das áreas da propriedade'
  })
  vegetation_area: number;
}