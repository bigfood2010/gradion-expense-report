# Frontend Demo Flow

## Demo Goal

Use the demo to show frontend quality through the user journey. Focus on clarity, safe actions, visible feedback, accessibility, and user trust instead of implementation trivia.

The main message: the site guides a user from login to submitted expense report while preventing unsafe or incomplete actions.

## Flow To Present

### 1. Login and session handling

Start with the protected app flow.

Mention:

- Authenticated users land in the workspace, not a marketing page.
- Protected routes keep report pages behind the session.
- Admin users are redirected to the admin area.
- Logout clears auth state and cached report data, so the next user cannot see stale report information.

Frontend best practice:

- Treat auth state and cached data as one user boundary.
- Do not rely only on route redirects; clear client cache on logout.

### 2. Dashboard

Show the dashboard as the main workspace.

Mention:

- Summary cards give quick status visibility.
- Status filters narrow the report list without changing the mental model.
- Infinite loading keeps the list usable as data grows.
- Loading, empty, and error states are visible instead of blank screens.

Frontend best practice:

- Every async surface needs four states: loading, success, empty, and error.
- Filters should be obvious, reversible, and scoped to the current view.

### 3. Report creation

Create or open a draft report.

Mention:

- Draft creation is a simple path with low friction.
- Report title edits stay local until saved.
- Dirty state protection warns before leaving with unsaved changes.

Frontend best practice:

- Keep draft state close to the route that owns the workflow.
- Protect user input before navigation or sign out.

### 4. Receipt upload

Upload a receipt from the report detail page.

Mention:

- Users can drag a file or use the file picker.
- The frontend makes accepted file types visible.
- The backend still performs the real file validation.
- The drawer moves into a processing state immediately so the user knows the action started.
- Failed extraction has a retry path.

Frontend best practice:

- Use client hints for convenience, server validation for trust.
- Never leave upload or AI work without visible progress and recovery.

### 5. AI review drawer

Open the review drawer after extraction completes.

Mention:

- AI extracted fields are shown as suggestions, not final truth.
- The user reviews and edits merchant, description, amount, currency, and date.
- Required fields show inline validation.
- The item is not treated as ready until the user saves the reviewed values.

Frontend best practice:

- AI output needs a human review gate when it affects money or submission.
- Put validation next to the field that needs attention.

### 6. Submit flow

Try submitting before and after items are ready.

Mention:

- Submit is disabled while extraction is processing.
- Submit is disabled when an item still needs review.
- Submit is disabled when required item values are invalid.
- Risky submission waits for confirmed state instead of optimistic UI.

Frontend best practice:

- Disable actions for known invalid state.
- Avoid optimistic UI for irreversible or workflow changing actions.
- Match frontend blocking rules with backend validation.

### 7. Receipt privacy

Open a saved receipt if available.

Mention:

- The frontend does not depend on public bucket URLs.
- Receipt access goes through the authorized API flow.
- The app receives short lived receipt links only when needed.

Frontend best practice:

- Private files should remain private even if the UI needs previews.
- Client convenience must not bypass authorization.

### 8. Accessibility

Use keyboard navigation during the demo.

Mention:

- Keyboard focus is visible.
- Buttons and hidden file inputs have labels.
- Busy controls expose loading state visually.
- Error messages are visible near the action or field that failed.

Frontend best practice:

- Keyboard users should always know where focus is.
- Visual feedback should not depend on color alone when an action is blocked or failed.

### 9. Responsive UI

Resize or mention mobile behavior.

Mention:

- Sticky workspace header keeps navigation and account actions reachable.
- The report detail view keeps content constrained for readability.
- The receipt drawer gives a focused task area.
- Controls use touch friendly hit sizes.

Frontend best practice:

- Use constrained content widths for dense business workflows.
- Use drawers for focused side tasks that should not lose page context.

## Best Practice Talking Points

- **Route level ownership:** report detail owns title edits, drawer state, upload state, submit state, and leave protection.
- **TanStack Query discipline:** mutation success invalidates relevant report/admin queries; logout clears cached data.
- **Shared DTO alignment:** frontend payloads match backend and shared DTO expectations, especially item amount.
- **Progressive disclosure:** the dashboard stays simple, while receipt review details live in the drawer.
- **Trust first actions:** submit waits for completed extraction, human review, and valid item values.
- **Clear failure states:** upload and extraction failures give a message plus a retry path.
- **Human review for AI:** extracted fields are marked and editable before they affect submission.
- **Accessible interaction:** labels, focus states, button states, and inline validation support keyboard and screen reader users.

## Demo Caveats

- Keep the AI provider key server side only. Do not put it in client `VITE_*` variables.
- Demo seed requires `ALLOW_DEMO_SEED=true`; this prevents accidental seed resets outside local or demo usage.
- Receipt extraction can take a few polling cycles, so pause on the processing state and explain the feedback loop.
- Client accepted file types are only hints. Backend validation is the source of truth.
- Receipt links are short lived, so old preview links may expire by design.

## Demo Close

End by tying the workflow together:

The frontend is not just a visual layer. It protects user data, prevents invalid state transitions, makes async work understandable, and keeps AI output reviewable before financial data is submitted.
