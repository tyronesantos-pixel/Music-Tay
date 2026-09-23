import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const videos = pgTable('videos', {
  id: text('id').primaryKey(),
  youtubeUrl: text('youtube_url').notNull(),
  title: text('title').notNull(),
  channelTitle: text('channel_title').notNull(),
  channelId: text('channel_id'),
  channelUrl: text('channel_url'),
  thumbnailUrl: text('thumbnail_url').notNull(),
  duration: integer('duration').default(0).notNull(),
  isShort: boolean('is_short').default(false).notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  notes: text('notes'),
  addedByUid: text('added_by_uid'),
  addedByEmail: text('added_by_email'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const collections = pgTable('collections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  videoIds: jsonb('video_ids').$type<string[]>().default([]).notNull(),
  userUid: text('user_uid'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
