import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const ZodCreateUsersDto = z.object({
  username: z.string().max(50),
  password: z.string(),
  firstname: z.string().or(z.null()).optional(),
  lastname: z.string().or(z.null()).optional(),
});

export class CreateUsersDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  password: string;

  @ApiProperty({ required: false })
  firstname: string | null;

  @ApiProperty({ required: false })
  lastname: string | null;
}
