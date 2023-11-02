import { NotFoundException } from '@nestjs/common';

export class CategoryNotFoundException extends NotFoundException {
  constructor(postId: number) {
    super(`Category with id ${postId} not found`);
  }
}
