# Supabase Database Setup

## Migrations

Apply migrations in order by running the SQL in Supabase SQL Editor.

### 1. Builder Configs & Templates
**File:** `migrations/20260205_add_builder_configs.sql`

Creates tables:
- `builder_configs` - Stores App Builder, Web Builder, and CMS configurations
- `templates` - Stores custom website templates

## How to Apply

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `qymtjhzgtcittohutmay`
3. Go to **SQL Editor**
4. Copy the contents of the migration file
5. Run the SQL

## Storage Buckets

After running migrations, create storage buckets:

1. Go to **Storage** in Supabase Dashboard
2. Create bucket: `templates` (public)
3. Create bucket: `media` (public) - if not already exists

## Tables Overview

| Table | Purpose |
|-------|---------|
| `builder_configs` | App/Web Builder & CMS configs per user |
| `templates` | Website templates for Web Builder |
| `restaurants` | Restaurant data (already exists) |
| `orders` | Order data (already exists) |

## Row Level Security (RLS)

All tables have RLS enabled:
- Users can only access their own data
- Demo users (`user_id = 'demo-user'`) have access
- Service role has full access
