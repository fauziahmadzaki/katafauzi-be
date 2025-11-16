import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import slugify from 'slugify';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { handlePaginate } from 'src/common/utils/pagination.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, userId: number) {
    const { title, content, published } = createPostDto;

    const slug = slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    });

    try {
      return await this.prisma.post.create({
        data: {
          title: title,
          slug: slug,
          authorId: userId,
          published: published || false,
          content,
        },
      });
    } catch (error) {
      throw new BadRequestException('Failed to create post');
    }
  }

  async findAll(dto: PaginationDto) {
    const { skip, take } = handlePaginate(dto);
    const { search } = dto;

    const whereClause: Prisma.PostWhereInput = {
      published: true,
      deletedAt: null,
    };

    if (search) {
      whereClause.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where: whereClause,
        skip: skip,
        take: take,
        select: {
          id: true,
          slug: true,
          title: true,
          createdAt: true,

          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.post.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      data: posts,
      meta: {},
      totalItems: total,
      itemsPerPage: take,
      totalPages,
      search,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
