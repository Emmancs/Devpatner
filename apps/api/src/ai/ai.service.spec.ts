import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from '../github/github.service';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { CodeSearchService } from './code-search.service';

describe('AiService conversation access', () => {
  it('does not append messages to a conversation outside the project/user scope', async () => {
    const prisma = {
      project: {
        findUnique: jest.fn().mockResolvedValue({ ownerId: 'owner-1' }),
      },
      conversation: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      conversationMessage: {
        create: jest.fn(),
      },
    };
    const service = new AiService(
      prisma as unknown as PrismaService,
      {} as GithubService,
      {} as GeminiProvider,
      {} as CodeSearchService
    );

    await expect(
      service.chatWithCodebase('owner-1', 'project-1', {
        message: 'Question',
        conversationId: 'foreign-conversation',
      })
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'foreign-conversation',
        projectId: 'project-1',
        userId: 'owner-1',
      },
      select: { id: true },
    });
    expect(prisma.conversationMessage.create).not.toHaveBeenCalled();
  });
});
