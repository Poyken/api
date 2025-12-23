/**
 * =====================================================================
 * CART CONTROLLER - Điều khiển Giỏ hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Controller này xử lý tất cả các request liên quan đến Giỏ hàng.
 * Nó nhận request từ client, xác thực user, rồi gọi CartService để
 * thực hiện business logic.
 *
 * FLOW XỬ LÝ:
 * Client → Controller → Service → Database
 *
 * CÁC CHỨC NĂNG CHÍNH:
 * 1. Xem giỏ hàng (GET /cart)
 * 2. Thêm sản phẩm vào giỏ (POST /cart)
 * 3. Cập nhật số lượng (PATCH /cart/items/:id)
 * 4. Xóa một sản phẩm (DELETE /cart/items/:id)
 * 5. Xóa toàn bộ giỏ hàng (DELETE /cart)
 * 6. Gộp giỏ hàng guest vào tài khoản (POST /cart/merge)
 *
 * ⚠️ LƯU Ý: Tất cả các endpoint đều yêu cầu đăng nhập (JwtAuthGuard)
 * =====================================================================
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('Shopping Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard) // Bảo vệ tất cả route - Yêu cầu JWT Token hợp lệ
@ApiBearerAuth() // Hiển thị nút nhập Token trên Swagger UI
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Lấy thông tin giỏ hàng của user hiện tại.
   * Trả về danh sách items, tổng tiền và tổng số lượng.
   */
  @Get()
  @ApiOperation({ summary: 'Lấy giỏ hàng của người dùng hiện tại' })
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  /**
   * Thêm sản phẩm (SKU) vào giỏ hàng.
   * Nếu SKU đã có trong giỏ → Cộng dồn số lượng.
   */
  @Post()
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  addToCart(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, dto);
  }

  /**
   * Cập nhật số lượng của một item trong giỏ.
   * Được gọi khi user tăng/giảm số lượng ở trang giỏ hàng.
   */
  @Patch('items/:id')
  @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm trong giỏ' })
  updateItem(
    @Request() req,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(req.user.id, itemId, dto);
  }

  /**
   * Xóa một item khỏi giỏ hàng.
   */
  @Delete('items/:id')
  @ApiOperation({ summary: 'Xóa một sản phẩm khỏi giỏ hàng' })
  removeItem(@Request() req, @Param('id') itemId: string) {
    return this.cartService.removeItem(req.user.id, itemId);
  }

  /**
   * Xóa toàn bộ giỏ hàng (Clear Cart).
   */
  @Delete()
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ hàng' })
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }

  /**
   * Gộp giỏ hàng của Guest vào tài khoản User sau khi đăng nhập.
   *
   * FLOW:
   * 1. User chưa đăng nhập → Thêm sản phẩm vào localStorage (Guest Cart)
   * 2. User đăng nhập → Frontend gọi API này để merge vào DB
   * 3. Service xử lý từng item: check tồn kho, cộng dồn nếu trùng SKU
   */
  @Post('merge')
  @ApiOperation({ summary: 'Gộp giỏ hàng guest vào tài khoản user' })
  mergeCart(
    @Request() req,
    @Body() items: { skuId: string; quantity: number }[],
  ) {
    return this.cartService.mergeCart(req.user.id, items);
  }
}
