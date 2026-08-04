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

**Layer 2 — chunked backup to the browser account.** Built, 2026-08-01; see the amendment below.
Serialize, split into sub-8KB chunks, write a manifest last carrying chunk count, checksum and a
monotonic revision. Two alternating slots, A and B, with the manifest naming the live one. Backup is
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

## Amendment, 2026-07-31 — the single-session lease, and what replaced it

A later pass asked whether the design could be cut down by making the library single-instance:
one device holds it, a newer sign-in takes ownership, older devices go read-only, and history is
dropped entirely. It does not simplify anything, and the reason generalises.

**A lease needs a coordinator, and sync cannot be one.** Mutual exclusion requires a place both
devices can contend against. `chrome.storage.sync` has no compare-and-swap, no conditional write
and no transaction, so two devices can each read "unheld", each write their own claim, and each
conclude they hold it. Propagation is delayed *and* unordered across keys, so a claim written
first can arrive second and look newer. The split-brain window is not milliseconds; it is however
long a laptop stays shut. A lease therefore needs a server — and having paid for a server, a lease
is a worse product than sync, because it spends the cost to *remove* a capability.

**There is no sign-in event to hang a session on, and this was checked rather than assumed.**
`identity.getProfileUserInfo()` returns the profile account's email and id — the same value on
every device, so it cannot distinguish them — and `identity.onSignInChanged` covers the local
profile only. `chrome.sessions.getDevices()` does return foreign devices by name with per-session
`lastModified` stamps, behind the `sessions` permission, but it reads *tab sync* data: it requires
the user to have tab sync on and reports browsing activity, not whether that device touched the
macro library. No API reports "signed in on another device". The real signal is
`chrome.storage.sync.onChanged` carrying a value this device did not write; late and unordered,
but the actual event rather than a proxy for it.

**Exclusion is not durability.** Locking a second device out creates no copy. It addresses
concurrent editing, which this ADR already rules out on usage grounds, and leaves device loss —
the failure the layers exist for — untouched.

**Sync cannot become the read authority, and the reason survives chunking.** The counter-argument
offered was that a text expander is read-heavy, so writes are rare and the write quota is no
obstacle. That is true and beside the point: the 8192-byte limit is a size cap, not a rate cap, and
read-heaviness does not shrink a library. The durable objection is that a multi-key `set()` is not
atomic and does not propagate in order, so once layer 2 splits the library into chunks a read taken
mid-propagation can pair a fresh manifest with a stale chunk. The checksum detects it, but
detection leaves the reader with nothing, whereas `chrome.storage.local` always holds something
good. Local stays authoritative because sync has no consistent read — not because sync is small.

**Replace the lock with a label.** What the lease was reaching for is information at the moment two
libraries meet, and that moment is already gated behind an explicit confirmed restore. So record
edits instead of forbidding them: a bounded log of `{ at, dev, kind, n }`, ten entries at roughly
45 bytes, letting restore say *"last changed on Work laptop 2 hours ago — 3 deleted, 1 edited;
restoring replaces the 47 macros here"*. It needs no coordination, no account and no server.

The log belongs in **its own sync key**, not inside the payload. Separate items carry separate
8192-byte budgets and the 512-item limit is nowhere near, so it never competes with the library for
space — and it stays readable when the payload write is the thing that failed, which is exactly
when the user needs to know what happened.

A device id needs no API and no fingerprinting: `chrome.storage.local` does not sync, so a
`crypto.randomUUID()` written there *is* a per-device identity by construction.

**Session-scoped undo is welcome, and is not a substitute for snapshots.** An in-memory undo stack
beats a snapshot for the case it covers — instant, no dialog, nothing to understand — and is
useless for the one snapshots exist for, because mistakes are not noticed immediately. Build it as
UX, not as a replacement. Snapshots remain the cheapest layer in the design: local storage, no
quota contention, no propagation, no atomicity problem.

## Amendment, 2026-08-01 — a byte ceiling for the snapshot set

The tiers bound how *many* snapshots survive, never how large they are, so the wall moved with the
library. At the ceiling of roughly 42 retained entries — five recent, twenty-four hourly, thirteen
further daily — a library of about **250 KB, some 830 plain macros**, fills the whole 10,485,760
bytes of `chrome.storage.local`. Past that the writes that fail are not only the snapshots but the
live library, since they share the quota.

