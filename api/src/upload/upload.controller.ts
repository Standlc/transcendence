import {
  Controller,
  ForbiddenException,
  HttpStatus,
  ParseFilePipeBuilder,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AppUser } from 'src/types/clientSchema';
import { ChannelWithoutPsw } from 'src/types/channelsSchema';
import * as sharp from 'sharp';
import { unlink } from 'fs/promises';
import { db } from 'src/database';
import { ChannelService } from 'src/channel/channel.service';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly channelsService: ChannelService,
  ) {}

  private static diskStorageAvatar = diskStorage({
    destination: './public/avatar',
    filename: (req, file, cb) => {
      const randomName = Date.now().toString();
      return cb(null, `${randomName}${extname(file.originalname)}`);
    },
  });

  private static diskStoragePhoto = diskStorage({
    destination: './public/channels',
    filename: (req, file, cb) => {
      const randomName = Date.now().toString();
      return cb(null, `${randomName}${extname(file.originalname)}`);
    },
  });

  private static filefilterMulter = function (req, file, callback) {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) callback(null, true);
    else callback(null, false);
  };

  private static limitsMulter = { fileSize: 10000000 }; //10mb

  //#region User avatar

  @ApiOperation({ summary: 'Upload an avatar' })
  @ApiCookieAuth()
  @ApiCreatedResponse({
    description: 'Avatar succesfully uploaded',
    schema: {
      type: 'object',
      example: {
        avatarUrl: null,
        bio: null,
        createdAt: '2024-02-16T14:28:58.410Z',
        email: null,
        firstname: 'john',
        id: 1,
        lastname: 'doe',
        rating: 18,
        username: 'joe',
        status: 1,
      },
    },
  })
  @ApiBody({
    description:
      "This is a multipart/form-data body, the name should be 'file' and the attachement an image binary",
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: UploadController.diskStorageAvatar,
      fileFilter: UploadController.filefilterMulter,
      limits: UploadController.limitsMulter,
    }),
  )
  @Post('user-avatar')
  async uploadUserAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AppUser> {
    if (!file) throw new UnprocessableEntityException('Invalid file format');
    try {
      const isAnimated = file.mimetype.match(/\/(gif)$/) ? true : false;
      await sharp(file.path, {
        animated: isAnimated,
      })
        .resize(400, 400, {
          fit: 'cover',
        })
        .webp()
        .toFile(file.path.replace(extname(file.filename), '.webp'))
        .then(() => {
          unlink(file.path);
          console.log('Resizing finished');
        });
    } catch (error) {
      await unlink(file.path);
      throw new UnprocessableEntityException(
        'File is not an image, nor a supported format',
      );
    }
    return await this.uploadService.setUserAvatar(
      req.user.id,
      `/api/users/${file.path.replace(extname(file.filename), '.webp')}`,
    );
  }

  //#endregion

  //#region Channel Photo

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: UploadController.diskStoragePhoto,
      fileFilter: UploadController.filefilterMulter,
      limits: UploadController.limitsMulter,
    }),
  )
  @Post('channel-photo')
  async uploadChannelPhoto(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Query('channelId', new ParseIntPipe()) channelId: number,
  ): Promise<string> {
    if (!file) throw new UnprocessableEntityException('Invalid file format');

    const isAllowed = this.channelsService.canUserUpdateChannel(
      req.user.id,
      channelId,
    );
    if (!isAllowed) {
      throw new ForbiddenException();
    }

    const replacedExtension = file.path.replace(
      extname(file.filename),
      '.webp',
    );

    try {
      const isAnimated = file.mimetype.match(/\/(gif)$/) ? true : false;
      await sharp(file.path, {
        animated: isAnimated,
      })
        .resize(400, 400, {
          fit: 'cover',
        })
        .webp()
        .toFile(replacedExtension)
        .then(() => {
          unlink(file.path);
        });
    } catch (error) {
      await unlink(file.path);
      throw new UnprocessableEntityException(
        'File is not an image, nor a supported format',
      );
    }
    return await this.uploadService.setChannelPhoto(
      req.user.id,
      channelId,
      `/api/channels/${replacedExtension}`,
    );
  }
}
