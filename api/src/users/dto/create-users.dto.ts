import { ApiProperty } from "@nestjs/swagger";
import { IsAscii, IsStrongPassword } from "class-validator";

export class CreateUsersDto {
	@ApiProperty()
	@IsAscii()
	username: string;

	@ApiProperty()
	@IsStrongPassword()
	password: string;

	@ApiProperty({required: false})
	firstname: string | null;

	@ApiProperty({required: false})
	lastname: string | null;
}