**Budget the set at 5 MB, with a floor of the three newest.** Half the quota is deliberately left
free because the two failures are not comparable: losing an old snapshot is a disappointment,
whereas filling the quota breaks the write of the library itself, which is the thing every layer
here exists to protect. The floor matters for its own reason — without it a library larger than the
budget retains nothing, and being told backups exist and finding none is worse than never having
offered them.

**Eviction runs cheapest tier first, oldest first inside a tier**: `unplaced` (entries kept only
because their timestamp could not be trusted enough to bucket), then `daily`, then `hourly`, then
`recent`. Value density is highest at the fine grain, because "restore from earlier today" is the
request that actually arrives.

**The floor is taken by revision, not by timestamp.** Revisions are monotonic and wall clocks are
not, so a skewed clock cannot argue the newest snapshots out of protection.

Where it binds, at ~300 bytes per macro: fifty macros keeps all 42 snapshots and the budget never
engages; two hundred macros the same; eight hundred macros keeps about 21 — recent, a full day, and
several days back; and past that the floor takes over.

The size costs nothing to obtain: `measureMacros` returns the digest and the serialized length from
one pass, since both come from the same `JSON.stringify`. It is recorded as its own `bytes` field
rather than parsed back out of the checksum's length prefix, which would make an incidental
formatting choice load-bearing. Two things are knowingly approximate. The count is UTF-16 code
units, so it undercounts accented text — fine for a budget, and would not be for an exact quota
assertion. And snapshots written before the field existed carry no `bytes`; they weigh zero and age
out through the tiers, because reading "unknown" as "huge" would evict the very history the feature
is for.

`unlimitedStorage` was considered and declined. It moves the wall rather than removing it, and it
would mean adding a permission for unbuilt headroom in the same breath as `alarms` was dropped.
Revisit if real libraries turn out large.

## Amendment, 2026-08-01 — layer 2 built, and what the building taught

Layer 2 landed as designed. Four things are worth recording because they were not obvious from the
design and would cost the next reader real time.

**Chunk sizes have to be measured, not estimated.** The quota counts a key's length plus the *JSON
stringification* of its value, and a serialized macro library is dense with quotes, each of which
doubles under escaping. A chunk sized by raw string length overshoots the 8192-byte item cap by
about a fifth and fails on a user's machine with nothing to see. So the split walks the text
charging each character what escaping will actually cost it, and refuses to cut between the halves
of a surrogate pair — the two chunks would each carry a lone surrogate, and the text would come back
mangled rather than failing loudly.

**The obvious stale-chunk cleanup is wrong, and its wrongness is invisible.** Comparing the new
chunk count against `manifest.chunks` never fires: the manifest read before a write describes the
slot being written *away from*. The slot being written was last touched two cycles ago and nothing
records how long it was then. Rather than track a second length, the write clears the whole tail a
slot could hold — `remove` on absent keys is free and `MAX_CHUNKS` bounds it. This was caught by a
test, not by review.

**The debounce must be an alarm.** An MV3 service worker is torn down when idle and takes pending
timers with it, so the one-minute `setTimeout` the earlier draft called for would simply never fire.
Creating an alarm with an existing name replaces it, so rescheduling *is* the debounce. This is why
the `alarms` permission returns after having been dropped with the backend.

**Results are discriminated on a string, not on `ok: boolean`.** This project does not enable
`strictNullChecks`, and without it TypeScript will not narrow a union on a boolean discriminant —
`if (!result.ok)` leaves `result.reason` a type error. String discriminants narrow either way, so
the results stay checkable without a project-wide tsconfig change, and `'incomplete'` says more at
a call site than `!ok` does.

The three failure modes of a read are kept distinct rather than collapsed, because only one of them
is worth retrying: `none` (nothing backed up), `incomplete` (the manifest arrived ahead of its
chunks — wait and try again), and `corrupt` (everything present, everything parseable, and the
checksum disagrees, which is the stale-chunk case the A/B design exists to make detectable).

**Layers 34–36 alongside it.** The quota readout ships with the backup rather than after it, because
it is what decides whether compressing the payload is ever warranted — a number to measure rather
than guess. The edit log landed in its own sync key as the amendment above specified. The export
nudge compares by checksum rather than by count, since the most common drift is a macro *edited*
rather than added or removed, which leaves the total identical; it is tracked in local storage, not
sync, because "when did *this* machine last export" is the question worth answering — a file
exported on the laptop is not on the desktop.

## Amendment, 2026-08-02 — snapshot on danger, not on schedule

The tiered retention this ADR argued for was sized as though snapshots were a general-purpose
history. They are not, and using the thing made that plain: a few minutes of ordinary editing
produced six near-identical full copies of the library.

