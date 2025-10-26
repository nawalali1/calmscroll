# CalmScroll Home Page - Architecture Diagram

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CALMSCROLL HOME PAGE                         │
│                  (src/app/(app)/home/page.tsx)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   useUser()      │ │ useIntentions()  │ │useReminder       │
│                  │ │                  │ │Settings()        │
│ • User profile   │ │ • Active         │ │                  │
│ • Display name   │ │   intention      │ │ • Notification   │
│ • Auth state     │ │ • CRUD ops       │ │   preferences    │
│                  │ │ • Status mgmt    │ │ • Auto-defaults  │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │  useUnwindSession()  │
                    │                      │
                    │ • Log breath session │
                    │ • Track duration     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  UnwindSheet         │
                    │  (Component)         │
                    │                      │
                    │ • 60s timer          │
                    │ • Progress animation │
                    │ • Start/Pause/Resume │
                    └──────────────────────┘
```

---

## Database Schema & Relationships

```
┌──────────────────────────────────────────────────────────┐
│                    auth.users                            │
│  (Supabase Authentication)                               │
│  id | email | created_at | ...                           │
└────────────┬──────────────────────┬──────────────┬───────┘
             │                      │              │
    ┌────────▼─────────┐   ┌───────▼──────┐  ┌───▼──────────┐
    │ profiles (FK)    │   │ intentions   │  │ reminder_    │
    │                  │   │   (FK)       │  │ settings(FK) │
    │ id               │   │              │  │              │
    │ display_name     │   │ id           │  │ id           │
    │ photo_url        │   │ user_id (FK) │  │ user_id(FK)  │
    │ avatar_url       │   │ text         │  │ nudges_      │
    │ theme            │   │ status       │  │ enabled      │
    │ created_at       │   │ snooze_until │  │ nudge_after_ │
    │ updated_at       │   │ created_at   │  │ seconds      │
    └──────────────────┘   │ updated_at   │  │ created_at   │
                           └───────┬──────┘  │ updated_at   │
                                   │         └──────────────┘
                                   │
                           ┌───────▼──────────┐
                           │ notifications   │
                           │   (FK ref)      │
                           │                 │
                           │ id              │
                           │ user_id (FK)    │
                           │ intention_id(FK)│
                           │ title           │
                           │ body            │
                           │ sent_at         │
                           │ clicked_at      │
                           │ created_at      │
                           └─────────────────┘

    ┌──────────────────────────────────────┐
    │  breath_sessions (FK to auth.users)  │
    │                                      │
    │  id                                  │
    │  user_id (FK)                        │
    │  duration_seconds                    │
    │  completed                           │
    │  started_at                          │
    │  completed_at                        │
    │  created_at                          │
    └──────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   USER INTERACTION                          │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │  Set Intention               │
    │  Input: "Check emails"       │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │  useIntentions()             │
    │  .createIntention()          │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────────────────┐
    │  Supabase INSERT/UPDATE                  │
    │  intentions table                        │
    │  SET status='active'                     │
    │  WHERE user_id=current_user AND          │
    │        status='active'                   │
    │  MARK prev AS 'done'                     │
    └──────────┬───────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │  Active Intention Card       │
    │  displayed in UI             │
    │  Shows: "Check emails"       │
    │  Buttons: Unwind|Snooze|Done │
    └──────────┬───────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    ┌────────┐   ┌──────────┐
    │ Unwind │   │ Snooze   │
    │Button  │   │ Button   │
    └───┬────┘   └──────┬───┘
        │               │
        ▼               ▼
    ┌────────────┐  ┌───────────────┐
    │ Unwind     │  │ UPDATE        │
    │Sheet Modal │  │ intentions    │
    │Opens       │  │ SET status=   │
    │            │  │ 'snoozed'     │
    │60s Timer   │  └───────┬───────┘
    │Animates    │          │
    │            │          ▼
    │User clicks │  ┌──────────────┐
    │"Start"     │  │ Form resets  │
    │            │  │ Ready for new│
    │Timer runs  │  └──────────────┘
    │down        │
    │            │
    │Complete    │
    │at 00:00    │
    │            │
    └──────┬─────┘
           │
           ▼
    ┌──────────────────────┐
    │ useUnwindSession()   │
    │ .createBreathSession │
    │ (60, true)           │
    └──────┬───────────────┘
           │
           ▼
    ┌──────────────────────────┐
    │ INSERT breath_sessions   │
    │ user_id, duration: 60    │
    │ completed: true          │
    │ completed_at: now()      │
    └──────┬───────────────────┘
           │
           ▼
    ┌──────────────────────────┐
    │ Toast: "Nice. Continue   │
    │ your intention."         │
    └──────────────────────────┘
