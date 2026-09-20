# Planned: correction mode

Not built. Recorded here so the design is not lost — requested 2026-09-20 and
deliberately kept out of the multi-day work.

## The problem it solves

Times as actually worked are not always times that may be booked. Three rules
can be violated:

- More than **10 hours** on a single day.
- Too long **in one stretch** without the required break (30 minutes from 6
  hours, 45 minutes from 9 hours).
- Work outside the **core hours** (06:00–20:00 in this user's case), or on a
  Sunday.

The fix is always the same shape: rewrite the times so the structure becomes
bookable **while the worked total stays exactly the same**. Doing that by hand
against three rules at once is the part the tool does not help with.

## Shape requested

A separate view — an explicit correction mode, not an overlay on the normal
table.

- **Original against modified**, side by side, same data.
- **Green or red** on whether the worked total still matches the original.
- The **difference in hours and minutes** shown directly, not left to
  mental arithmetic.
- **Core hours configurable**, alongside the daily limit and the break rules.
- A hint in the normal overview that correction mode is needed. The user noted
  this hint alone does not fully cover the case, so it supports the mode
  rather than replacing it.

## Open

"Ein paar Extras" were mentioned and still need discussion — likely candidates
are suggesting a correction rather than only measuring one, and remembering a
correction alongside the original.
