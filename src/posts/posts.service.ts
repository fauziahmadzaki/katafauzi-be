import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
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
      items: posts,
      meta: {
        totalItems: total,
        itemsPerPage: take,
        totalPages,
        search,
      },
    };
  }

  async findOne(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug: slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    return post;
  }

  async update(slug: string, updatePostDto: UpdatePostDto, userId: number) {
    const post = await this.prisma.post.findUnique({
      where: { slug: slug },
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    try {
      return await this.prisma.post.update({
        where: { slug: slug },
        data: { ...updatePostDto, authorId: userId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Post with those slug already exists');
        }
      }
      throw new BadRequestException('Failed to update post');
    }
  }

  async remove(slug: string, userId: number) {
    const post = await this.prisma.post.update({
      where: {
        slug: slug,
      },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    return post;
  }
}
