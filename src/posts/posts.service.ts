import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
    const { title, content, published, categories } = createPostDto;

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
          categories: {
            connect: categories?.map((id) => ({ id: id })),
          },
        },
        include: {
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Post with this title already exists');
        }
      }
      throw new InternalServerErrorException('Internal server error');
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

    try {
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
            updatedAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            categories: {
              select: {
                id: true,
                name: true,
                slug: true,
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
    } catch (error) {
      throw new InternalServerErrorException('Internal server error!');
    }
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto, userId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You are not allowed to update this post');
    }
    const { categories, ...rest } = updatePostDto;

    const newData: Prisma.PostUncheckedUpdateInput = { ...rest };

    if (updatePostDto.title) {
      newData.slug = slugify(updatePostDto.title, {
        lower: true,
        strict: true,
        trim: true,
      });
    }

    if (categories) {
      newData.categories = {
        set: categories.map((id) => ({ id })),
      };
    }
    try {
      return await this.prisma.post.update({
        where: { id },
        data: {
          ...newData,
          updatedById: userId,
        },
        include: {
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Post with those slug already exists');
        }
      }
      throw new InternalServerErrorException('Internal server error!');
    }
  }

  async remove(id: number, userId: number) {
    const post = await this.prisma.post.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    return post;
  }
}
