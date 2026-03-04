import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    phone: text('phone'),
});

export const files = sqliteTable('files', {
    id: text('id').primaryKey(),
    fileName: text('file_name').notNull(),
    originalSize: integer('original_size').notNull(),
    blocksCount: integer('blocks_count').notNull(),
    userId: text('user_id').notNull().references(() => users.id),
});

export const memoryBlocks = sqliteTable('memory_blocks', {
    id: text('id').primaryKey(),
    blockName: text('block_name').notNull(),
    blockSize: integer('block_size').notNull(),
    position: integer('position').notNull(),
    telegramId: text('telegram_id').notNull(),
    fileId: text('file_id').notNull().references(() => files.id),
});
