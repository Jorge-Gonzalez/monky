# ADR 0001 — Three storage layers for the macro library

Status: accepted
Date: 2026-07-31

## Context

A discrepancy in local storage — two keys, `macro-storage` and a stale `macros` — started as a
question about leftover data and turned into an audit of how the library is stored. Three things
came out of it, in ascending order of seriousness.

The `macros` key is orphaned. Commit `2692ffe` (2026-06-04) removed the write and called it "a
legacy 'macros' chrome.storage key that nothing reads"; the key's newest entry is dated the
evening before. It is residue, not a bug, and it still holds macros that have since been deleted.

The store was **221 bytes from silent data loss**. `chrome.storage.sync` caps an item at 8192
bytes and the persisted state measured 7971. Reads preferred sync and fell back to local; writes
went to local always and to sync inside a swallowed `catch`. Past the cap the sync write rejects,
the copy freezes, and the frozen copy — not being null — keeps winning the read, so the store
hydrates stale and then persists the stale state back over the good local copy. This had already
surfaced once as settings controls flickering back to a stale value, and was patched at the echo
rather than at the ordering.

There was no automatic backup at all. Export existed, but only as something to remember to do.

## Decision

Three layers, covering disjoint failures. None replaces another.

| layer | protects against | survives | state held |
| --- | --- | --- | --- |
| local snapshots | user error — bulk delete, bad import, mangled edit | reinstall? no | history |
| sync chunked backup | device loss, reinstall | leaving the browser? no | latest only |
| explicit export | everything, including leaving the browser ecosystem | — | a point in time |

`chrome.storage.local` is the sole authority for reads. Not local-first with a sync fallback —
local only. Macros are not edited on two machines at once, so hydration has nothing to gain from
consulting sync and a whole failure mode to lose. Sync is still written so that a restore has
something to find, and a rejection is now reported instead of swallowed.

**Layer 1 — local snapshots.** One key per snapshot holding the serialized library with a
revision, timestamp and checksum. Debounced on change; a snapshot identical to the last is
skipped. Retention is tiered, not a flat ring. Forced snapshots before restore and before import.

**Layer 2 — chunked backup to the browser account.** Deferred, designed, not built. Serialize,
split into sub-8KB chunks, write a manifest last carrying chunk count, checksum and a monotonic
revision. Two alternating slots, A and B, with the manifest naming the live one. Backup is
automatic and debounced; **restore is explicit**, because overwriting a local library is exactly
the kind of operation a user should confirm.

**Layer 3 — export/import.** Unchanged, and the only copy that works signed out or on Firefox
Android.

## Reasoning worth keeping

**Retention must be tiered.** A flat ring of the last N defends the wrong failure. Mistakes are
not noticed immediately: the user keeps working, each change writes another snapshot, and the
last good state is churned out by the very edits made after the damage. Five recent changes, one
per hour for a day, one per day for a fortnight. Bucketed at write time, so there is no sweep to
forget.

**A/B slots are load-bearing for a reason stronger than "sync has no history."** Writing the
manifest last orders things on the *writing* device. Cross-device arrival order for a multi-key
`set()` is **undocumented** — this was researched and could not be confirmed either way. So on the
receiving device chunks may land in any order, and a stale chunk from two cycles ago can sit
beside a fresh manifest. A/B plus checksum makes the design correct whichever way the undocumented
behaviour falls, which is better than resolving the question.

**No Lamport clock, and no device-id tiebreak.** An earlier draft had both. They were sized for
concurrent writers, and a text expander is not used from two devices at once. A plain monotonic
revision suffices, and the concurrent-slot-collision failure mode disappears rather than needing
to be documented. Stating the usage model beat designing for the general case.

**Merge is rejected, not deferred.** Per-record sync with revisions and tombstones is the smallest
*correct* design for real multi-device editing, and it is not small: per-record keys, explicit
ordering as its own state, a diff on write, revisions, tombstones, and tombstone garbage
collection. Tombstones are the expensive part, and the standard time-based answer is a known
footgun — Cassandra's `gc_grace_seconds` defaults to ten days, after which a node that was offline
longer resurrects deleted data.

If merge is ever wanted, the escape from that is already here: bound tombstones by count rather
than by time, publish an `oldestMergeableRev`, and have any device older than it take the snapshot
path instead of merging. That is Raft's `InstallSnapshot` and Kafka's log compaction — a follower
too far behind the retained log gets a snapshot, not log entries. The snapshot layer is what makes
it safe, which is an argument for building the snapshot first regardless.

**A tombstone must be `{ id, rev, deletedAt }` and never the content.** A `deleted: true` flag on
a macro leaves its text in place. If someone deleted it *because* it was sensitive — and
`is_sensitive` says that case exists — keeping the content is a quiet betrayal of what delete
means. It also bounds the pollution: ~60 bytes against ~300 for a real macro.

**Snapshots hold macros only.** Restoring last Tuesday's theme and language because the macro
library was wanted back is a surprise, and config is small and re-settable by hand.

## Prior art

Chrome's docs say `storage.sync` is for "preserving user settings", `storage.local` for "larger
amounts of data". On the chromium-extensions list, Chrome DevRel is blunter: keep sync small
enough that quota is never a problem, and **treat sync as a cache rather than authoritative
storage**.

**Briskine** — an open-source text expander, same category, 100k+ users. Every `src/**/*.js` was
scanned: it uses `storage.sync` **zero times**. Local for extension data, Firestore for
cross-device. An account is required; signed out you get demo templates only.

**Stylus** — large user-authored data. Sends exactly three keys to sync, each lz-string
compressed, behind an explicit `MAX_WRITE_OPERATIONS_PER_MINUTE` backoff. Styles live locally;
cross-device runs through Dropbox/Drive/WebDAV. Its cloud broker uses per-record `_id` and `_rev`
and compares revisions **on delete as well as on put** — the guard that stops a stale delete
removing a newer record.

**AutoTextExpander** — no account, closest match to Monky's intended shape. Stores one item per
shortcut in `storage.sync` (hence its interest in `MAX_ITEMS`), shows quota usage in its options
UI, and surfaces `runtime.lastError` rather than swallowing it.

## Consequences

Macros no longer ride Chrome sync between devices. Given the 8 KB cap, they had not been for some
time.

No registration. It buys server cost, GDPR obligations and support load in exchange for something
the browser already does, and an account wall is the largest install drop-off for an extension
whose purpose is to be read.

Two slots halve the usable sync budget when layer 2 lands — ~50 KB of 102,400, which at ~300 bytes
per macro is several hundred macros. Worth surfacing as a budget readout, the way
AutoTextExpander does.

The `macros` key is still on disk, deliberately: it holds two macros deleted from the live store,
and removing it is a data deletion that should be a decision rather than a side effect.
