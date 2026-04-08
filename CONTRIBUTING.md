# Contributing Guide

> ISIT950 Course Collaboration Platform · Autumn 2026  
> Maintained by Bingyan Wang (Team Lead / Scrum Master)

---

## PR Title Format

All pull requests **must** follow this format:

```
[SprintN][Type] Short description — #issue_number
```

**Type options:** `Frontend` · `Backend` · `Report` · `DevOps` · `Scrum`

### Examples

```
[Sprint3][Frontend] Forum thread list UI — #8
[Sprint3][Backend]  Course CRUD + Materials upload API — #12
[Sprint2][Frontend] Login page with form validation — #5
[Sprint1][DevOps]   GitHub repo setup and branch strategy — #3
```

### Rules

- Copy the `[SprintN][Type]` prefix directly from the linked issue title
- Keep the description **shorter** than the issue title — describe what was done, not "Build" or "Implement"
- Always end with ` — #issue_number` (space, em dash, space, hash, number)

---

## PR Description (Required)

The **first line** of your PR description must link to the issue:

```
Closes #8
```

This is required for the AI pre-review bot to fetch the issue's acceptance criteria and generate a review report automatically.

Other accepted keywords: `Fixes #xx` · `Resolves #xx`

---

## Branch Naming

```
feature/short-description
```

Examples:
```
feature/login-page
feature/course-crud-api
feature/forum-thread-list
feature/assignment-submission
```

---

## Before You Submit a PR

- [ ] PR title follows the `[SprintN][Type] Description — #xx` format
- [ ] PR description starts with `Closes #xx`
- [ ] Code runs locally without errors
- [ ] All acceptance criteria in the linked issue have been addressed (or noted as out of scope)
- [ ] No console errors or debug logs left in the code

---

## After the Bot Review

When you open a PR, an AI pre-review bot will automatically post a comment checking your code against the linked issue's acceptance criteria.

**Please read the bot report before requesting human review.**  
Address any `❌ Missing` or `⚠️ Code Quality` items first, then request review from the leads.

---

## Keyword Search Reference

Use these keywords in the GitHub search bar to find issues and PRs quickly:

| What you want | Search keyword |
|---|---|
| All Sprint 3 items | `Sprint3` |
| All frontend tasks | `Frontend` |
| All backend tasks | `Backend` |
| A specific feature | `Login` · `Forum` · `Assignment` |
| Your own items | your name e.g. `Sahim` |
| Combined | `Sprint3 Backend` |

---

*Questions? Message Bingyan Wang in the group chat.*
