import { ApiProperty } from "@nestjs/swagger";

export class CreateUsersDto {
	@ApiProperty()
	username: string;

	@ApiProperty()
	password: string;

	@ApiProperty({required: false})
	firstname: string | null;

	@ApiProperty({required: false})
	lastname: string | null;
}
