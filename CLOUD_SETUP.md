# Free GitHub Cloud Setup

This version stores letters in a GitHub Gist through a free Netlify Function. Do not paste a GitHub token into `app.js`; it would be visible to anyone who opens the website.

## 1. Create the Gist

1. Go to https://gist.github.com.
2. Create a new secret gist.
3. Add a file named `letters.json`.
4. Put this inside the file:

```json
[]
```

5. Save the gist.
6. Copy the gist ID from the URL. It is the long text after your username.

Example:

```text
https://gist.github.com/yourname/abc123456789
```

The gist ID is:

```text
abc123456789
```

## 2. Create a GitHub token

1. Go to https://github.com/settings/tokens.
2. Create a fine-grained personal access token.
3. Give it access to your account.
4. Enable Gist permission with read and write access.
5. Copy the token.

Keep this token private.

## 3. Deploy with Netlify free

1. Push this project to a GitHub repository.
2. Go to https://app.netlify.com.
3. Add new site from Git.
4. Pick your repository.
5. Leave build command empty.
6. Set publish directory to:

```text
.
```

7. Deploy.

## 4. Add Netlify environment variables

In Netlify, open:

```text
Site configuration > Environment variables
```

Add these:

```text
GITHUB_TOKEN=your_github_token
GITHUB_GIST_ID=your_gist_id
```

Then redeploy the site.

When it works, the website status changes from `Local preview` to `GitHub synced`.
