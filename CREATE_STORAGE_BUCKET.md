# Create Storage Bucket in Supabase

## Go to Supabase Dashboard → Storage → Create a new bucket

1. Click "New bucket"
2. Name: `recordings`
3. Public bucket: **NO** (keep it private)
4. Click "Create bucket"

## Set up RLS policies for the bucket

After creating the bucket, go to **Storage** → **Policies** → **recordings** bucket

Add this policy:

**Policy name**: Users can upload their own recordings

**Policy definition**:
```sql
(bucket_id = 'recordings'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])
```

**Allowed operations**: INSERT, SELECT

This allows users to upload and read only their own recordings (stored in folders named by user_id).

## Alternative: Quick SQL

Or run this in SQL Editor:

```sql
-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false);

-- Create policy for user uploads
create policy "Users can upload own recordings"
on storage.objects for insert
with check (
  bucket_id = 'recordings' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for user reads
create policy "Users can read own recordings"
on storage.objects for select
using (
  bucket_id = 'recordings' 
  and (storage.foldername(name))[1] = auth.uid()::text
);
```