**The three failures are not alike, and only two of them are this feature's.** A bulk delete and a
bad import are rare, catastrophic and whole-library — snapshots fit them exactly. Undoing a botched
edit while composing a single macro is frequent, cheap, and *per-macro*: restoring the whole library
to recover one macro's text discards everything done since, so this layer cannot serve it however
many copies it keeps. The hourly tier was capturing precisely that third case, which is where the
redundancy came from.

**So the trigger changed rather than the storage.** The earlier draft's answer to "we might miss the
important moment" was to snapshot more often. The better answer is to snapshot at the moments that
are important: immediately before a delete, an import or a restore. Deleting — the most destructive
operation the app offers, and offered over a multi-select — had no forced snapshot at all and relied
on whatever the debounced timer happened to have caught. It has one now, and each forced snapshot
records *why*, so the list reads "before deleting" rather than a fourth identical timestamp.

Retention drops to two recent slots, no hourly tier, and one per day for a week — which covers the
other case worth serving, rolling back after a messy session. Forced snapshots are evicted last in
the byte budget, bounded at five so a run of deletes cannot pin the store open. Eight
change-triggered writes now leave two snapshots rather than eight.

**Compression was built, 2026-08-02.** The deferral below rested on an average of 284 bytes per
macro, which came from a library padded with short test entries. Corrected against the real use
case -- email notification templates -- the picture inverts: those macros run 1,100+ bytes each,
because every HTML macro stores `text` and `html` side by side as near-duplicates, and a slot fills
at roughly **38 of them**. That is an ordinary library, not a distant ceiling.

Measured on distinct template-shaped content, gzip+base64 returns 11-15x, which is optimistic given
the generator's vocabulary; 5-10x is the honest expectation, moving the ceiling to several hundred.
Both objections below were rechecked and did not survive. Legibility costs little, because diagnosis
has consistently come from the *local* copy and the snapshot payloads, which stay uncompressed --
the sync copy is derived from them. And base64's pure-ASCII output makes a chunk's stringified size
exactly its length plus two, so the one part of this system where the quota was unpredictable stops
being so.

The codec is its own module, because a subtly lossy one restores *almost* what was saved and nothing
about that announces itself. It uses the platform's `CompressionStream` rather than a bundled
library: a backup must be decodable by whatever version is installed when someone finally needs it,
possibly after a reinstall, and a bundled compressor is a version to drift. The manifest records the
encoding, so backups written before this keep restoring -- a backup is the one thing that cannot
have a flag day. The checksum stays computed over the macros rather than the bytes, so a decoding
fault lands on the same `corrupt` outcome as a stale chunk and adds no new failure mode.

One defect worth recording: a transform stream rejects on *both* halves, so discarding the write
side left an unhandled rejection on exactly the path whose job is to fail cleanly on a corrupt
payload -- in a service worker, with nobody to catch it.

**The original deferral, kept because the reasoning was sound and the input was not.** On a real
28-macro library: gzip 76% smaller, gzip+base64 — what sync would actually hold — 68% smaller, a
3.1× gain, moving the ceiling from ~157 macros to ~491. Not built, for two reasons. The library sits
at 18% of a slot, so there is no need yet; and the legibility cost stopped being theoretical, since
every bug found in this layer was diagnosed by reading the stored JSON. The trigger is now
observable rather than a guess: revisit when the quota readout passes ~60%. If it is built, use the
native `CompressionStream('gzip')` with base64 — no dependency to drift across a reinstall, and
base64's pure-ASCII output would make chunk sizing deterministic, retiring the adaptive halving that
the stricter-than-documented per-item accounting forced.

One shortcut was considered and rejected: 26% of that payload is the `text` field of HTML macros,
recomputable from `html` via `extractPlainText`, worth ~1.35× at no cost in opacity. But
`macroStorage.ts` already holds the rule — *a backup that reshapes its input is not a backup* —
written after that exact mistake once dropped `updated_at`. If the extractor ever changes, every
restore quietly returns different text.

**Prior art, corrected.** None of the three extensions examined keeps a local version history.
Briskine requires an account and recovers from Firestore; Stylus delegates cross-device to
Dropbox/Drive/WebDAV; AutoTextExpander stores one item per shortcut in sync with no history at all.
This layer has no precedent in the category, which is a reason to keep it small rather than a reason
to drop it — the bulk-delete case is real and unrecoverable without it.

## Amendment, 2026-08-03 — the history becomes a previous state, and recovery becomes one list

