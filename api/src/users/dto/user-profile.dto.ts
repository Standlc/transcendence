import { ApiProperty } from "@nestjs/swagger";
import { Generated } from "kysely";

export class UserProfileDto {
  @ApiProperty()
	username: string;

	@ApiProperty()
	avatarUrl: string | null;

	@ApiProperty({required: false})
	bio?: string | null;
}
