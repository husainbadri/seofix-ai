import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

let globalPrisma: PrismaClient | undefined;

export const getPrismaClient = (): PrismaClient => {
  if (!globalPrisma) {
    globalPrisma = new PrismaClient();
  }
  return globalPrisma;
};

export class InMemoryDbStore {
  private static instance: InMemoryDbStore;
  
  public projects: any[] = [];
  public crawlJobs: any[] = [];
  public crawledPages: any[] = [];
  public auditResults: any[] = [];
  public auditSummaries: any[] = [];
  public trackedKeywords: any[] = [];
  public backlinks: any[] = [];
  public competitors: any[] = [];
  public humanizedLogs: any[] = [];
  public reports: any[] = [];

  public static getInstance(): InMemoryDbStore {
    if (!InMemoryDbStore.instance) {
      InMemoryDbStore.instance = new InMemoryDbStore();
    }
    return InMemoryDbStore.instance;
  }
}
