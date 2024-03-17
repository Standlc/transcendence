import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UpdateUsersDto {
    @ApiProperty({required: false})
    @IsString()
    bio?: string;

    @ApiProperty({required: false})
    @IsString()
    username?: string;
}
