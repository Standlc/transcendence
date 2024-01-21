import { ApiProperty } from "@nestjs/swagger";

export class ConnectUsersDto {
  @ApiProperty({required: false})
  firstname: string | null;

  @ApiProperty({required: false})
  lastname: string | null;

  @ApiProperty()
  avatarUrl: string | null;

  @ApiProperty({required: false})
  email: string | null;

  @ApiProperty()
  id: number;
}
