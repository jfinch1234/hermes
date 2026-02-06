# Partner Embed Kit

## What Hermes is
Hermes is a neutral decision helper that narrows options by explaining real differences.

## What Hermes is not
- Not a ranking engine
- Not a recommendation engine
- Not a persuasion surface

## Integration steps
1. Create a session.
2. Render the status line from the response.
3. If a clarification is present, render the question and chips.
4. Render up to 3 options (no emphasis or ordering cues).
5. Render the honesty window for each option, always visible.
6. Provide a "Not what I expected" action that triggers repair.

## Operational notes
- Single-store only: each session is bound to one store.
- Max-3 options: do not render more than 3 options.
- Proof mode: available in dev/staging only, not in production.

## Don't do this
- Do not highlight, rank, or default-select an option.
- Do not add "best", "top", "recommended", or similar language.
- Do not hide the honesty window or delay it behind a click.
- Do not add promotional badges, banners, or performance claims.
