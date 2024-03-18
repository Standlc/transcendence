import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    console.log(metadata);
    console.log('CHECKING TYPE');
    const result = this.schema.safeParse(value);
    if (!result.success) {
      console.log('THROWING BAD REQUEST');
      throw new BadRequestException(result.error.format());
    }
    return result.data;
  }
}
