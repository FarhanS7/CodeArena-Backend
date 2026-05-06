import { Inject, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import * as cookie from 'cookie';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnModuleInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('RealtimeGateway');

  constructor(
    @Inject('REDIS_SUBSCRIBER')
    private readonly redisSubscriber: Redis,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Realtime Gateway Initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token. Disconnecting.`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;
      this.logger.log(`Client ${client.id} authenticated as user ${payload.sub || payload.id}`);
      
      // Automatically join user-specific room upon successful authentication
      const userId = payload.sub || payload.id;
      client.join(`user_${userId}`);
      this.logger.log(`Client ${client.id} automatically joined room: user_${userId}`);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  onModuleInit() {
    this.redisSubscriber.subscribe('submission-verdicts');
    this.redisSubscriber.subscribe('notifications');

    this.redisSubscriber.on('message', (channel, message) => {
      const data = JSON.parse(message);
      
      if (channel === 'submission-verdicts') {
        this.logger.log(`Received submission update for user ${data.userId}`);
        this.server.to(`user_${data.userId}`).emit('submission-update', data);
      } else if (channel === 'notifications') {
        this.logger.log(`Received notification for user ${data.userId}`);
        this.server.to(`user_${data.userId}`).emit('notification', data.notification);
      }
    });
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket) {
    const user = client.data.user;
    if (!user) {
      this.logger.warn(`Unauthorized join-room attempt by client ${client.id}`);
      return { event: 'error', data: 'Unauthorized' };
    }
    
    const userId = user.sub || user.id;
    this.logger.log(`Client ${client.id} (User ${userId}) explicitly joining room: user_${userId}`);
    client.join(`user_${userId}`);
    return { event: 'joined', data: userId };
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket) {
    const user = client.data.user;
    if (!user) return;
    
    const userId = user.sub || user.id;
    this.logger.log(`Client ${client.id} (User ${userId}) leaving room: user_${userId}`);
    client.leave(`user_${userId}`);
    return { event: 'left', data: userId };
  }

  private extractToken(client: Socket): string | null {
    // 1. Check auth object (standard Socket.io way)
    if (client.handshake.auth && client.handshake.auth.token) {
      return client.handshake.auth.token;
    }

    // 2. Check cookies
    const cookieHeader = client.handshake.headers.cookie;
    if (cookieHeader) {
      const cookies = cookie.parse(cookieHeader);
      if (cookies.token) return cookies.token;
    }

    // 3. Check Authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    // 4. Check query string (fallback)
    const token = client.handshake.query.token;
    if (typeof token === 'string') {
      return token;
    }

    return null;
  }
}
