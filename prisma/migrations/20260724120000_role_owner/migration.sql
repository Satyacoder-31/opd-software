-- AlterEnum: add clinic owner (signup creator / primary clinic manager)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'owner';
