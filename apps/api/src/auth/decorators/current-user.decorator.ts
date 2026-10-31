import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserProfile } from '@devpilot/shared';

export const CurrentUser = createParamDecorator(
  (data: keyof UserProfile | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;
    return data ? user[data] : user;
  }
);

