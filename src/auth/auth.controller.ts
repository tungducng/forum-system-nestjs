import { UsersService } from './../users/users.service';
import {
  Body,
  Req,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  Res,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RequestWithUser } from './requestWithUser.interface';
import { LocalAuthenticationGuard } from './localAuthentication.guard';
import { JwtAuthenticationGuard } from './jwt-authentication.guard';
import { JwtRefreshGuard } from './jwt-refresh.guard';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() registrationData: RegisterDto) {
    return this.authService.register(registrationData);
  }

  @HttpCode(200)
  @UseGuards(LocalAuthenticationGuard)
  @Post('login')
  async logIn(@Req() request: RequestWithUser) {
    const { user } = request;
    const accessTokenCookie = this.authService.getCookieWithJwtAccessToken(
      user.id,
    );
    const { cookie: refreshTokenCookie, token: refreshToken } =
      this.authService.getCookieWithJwtRefreshToken(user.id);

    await this.usersService.setCurrentRefreshToken(refreshToken, user.id);

    request.res.setHeader('Set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie,
    ]);
    return user;
  }

  @UseGuards(JwtAuthenticationGuard)
  @Post('logout')
  @HttpCode(200)
  async logOut(@Req() request: RequestWithUser) {
    await this.usersService.removeRefreshToken(request.user.id);
    request.res.setHeader('Set-Cookie', this.authService.getCookiesForLogOut());
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get()
  authenticate(@Req() request: RequestWithUser) {
    const user = request.user;
    user.password = undefined;
    return user;
  }

  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  refresh(@Req() request: RequestWithUser) {
    const accessTokenCookie = this.authService.getCookieWithJwtAccessToken(
      request.user.id,
    );

    request.res.setHeader('Set-Cookie', accessTokenCookie);
    return request.user;
  }
}
