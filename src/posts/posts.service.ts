import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './post.entity';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PostNotFoundException } from './exceptions/postNotFound.exception';
import { User } from 'src/users/user.entity';
import { PostsSearchService } from './postsSearch.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private postsSearchService: PostsSearchService,
  ) {}

  async getAllPosts() {
    const [list, count] = await this.postsRepository.findAndCount();
    return {
      count,
      list,
    };
  }

  async getPostById(id: number): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: {
        id,
      },
      relations: {
        author: true,
      },
    });
    if (post) {
      return post;
    }
    throw new PostNotFoundException(id);
  }

  async createPost(post: CreatePostDto, user: User) {
    const newPost = await this.postsRepository.create({
      ...post,
      author: user,
    });
    const savedPost = await this.postsRepository.save(newPost);
    await this.postsSearchService.indexPost(savedPost);
    return savedPost;
  }

  async updatePost(id: number, post: UpdatePostDto): Promise<Post> {
    await this.postsRepository.update(id, post);
    const updatedPost = await this.postsRepository.findOne({
      where: {
        id,
      },
      relations: {
        author: true,
      },
    });
    if (updatedPost) {
      await this.postsSearchService.update(updatedPost);
      return updatedPost;
    }
    throw new PostNotFoundException(id);
  }

  async deletePost(id: number) {
    const deleteResponse = await this.postsRepository.delete(id);
    if (!deleteResponse.affected) {
      throw new PostNotFoundException(id);
    }
    await this.postsSearchService.remove(id);
  }

  async searchForPosts(text: string) {
    const results = await this.postsSearchService.search(text);
    const ids = results.map((result) => result.id);
    if (!ids.length) {
      return [];
    }
    const [list, count] = await this.postsRepository.findAndCount({
      where: { id: In(ids) },
    });
    return {
      count,
      list,
    };
  }
}
