import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { comparePassword, hashPassword } from 'src/common/utils/password.util';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.userService.findOneByEmail(loginDto.email);
    // when email mismatch/not-found
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // when role mismatch
    if (user.role !== loginDto.role) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await comparePassword(loginDto.password, user.password);

    // when password mismatch
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(
    createUserDto: CreateUserDto,
  ): Promise<{ id: number; email: string }> {
    const existingUser = await this.userService.findOneByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new UnauthorizedException('This email already exists');
    }
    const newUser = await this.userService.create({
      ...createUserDto,
      password: await hashPassword(createUserDto.password),
    });
    return {
      id: newUser.id,
      email: newUser.email,
    };
  }
}
