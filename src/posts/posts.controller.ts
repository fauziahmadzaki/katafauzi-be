import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createPostDto: CreatePostDto, @Request() req) {
    const userId = req.user.id;
    return this.postsService.create(createPostDto, userId);
  }

  @Get()
  @ResponseMessage('Data fetched successfully')
  findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        whitelist: true,
      }),
    )
    dto: PaginationDto,
  ) {
    return this.postsService.findAll(dto);
  }

  @Get(':slug')
  @ResponseMessage('Data fetched successfully')
  findOne(@Param('slug') slug: string) {
    return this.postsService.findOne(slug);
  }

  @Patch(':slug')
  @ResponseMessage('Post updated successfully')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('slug') slug: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req,
  ) {
    const userId = req.user.id;

    return this.postsService.update(slug, updatePostDto, userId);
  }

  @Delete(':slug')
  @ResponseMessage('Post deleted successfully')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('slug') slug: string, @Request() req) {
    const userId = req.user.id;
    return this.postsService.remove(slug, userId);
  }
}
