import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class DiscussionService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async create(data: Partial<Comment>) {
    const comment = this.commentRepository.create(data);
    return this.commentRepository.save(comment);
  }

  async findByProblem(problemId: number) {
    return this.commentRepository.find({
      where: { problemId },
      relations: ['replies'],
      order: { createdAt: 'DESC' },
    });
  }

  async findReplies(commentId: string) {
    return this.commentRepository.find({
      where: { parent: { id: commentId } },
      order: { createdAt: 'ASC' },
    });
  }

  async remove(id: string) {
    return this.commentRepository.delete(id);
  }
}
