import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GithubCryptoService } from './crypto.service';

describe('GithubCryptoService', () => {
  it('encrypts and decrypts credentials without exposing plaintext', () => {
    const service = new GithubCryptoService({
      get: () => '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    } as unknown as ConfigService);
    const encrypted = service.encrypt('github-token');
    expect(encrypted).not.toContain('github-token');
    expect(service.decrypt(encrypted)).toBe('github-token');
  });

  it('rejects invalid encryption configuration', () => {
    expect(() => new GithubCryptoService({ get: () => 'invalid' } as unknown as ConfigService))
      .toThrow(InternalServerErrorException);
  });
});
