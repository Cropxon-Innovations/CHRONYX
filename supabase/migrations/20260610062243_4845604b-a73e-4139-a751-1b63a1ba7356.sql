
-- Tighten content_comments: owner-only reads
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.content_comments;
CREATE POLICY "Users can view own comments"
ON public.content_comments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Tighten content_ratings: owner-only reads (aggregate avg lives on library_items)
DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.content_ratings;
CREATE POLICY "Users can view own ratings"
ON public.content_ratings FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Remove the overly-permissive tax_deductions read policy
DROP POLICY IF EXISTS "Deductions readable by authenticated users" ON public.tax_deductions;

-- Restrict project share-link reads to project admins
DROP POLICY IF EXISTS tm_share_select ON public.tm_project_share_links;
CREATE POLICY tm_share_select
ON public.tm_project_share_links FOR SELECT TO authenticated
USING (public.tm_can_admin_project(project_id, auth.uid()));

-- Restrict library_items public select role to authenticated only (no anon)
DROP POLICY IF EXISTS "Anyone can view public items" ON public.library_items;
CREATE POLICY "Authenticated users can view public items"
ON public.library_items FOR SELECT TO authenticated
USING ((is_public = true) OR (auth.uid() = user_id));

-- Storage: remove anon SELECT on library bucket (purchases use signed URLs / authed reads)
DROP POLICY IF EXISTS "Public can read public library files" ON storage.objects;

-- Storage: restrict book-assets SELECT to the owning user's folder OR public books
DROP POLICY IF EXISTS "Users can view book assets" ON storage.objects;
CREATE POLICY "Users can view their own book assets"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'book-assets'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.is_public = true
        AND (b.user_id)::text = (storage.foldername(name))[1]
    )
  )
);