Two objections, both from using the thing, and both correct.

**The snapshot history was not a requirement of this kind of tool.** No comparable expander keeps
one. The failure that actually motivated any of this was *the local data is gone*, and the
browser-account backup answers it completely. What snapshots added was recovery from your own
destructive act while local data is intact — real, but rare, and it does not need a browsable
history to serve it.

**And the complexity leaked into the interface.** The Data section had grown two recovery sections,
each with a Restore button, sourced from different storage, with nothing to tell a person in trouble
which they wanted. That is worse than one and arguably worse than none. The list was the defect more
than the storage: a list asks "which one?", which requires a mental model of retention tiers that
nobody should have to hold.

So: **`macro-previous`** — one key, the last two libraries, each written immediately before a delete,
import or restore, and never on an ordinary edit. No tiers, no eviction order, no calendar buckets,
no byte budget, no serialisation queue. About 1,300 lines removed.

Two, not one, because delete-then-import would otherwise lose the pre-delete state to the import.
Explicitly *not* for the reason sync uses two slots: a single-key `chrome.storage.local.set` is
atomic, so there is no torn write to defend against and the second entry buys depth alone.

**Recovery is now one list, and the source is not a category the user reasons about.** Restore points
are gathered from the previous states and the browser-account copy, sorted by time, de-duplicated
between themselves — **never against the current library**, since hiding the backup whenever it
matched what was loaded produced a backup with no visible way to restore from it and no way to check
that it works. A backup you cannot exercise is a promise rather than a fact. Mechanism is hidden;
meaning is not, so "from another device" stays.

**The "back up now" button is gone**, and this reverses something added two days earlier. It existed
because a sync failure had nowhere to surface: everything automatic runs in the service worker, where
a rejection reaches a console nobody has open. But it contradicted the rule beside it — writes that
stay inside the extension are automatic — and a failure you must think to press a button to discover
is worse than one that simply tells you. Every attempt now records its outcome and the settings line
states it.

**What is still not served, deliberately:** undoing a botched edit while composing one macro. That is
per-macro and frequent, the browser's own undo already handles it inside the editor, and replacing
that with a persistent one would mean rebuilding an opaque platform stack to serve the cheapest
failure. An undo/redo over CRUD operations is a better idea than either and is parked rather than
rejected — linear time travel is a far simpler mental model than any list, and it deserves an
interface designed rather than bolted on.

## Amendment, 2026-08-04 — three corrections from review

**Hydration could destroy an unreadable library, and this was measured rather than feared.** A
single truncated value in `macro-storage` made `JSON.parse` throw inside zustand's persist, which
left the store at its seeded defaults -- seven demo macros -- and the next ordinary edit then wrote
those demos straight over the bytes that had failed to parse. A string a person could very likely
have repaired by hand, gone, silently, from one bad byte.

That is the same shape as the bug this ADR was opened about: something that is not the authority
winning, and overwriting what is. It reappeared one layer down, inside the module written to fix it.

The adapter now distinguishes *absent* from *unreadable*. Absent is a first run and still seeds the
samples. Unreadable quarantines the bytes under `macro-storage-unreadable` -- first failure only,
since the earliest is closest to the good data -- and hydrates an **empty** library rather than
null. Empty is what stops the seeded macros being written over the original, and it is also the
honest answer: we do not know what was there, and presenting demos would look like a fresh install
and invite someone to type over their own data. The recovery list still works, so `macro-previous`
and the browser-account copy remain reachable.

**The sensitive checkbox claimed encryption and there is none.** It read "Mark as sensitive
(encrypted)" / "se encripta", while `is_sensitive` is written by the form, persisted, and read by
nothing -- so those macros reach the browser account in plaintext like every other. That is a broken
promise rather than a missing feature, and worse than the gaps around it, because someone marks
their password-adjacent snippets on the strength of it. The word is removed. What the flag should
actually *do* -- most plausibly, exclude those macros from the browser-account copy -- is a product
decision and is deliberately not taken here.

**One retention policy had been applied to four keys, and only two deserved it.** `access` and
`refresh` are bearer tokens for the withdrawn backend. The reasoning that protected them -- removing
a key is a data deletion -- belongs to `macros` and `pendingOps`, which can hold the only surviving
copy of real macro content. It does not extend to credential material for a service that no longer
exists: expired or not, that is a secret kept by accident, and keeping it is a choice rather than
neutrality. They are removed once, at startup, by `legacyCleanup`. The two content keys are still
left alone, for the original reason.

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
