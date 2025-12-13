Development auth and testing
===========================

To test authenticated API endpoints locally, create a developer test user and print its token:

```bash
python manage.py create_dev_user --username=dev --email=dev@example.com --password=devpass
```

This will print an API token. Use it to call protected endpoints with the `Authorization: Token <token>` header.

Example using `curl`:

```bash
curl -H "Authorization: Token 4db18195974982419d2743e6c10a081b85740742" http://127.0.0.1:8000/api/student/courses/
```

That endpoint requires the authenticated user to be enrolled in a course to return results, otherwise it will return an empty array.

Note: This management command is development-only convenience; remove or restrict it before deploying to production.

You can also set `NEXT_PUBLIC_DEV_TOKEN` in `fronted_nextjs/.env.local` (or in your system env) so the frontend can inject it automatically. Example:

```
NEXT_PUBLIC_DEV_TOKEN=4db18195974982419d2743e6c10a081b85740742
```
