<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
## ClicksSpot architecture
- Store editable public page sections, navigation labels and page metadata in the existing site-content document; public React Query loaders share it with the admin editor so saved content and SSR search previews stay consistent. Transaction controls and fee calculations remain application-owned.
- Use the shared account-type query for header, selling and dashboard presentation; confirmed profile updates synchronize its cache and dashboard data so account controls cannot disagree.
- Preserve this project's pinned TanStack versions and generated Cloud integration; imported configuration must not replace them.
- Public marketplace reads use server publishable clients with React Query loaders; private actions use authenticated server functions and RLS.
- SQL functions own purchases, bidding and deal state changes under row locks so concurrent requests cannot bypass transaction rules.
- User roles are provisioned explicitly by trusted operators, never by signup order or user-editable metadata.
- Store public listing images separately from private deal evidence; private downloads require participant or admin access.
- Keep source demo listings clearly identified and nontransactional until they have a genuine seller account.
- Track missing external records, identities, file bytes and launch approvals in the migration ledger; never describe code-only progress as a complete migration.
