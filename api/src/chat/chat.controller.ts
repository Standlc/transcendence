import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class UserController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':id/messages/:channelId')
  getMessages(
    @Param('id') userId: number,
    @Param('channelId') channelId: number,
  ): void {
    this.chatService.addChannel(channelId);
    this.chatService.addClient(channelId, userId);
  }

  @Get(':id')
  getChat(@Param('id') id: number): string {
    this.chatService.setStoredId(id);
    console.log('GET: Recieved id:', this.chatService.getStoredId());
    return 'This is the chat endpoint';
  }
}
