# Video remake workflow

## Required state machine

```text
1. create project
2. add or resolve source video
3. analyze source and build evidence
4. divide 0..duration into continuous timeline units
5. extract exact source-frame sheets
6. generate storyboard grids
7. review or edit copy without silently changing locked visuals
8. confirm a variant revision
9. submit final video jobs
10. validate and download results
```

Never collapse these stages into a synchronous `video_remake()` call.

## Evidence contract

- Timeline units start at `0`, are ordered, do not overlap, leave no gaps, and end at the source duration.
- Every frame contains a source timestamp and at least one evidence ID.
- Claims point to supplied facts or source evidence.
- Product, person, scene, and source-frame references remain separate roles.
- Product quantity remains constant unless the user approves a change.

## Visual and copy changes

The public workflow may explain which fields are editable and which are locked, but it does not publish hosted prompt wording. When the user requests copy-only changes, preserve the approved visual structure. If a requested copy change forces timing or visual changes, surface the conflict and create a new revision.

## Hosted tool order

Use `video_create_project`, source upload or `video_add_source_link`, `video_analyze`, job polling, `video_create_source_frames`, `video_generate_grids`, `video_get_review`, `video_update_copy` when needed, `video_confirm_variant`, and `video_generate`.

Poll each asynchronous job with exponential or bounded linear backoff. A practical interactive sequence is 2s, 4s, 8s, then 10–15s. Stop on completion, failure, cancellation, or a user decision boundary.

## Confirmation

Before final generation, show the user the copy, timeline, storyboard state, product quantity, selected model/resolution, and material assumptions. Confirmation binds a specific revision; edits afterward require a new confirmation.