```

---

## Component Hierarchy

```
HomePage
├─ useUser
│  └─ Fetch user profile
│
├─ useIntentions
│  ├─ Fetch active intention
│  ├─ Create intention
│  ├─ Mark as done
│  ├─ Snooze intention
│  └─ Refetch data
│
├─ useReminderSettings
│  ├─ Fetch settings
│  ├─ Update settings
│  └─ Refetch data
│
├─ useUnwindSession
│  └─ Create breath session
│
├─ GradientHeader
│  ├─ Welcome greeting
│  └─ User profile section
│
├─ DailyProgressRing
│  ├─ SVG circle animation
│  ├─ Progress percentage
│  └─ "TODAY" label
│
├─ StreakCounter
│  ├─ Flame icon
│  └─ Days display
│
├─ CheckInsCounter
│  ├─ Check icon
│  └─ Count display
│
├─ QuickActions
│  ├─ Breathe pill button
│  ├─ Reflect pill button
│  └─ Stretch pill button
│
├─ IntentionForm
│  ├─ Text input field
│  └─ Set button
│
├─ ActiveIntentionCard
│  ├─ Intention text display
│  ├─ Unwind button
│  ├─ Snooze button
│  └─ Done button
│
├─ TodaysFocusSection
│  ├─ Title
│  └─ Placeholder
│
├─ UnwindSheet
│  ├─ Modal backdrop
│  ├─ Header
│  ├─ SVG progress circle
│  ├─ Timer display (MM:SS)
│  ├─ Intention reminder
│  ├─ Start button
│  ├─ Pause button
│  ├─ Resume button
│  └─ Cancel button
│
├─ ToastNotification
│  ├─ Success variant (green)
│  └─ Error variant (red)
│
└─ BottomNav
   └─ Navigation links
```

---

## State Management Flow

```
┌──────────────────────────────────────────────────────┐
│           HomePage Component State                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│ router                - Next.js router              │
│ searchParams          - URL query params            │
│                                                      │
│ showUnwindSheet       - Modal open/close            │
│ intentionInput        - Form input value            │
│ toast                 - Toast notification          │
│                                                      │
│ user                  - Current user profile        │
│ userLoading           - Loading state for user      │
│                                                      │
│ intention             - Current active intention   │
│ intentionLoading      - Loading state               │
│ intentionError        - Error message               │
│                                                      │
│ settingsLoading       - Loading state               │
│                                                      │
└──────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    ┌────────┐  ┌─────────────┐  ┌──────────┐
    │ Form   │  │ Intention   │  │ Unwind   │
    │ state  │  │ data        │  │ modal    │
    └────────┘  └─────────────┘  └──────────┘
```

---

## Event Handler Flow

```
User Action
    │
    ├─ handleCreateIntention()
    │  ├─ Validate input
    │  ├─ Call createIntention()
    │  ├─ Update form state
    │  └─ Show toast
    │
    ├─ handleMarkAsDone()
    │  ├─ Call markAsDone()
    │  ├─ Clear intention state
    │  └─ Show success toast
    │
    ├─ handleSnooze()
    │  ├─ Call snoozeIntention()
    │  ├─ Update intention status
    │  └─ Show toast
    │
    ├─ handleUnwindComplete()
    │  ├─ Call createBreathSession()
    │  ├─ Close modal
    │  └─ Show completion toast
    │
    └─ showToast()
       ├─ Set toast state
       ├─ Auto-dismiss after 3s
       └─ Clear toast
