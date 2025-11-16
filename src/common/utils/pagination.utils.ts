import { PaginationDto } from '../dto/pagination.dto';

export const handlePaginate = (dto: PaginationDto) => {
  const { page = 1, limit = 10 } = dto;

  const skip = (page - 1) * limit;
  const take = limit;

  return { skip, take };
};
