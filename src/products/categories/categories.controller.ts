import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

/**
 * =====================================================================
 * CATEGORIES CONTROLLER - Điều hướng yêu cầu về danh mục sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ACCESS CONTROL (RBAC):
 * - `create`, `update`, `remove` (Admin): Yêu cầu quyền cụ thể (VD: `category:create`) để đảm bảo chỉ Admin mới có thể thay đổi cấu trúc danh mục.
 * - `findAll`, `findOne` (Public): Cho phép mọi người truy cập để xem danh sách sản phẩm theo danh mục.
 *
 * 2. SWAGGER INTEGRATION:
 * - `@ApiTags('Product Categories')`: Giúp phân loại các API này vào nhóm "Danh mục sản phẩm" trên trang tài liệu `/docs`.
 * - `@ApiOperation`: Mô tả ngắn gọn chức năng của từng API cho các lập trình viên khác dễ hiểu.
 *
 * 3. QUERY PARAMETERS:
 * - `findAll(@Query('search'))`: Hỗ trợ tìm kiếm danh mục theo từ khóa ngay từ URL.
 * =====================================================================
 */
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Product Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('category:create')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create new category' })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      createCategoryDto.imageUrl = result.secure_url;
    }
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query('search') search?: string) {
    return this.categoriesService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category details' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('category:update')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update category' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      updateCategoryDto.imageUrl = result.secure_url;
    }
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('category:delete')
  @ApiOperation({ summary: 'Delete category' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
