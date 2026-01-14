import { Inject, Logger, OnModuleInit } from '@nestjs/common';
import {
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayInit, OnModuleInit {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('RealtimeGateway');

  constructor(
    @Inject('REDIS_SUBSCRIBER')
    private readonly redisSubscriber: Redis,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Realtime Gateway Initialized');
  }

  onModuleInit() {
    this.redisSubscriber.subscribe('submission-verdicts');
    this.redisSubscriber.on('message', (channel, message) => {
      if (channel === 'submission-verdicts') {
        const data = JSON.parse(message);
        this.logger.log(`Received message for user ${data.userId}: ${data.status}`);
        this.server.to(`user_${data.userId}`).emit('submission-update', data);
      }
    });
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, userId: string) {
    this.logger.log(`Client ${client.id} joining room: user_${userId}`);
    client.join(`user_${userId}`);
    return { event: 'joined', data: userId };
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, userId: string) {
    this.logger.log(`Client ${client.id} leaving room: user_${userId}`);
    client.leave(`user_${userId}`);
    return { event: 'left', data: userId };
  }
}
