import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UpdateUsersDto {
    @ApiProperty({required: false})
    @IsString()
    bio?: string;

    @ApiProperty({required: false})
    @IsString()
    firstname?: string;

    @ApiProperty({required: false})
    @IsString()
    lastname?: string;
}