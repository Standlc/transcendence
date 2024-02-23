import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UpdateUsersDto {
    @ApiProperty({required: false})
    @IsString()
    bio: string | null;

    @ApiProperty({required: false})
    @IsString()
    firstname: string | null;

    @ApiProperty({required: false})
    @IsString()
    lastname: string | null;
}