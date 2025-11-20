import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsObject()
  @IsNotEmpty()
  content: object;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  categories?: number[];
}
