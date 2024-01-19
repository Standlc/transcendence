import { ApiProperty } from "@nestjs/swagger";

export class UserList {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  avatarUrl: string | null;
}