```

---

## API Request Sequence

```
Client                          Supabase
│                               │
├─ GET /auth/session ──────────>│
│<────── auth session ───────────┤
│                               │
├─ GET profiles ───────────────>│
│  WHERE id = user_id           │
│<────── user profile ──────────┤
│                               │
├─ GET intentions ─────────────>│
│  WHERE user_id = ? AND        │
│        status = 'active'      │
│<────── intention ─────────────┤
│                               │
├─ GET reminder_settings ──────>│
│  WHERE user_id = ?            │
│<────── settings ──────────────┤
│                               │
├─ POST intentions ────────────>│
│  {text, status, created_at}   │
│<────── inserted row ──────────┤
│                               │
├─ INSERT breath_sessions ─────>│
│  {user_id, duration, ...}     │
│<────── inserted row ──────────┤
│                               │
└─ UPDATE intentions ──────────>│
   {status='done/snoozed'}      │
<────── updated row ────────────┤
```

---

## Security Layer (RLS)

```
┌─────────────────────────────────────────┐
│         RLS Policy Check                │
├─────────────────────────────────────────┤
│                                         │
│  SELECT * FROM intentions              │
│  WHERE auth.uid() = user_id            │
│                                         │
│  INSERT INTO intentions                │
│  WITH CHECK auth.uid() = user_id       │
│                                         │
│  UPDATE intentions                     │
│  WHERE auth.uid() = user_id            │
│  WITH CHECK auth.uid() = user_id       │
│                                         │
│  DELETE FROM intentions                │
│  WHERE auth.uid() = user_id            │
│                                         │
│  (Same for all other tables)            │
│                                         │
└─────────────────────────────────────────┘
        │
        ▼
    Allow/Deny
    Query Result
```

---

## Animation Sequence

```
Page Load
│
├─ Fade in backdrop (0ms)
│
├─ Greeting slide in (delay: 100ms)
│
├─ Progress ring scale in (delay: 200ms)
│
├─ Streak/Checkins fade in (delay: 300ms)
│
├─ Quick actions fade in (delay: 400ms)
│
├─ Intention section fade in (delay: 500ms)
│
└─ Today's Focus section fade in (delay: 600ms)


When Unwind is clicked:
│
├─ Modal slides up from bottom (300ms)
│
├─ Backdrop fades in
│
├─ On timer start:
│  ├─ Progress circle animates (60 seconds, linear)
│  └─ Timer numbers update (1 second intervals)
│
└─ On completion:
   └─ Modal slides down (300ms)
```

---

## Error Handling Flow

```
Async Operation
    │
    ├─ Try Block
    │  ├─ Execute operation
    │  └─ Update state
    │
    └─ Catch Block
       ├─ Log error
       ├─ Set error state
       ├─ Show error toast
       └─ Display retry button
           │
           └─ User clicks retry
              └─ Refetch data
```

---

## Performance Optimization

```
Component Rendering
│
├─ Memoized state
│  └─ useCallback for handlers
│
├─ Lazy loaded components
│  └─ UnwindSheet modal only renders when open
│
├─ Efficient database queries
│  ├─ Single query for active intention
│  ├─ Indexed user_id and status
│  └─ One-to-one relationships
│
└─ Optimized animations
   ├─ CSS transforms (GPU accelerated)
   ├─ Will-change hints
   └─ Respect prefers-reduced-motion
```

---

This architecture ensures:
- ✅ Clean separation of concerns
- ✅ Reusable hooks
- ✅ Type-safe data flow
- ✅ Secure database access
- ✅ Smooth animations
- ✅ Robust error handling
