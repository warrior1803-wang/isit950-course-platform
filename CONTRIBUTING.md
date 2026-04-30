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
- If the PR covers multiple issues, use the **primary** issue number in the title

---

## PR Description (Required)

The PR description must include a `Closes #xx` line for **every** issue this PR addresses:

```
Closes #8
Closes #9
Closes #11
```

This is required for the AI pre-review bot to fetch each issue's acceptance criteria. The bot supports multiple issues in a single PR and will review each one separately.

Other accepted keywords: `Fixes #xx` · `Resolves #xx`

> **Best practice: one issue per PR.**  
> Smaller PRs are easier to review and less likely to cause merge conflicts.  
> Only combine multiple issues in one PR if the changes are genuinely inseparable.

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
- [ ] PR description includes `Closes #xx` for every related issue
- [ ] Code runs locally without errors
- [ ] All acceptance criteria in the linked issue(s) have been addressed (or noted as out of scope)
- [ ] No console errors or debug logs left in the code

---

## After the Bot Review

When you open a PR, the AI pre-review bot will automatically post a comment checking your code against every linked issue's acceptance criteria.

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
