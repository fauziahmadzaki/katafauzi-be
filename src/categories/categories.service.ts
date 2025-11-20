import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import slugify from 'slugify';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { handlePaginate } from 'src/common/utils/pagination.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name } = createCategoryDto;
    const slug = slugify(name, { lower: true, strict: true, trim: true });

    try {
      return await this.prisma.category.create({ data: { name, slug } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Category with this name already exists');
        }
      }
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async findAll(dto: PaginationDto) {
    const { skip, take } = handlePaginate(dto);

    try {
      const [categories, total] = await this.prisma.$transaction([
        this.prisma.category.findMany({
          take: take,
          skip: skip,
        }),
        this.prisma.category.count(),
      ]);

      const totalPages = Math.ceil(total / take);
      return {
        items: categories,
        meta: {
          totalItems: total,
          itemsPerPage: take,
          totalPages,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async findOne(id: number) {
    try {
      const post = await this.prisma.category.findUnique({
        where: { id },
        include: { posts: true },
      });

      return post;
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const newData: Prisma.CategoryUncheckedUpdateInput = {
      ...updateCategoryDto,
    };

    if (updateCategoryDto.name) {
      newData.slug = slugify(updateCategoryDto.name, {
        lower: true,
        strict: true,
        trim: true,
      });
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: newData,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Category with this name already exists');
        }
      }
      throw new InternalServerErrorException('Internal server error');
    }
  }

  remove(id: number) {
    return this.prisma.category.delete({ where: { id } });
  }
}
