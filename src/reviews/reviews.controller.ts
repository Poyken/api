import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

/**
 * =====================================================================
 * REVIEWS CONTROLLER - Điều hướng yêu cầu về đánh giá
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ACCESS CONTROL (Kiểm soát truy cập):
 * - `findAll` và `remove` (Admin): Yêu cầu cả `JwtAuthGuard` và `PermissionsGuard` để đảm bảo chỉ Admin có quyền mới được quản lý review.
 * - `create`, `update`, `removeOwn` (User): Chỉ yêu cầu `JwtAuthGuard` vì đây là quyền cơ bản của mọi người dùng đã đăng nhập.
 *
 * 2. CUSTOM DECORATORS:
 * - `@GetUser('id')`: Một decorator tự chế giúp lấy ID người dùng trực tiếp từ Token, làm code sạch hơn so với việc dùng `req.user.id`.
 *
 * 3. PUBLIC VS PRIVATE ROUTES:
 * - `findAllByProduct`: Là route công khai (Public), không cần Guard, giúp khách vãng lai cũng có thể đọc được các đánh giá sản phẩm.
 * =====================================================================
 */
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/permissions.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('review:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả đánh giá (Admin)' })
  @ApiOperation({ summary: 'Lấy tất cả đánh giá (Admin)' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('rating') rating?: number,
  ) {
    return this.reviewsService.findAll(
      Number(page),
      Number(limit),
      rating ? Number(rating) : undefined,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard) // Chỉ cần Login là được, không cần quyền đặc biệt
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Gửi đánh giá (Phải đã mua sản phẩm & ĐÃ GIAO HÀNG)',
  })
  create(
    @GetUser('id') userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, createReviewDto);
  }

  @Get('check-eligibility')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra quyền đánh giá' })
  checkEligibility(
    @GetUser('id') userId: string,
    @Query('productId') productId: string,
  ) {
    return this.reviewsService.checkEligibility(userId, productId);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Lấy đánh giá theo sản phẩm' })
  findAllByProduct(
    @Param('productId') productId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewsService.findAllByProduct(
      productId,
      Number(page),
      Number(limit),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('review:delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa đánh giá (Admin)' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }

  @Delete('mine/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa đánh giá của tôi' })
  removeOwn(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.reviewsService.removeOwn(userId, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật đánh giá' })
  update(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(userId, id, updateReviewDto);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload review images' })
  async uploadImages(@UploadedFiles() files: Array<Express.Multer.File>) {
    const uploaded = await Promise.all(
      files.map((file) => this.cloudinaryService.uploadImage(file)),
    );
    return {
      urls: uploaded.map((res) => res.secure_url),
    };
  }
  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('review:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trả lời đánh giá (Admin)' })
  reply(@Param('id') id: string, @Body('reply') reply: string) {
    return this.reviewsService.replyToReview(id, reply);
  }
}
