import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, Length } from "class-validator";
import { IsDocument } from "../../../common/decorators/is-document.decorato";

export class CreateProducerDto {
    @ApiProperty({ example: 'Jhon Doe', description: 'Nome do produtor' })
    @IsString()
    @Length(1, 150)
    name: string;

    @ApiProperty({ example: '000.000.000-00', description: 'Documento do produtor CPF/CNPJ' })
    @IsDocument({
        message: 'Documento deve ser um CPF ou CNPJ válido'
    })
    @IsString()
    @Length(1, 150)
    document: string;

    @ApiProperty({ example: 'pf', description: 'Tipo de documento pf/pj' })
    @IsOptional()
    @Length(1, 2)
    document_type: string;
}
