import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class CreateFriendDto {
  @IsNumber()
  @ApiProperty()
  targetId: number;
}
