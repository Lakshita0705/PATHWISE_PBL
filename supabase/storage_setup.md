# Supabase Storage Setup for Mentor Certificates

## Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **New Bucket**
4. Name: `mentor-certificates`
5. **Public bucket**: ✅ Yes (or No if you want private access)
6. **File size limit**: 5 MB (or your preferred limit)
7. **Allowed MIME types**: `application/pdf, image/jpeg, image/jpg, image/png`

## Storage Policies (if bucket is private)

If you set the bucket to private, create policies:

```sql
-- Allow public uploads for mentor applications
create policy "Public can upload mentor certificates"
on storage.objects for insert
with check (bucket_id = 'mentor-certificates');

-- Allow public read access to certificates (or restrict to admins)
create policy "Public can read mentor certificates"
on storage.objects for select
using (bucket_id = 'mentor-certificates');
```

## Alternative: Use Public Bucket

If you set the bucket to public, no policies are needed for basic upload/read operations.
