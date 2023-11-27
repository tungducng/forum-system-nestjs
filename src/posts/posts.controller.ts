import { RequestWithUser } from './../auth/requestWithUser.interface';
import { FindOneParams } from './../utils/findOneParams';
import { PaginationParams } from './../utils/types/paginationParams';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';
import { JwtAuthenticationGuard } from 'src/auth/jwt-authentication.guard';

@Controller('posts')
@UseInterceptors(ClassSerializerInterceptor)
export class PostsController {
  constructor(private postsService: PostsService) {}

  // @Get()
  // getAllPosts(@Query('search') search: string) {
  //   if (search) {
  //     return this.postsService.searchForPosts(search);
  //   }
  //   return this.postsService.getAllPosts();
  // }

  @Get()
  async getPosts(
    @Query('search') search: string,
    @Query() { offset, limit, startId }: PaginationParams,
  ) {
    if (search) {
      return this.postsService.searchForPosts(search, offset, limit, startId);
    }
    return this.postsService.getAllPosts(offset, limit, startId);
  }

  @Get(':id')
  getPostById(@Param() { id }: FindOneParams) {
    return this.postsService.getPostById(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthenticationGuard)
  async createPost(@Body() post: CreatePostDto, @Req() req: RequestWithUser) {
    return this.postsService.createPost(post, req.user);
  }

  @Put(':id')
  async replacePost(@Param('id') id: string, @Body() post: UpdatePostDto) {
    return this.postsService.updatePost(Number(id), post);
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    return this.postsService.deletePost(Number(id));
  }
}
