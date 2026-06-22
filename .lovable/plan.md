## Plan: Publish the app

1. **Preflight website info** — verify/update root `head()` metadata in `src/routes/__root.tsx` (title, description, og:title, og:description, og:type, twitter:card, twitter:title, twitter:description, favicon) so the app shows correct branding when shared. Replace any "Lovable" defaults with First Class Fits branding.

2. **Run security scan** — confirm no unresolved critical findings block publish.

3. **Publish** to the Lovable URL (`9f41cc45-...lovable.app`). Visibility is already public.

4. **Guide custom domain** — after publish, instruct user to connect `firstclassfits.co` in Project Settings → Domains (add A records @ and www → 185.158.133.1, TXT `_lovable`). DNS propagation up to 72h; SSL auto-provisions.

5. **Note on email domain** — `notify.firstclassfits.co` is separate (Lovable-managed NS delegation); user can verify status in Cloud → Emails.

No code changes beyond metadata in step 1.