import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * =====================================================================
 * FILTER PRODUCT DTO - Đối tượng lọc và tìm kiếm sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUERY PARAMETER TRANSFORMATION:
 * - Các tham số từ URL luôn là chuỗi (String).
 * - `@Type(() => Number)`: Giúp tự động chuyển đổi các chuỗi này thành số (Number) để ta có thể so sánh giá hoặc phân trang.
 *
 * 2. PAGINATION (Phân trang):
 * - `page` và `limit`: Giúp giới hạn số lượng sản phẩm trả về mỗi lần, tránh làm quá tải server và frontend khi có hàng ngàn sản phẩm.
 *
 * 3. SORTING (Sắp xếp):
 * - `SortOption`: Enum định nghĩa các kiểu sắp xếp phổ biến (Giá tăng/giảm, Mới nhất).
 *
 * 4. OPTIONAL FILTERS:
 * - Tất cả các trường đều là `@IsOptional()`, cho phép người dùng linh hoạt lọc theo bất kỳ tiêu chí nào hoặc không lọc gì cả.
 * =====================================================================
 */

export enum SortOption {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

export class FilterProductDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  ids?: string; // Comma separated IDs

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(SortOption)
  sort?: SortOption;

  @IsOptional()
  @IsString()
  includeSkus?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
