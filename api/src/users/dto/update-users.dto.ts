import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { z } from 'zod';

export const ZodUpdateUsersDto = z.object({
  bio: z.string().or(z.null()).optional(),
  firstname: z.string().or(z.null()).optional(),
  lastname: z.string().or(z.null()).optional(),
  username: z.string().max(50).optional(),
});

export class UpdateUsersDto {
  @ApiProperty({ required: false })
  @IsString()
  bio?: string;

  @ApiProperty({ required: false })
  @IsString()
  firstname?: string;

  @ApiProperty({ required: false })
  @IsString()
  lastname?: string;

  @ApiProperty({ required: false })
  @IsString()
  username?: string;
}
