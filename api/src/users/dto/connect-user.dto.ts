import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNumber } from "class-validator";

export class ConnectUsersDto {
  @ApiProperty({required: false})
  firstname: string | null;

  @ApiProperty({required: false})
  lastname: string | null;

  @ApiProperty()
  avatarUrl: string | null;

  @IsEmail()
  @ApiProperty({required: false})
  email: string | null;

  @IsNumber()
  @ApiProperty()
  id: number;
}
