# CalmScroll Home Page - Setup Instructions

## Quick Start

### 1. Apply Database Migration

The new home page requires four new tables: `intentions`, `reminder_settings`, `breath_sessions`, and `notifications`.

**Option A: Using Supabase CLI (Recommended)**

```bash
# Navigate to project root
cd /Users/nawal/calmscroll

# Run the migration
npx supabase migration up

# Or if using Supabase console, copy-paste the SQL from:
supabase/migrations/create_intention_tables.sql
```

**Option B: Using Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Click "New Query"
4. Copy the entire contents of `supabase/migrations/create_intention_tables.sql`
5. Click "Run"
6. Verify all tables created successfully

### 2. Verify Installation

Test that everything is working:

```bash
# Build the project
npm run build

# Start dev server
npm run dev

# Open browser
open http://localhost:3000/home
```

You should see:
- ✅ Page loads without errors
- ✅ Personalized greeting with user's display_name
- ✅ "Your Intention" form
- ✅ Empty intention input field
- ✅ All buttons interactive

### 3. Test Core Features

#### Test Setting an Intention
1. Type "Check my messages" in the intention input
2. Click "Set Intention"
3. See success toast: "Intention set. Stay focused."
4. Form transforms into active intention card
5. Three buttons appear: "Unwind", "Snooze", "Done"

#### Test Unwind Timer
1. Click "Unwind" button
2. Modal slides up with breathing reminder
3. Click "Begin Breathing"
4. 60-second countdown starts
5. Progress ring fills smoothly
6. Timer completes automatically
7. Modal closes
8. See toast: "Nice. Continue your intention."

#### Test Snooze
1. Click "Snooze" button
2. See toast: "Intention snoozed for 5 minutes."
3. Active intention card disappears
4. Form reappears for new intention

#### Test Mark as Done
1. Click "Done" button
2. See toast: "Great job! Intention completed."
3. Card disappears
4. Form reappears

## Configuration

### Reminder Settings

Default reminder settings are created automatically on first fetch:

```typescript
{
  nudges_enabled: true,           // Enable/disable nudges
  nudge_after_seconds: 300,       // 5 minutes (300 seconds)
}
```

Users can customize in Settings page (future enhancement).

## Troubleshooting

### "Cannot find name" Errors During Build

**Problem**: TypeScript errors about undefined tables

**Solution**: Ensure migration was applied successfully
```bash
# Check in Supabase console:
# 1. Navigate to Database
# 2. Look for tables: intentions, reminder_settings, breath_sessions, notifications
# 3. Verify all columns are present
```

### "Please sign in" Error on Intention Form

**Problem**: Can't create intentions

**Solution**:
1. Verify user is authenticated
2. Check `auth.users` table has the user
3. Verify RLS policies are enabled
4. Check browser console for Supabase errors

### Timer Freezes or Doesn't Start

**Problem**: Unwind timer not working

**Solution**:
1. Check browser console for JavaScript errors
2. Verify `createBreathSession` hook is properly imported
3. Try hard refreshing page (Cmd+Shift+R or Ctrl+Shift+R)
4. Check browser's tab is not in background (timers slow down)

### Theme Colors Wrong

**Problem**: Colors look different than expected

**Solution**:
1. Check CSS custom properties are defined:
   ```css
   /* In your theme provider or globals.css */
   --bg-start: #...
   --bg-mid: #...
   --bg-end: #...
   --card: #...
   --ink: #...
   ```
2. Verify Tailwind CSS is properly configured
3. Clear browser cache and rebuild

## Environment Variables

No additional environment variables needed for core functionality.

If adding push notifications later, you'll need:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_key_here
VAPID_PRIVATE_KEY=your_key_here
```

## Architecture Details

### Data Flow

```
Home Page Component
    ├── useIntentions()
    │   ├── Fetch active intention on mount
    │   ├── POST to intentions table
    │   └── UPDATE status (done/snoozed)
    │
    ├── useReminderSettings()
    │   ├── Fetch user's reminder preferences
    │   └── Auto-create defaults if missing
    │
    ├── useHomeData()
    │   ├── Fetch user profile
    │   ├── Fetch daily metrics/progress
    │   ├── Fetch feed items (activities)
    │   └── Fetch favorites
    │
    └── UnwindSheet
        └── useUnwindSession()
            └── POST to breath_sessions table
```

### Database Relationships

```
auth.users
    ├── intentions (user_id FK)
    ├── reminder_settings (user_id FK)
    ├── breath_sessions (user_id FK)
    └── notifications (user_id FK)
        └── intentions (intention_id FK, nullable)
```

## Performance Considerations

### Query Optimization
- Intentions: Indexed on `(user_id, status)` for fast active lookup
- Breath Sessions: Indexed on `user_id` for user-specific queries
- Notifications: Indexed on `user_id` and `sent_at` for timeline

### Frontend Optimization
- memoized favorite set to prevent unnecessary re-renders
- useCallback for event handlers
- Efficient state updates in hooks

### Expected Load Times
- Initial page load: ~200-300ms (with cached assets)
- Intention creation: ~150-200ms
- Unwind session logging: ~100-150ms

## Migration Strategy (If Updating Existing App)

### Step 1: Deploy New Code
```bash
npm run build
# Deploy to staging first
git push staging main
```

### Step 2: Run Database Migration
```bash
npx supabase migration up
# Or manually in Supabase console
```

### Step 3: Verify in Staging
- Test all features in staging environment
- Check for errors in browser console
- Test with multiple user accounts

### Step 4: Deploy to Production
```bash
git push production main
# No additional deployment steps needed
```

### Step 5: Monitor
- Check error logs for issues
- Monitor database performance
- Gather user feedback

## Rollback Plan

If issues occur:

### Option A: Quick Rollback (30 seconds)
1. Revert code: `git revert <commit>`
2. Redeploy: `npm run build && npm start`
3. Home page reverts to previous version
4. Database tables remain (won't hurt anything)

### Option B: Full Rollback (Complete removal)
1. Run in Supabase SQL Editor:
   ```sql
   DROP TABLE IF EXISTS notifications;
   DROP TABLE IF EXISTS breath_sessions;
   DROP TABLE IF EXISTS reminder_settings;
   DROP TABLE IF EXISTS intentions;
   ```
2. Revert code
3. Redeploy

## Support Resources

### Official Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### CalmScroll Specific
- See: `CALMSCROLL_HOME_PAGE_IMPLEMENTATION.md` (full technical guide)
- Component: `/src/components/UnwindSheet.tsx`
- Hooks: `/src/hooks/useIntentions.ts`, `useReminderSettings.ts`, `useUnwindSession.ts`
- Main page: `/src/app/(app)/home/page.tsx`

## Monitoring

### Health Checks

**Daily**:
- [ ] Home page loads without console errors
- [ ] Can set/update intentions
- [ ] Can complete unwind sessions
- [ ] Toasts appear correctly

**Weekly**:
- [ ] Check database query performance
- [ ] Review error logs
- [ ] Check user feedback

### Metrics to Track

```sql
-- Average intention completion rate
SELECT
  COUNT(*) FILTER (WHERE status = 'done') * 100.0 / COUNT(*) as completion_rate
FROM intentions
WHERE created_at > now() - INTERVAL '7 days';

-- Popular unwind times
SELECT DATE_TRUNC('hour', created_at) as hour, COUNT(*) as sessions
FROM breath_sessions
WHERE created_at > now() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at);

-- Reminder settings distribution
SELECT
  nudges_enabled,
  COUNT(*) as users
FROM reminder_settings
GROUP BY nudges_enabled;
```

## Next Steps

After successful deployment:

1. **Notify Users** - Let them know about the new intention feature
2. **Onboarding** - Consider adding a tutorial for the intention flow
3. **Analytics** - Start tracking which features are most used
4. **Feedback** - Gather user feedback for improvements
5. **Enhancement** - Plan next features (push notifications, reminders, etc.)

## Support Contact

For issues or questions:
1. Check troubleshooting section above
2. Review implementation guide: `CALMSCROLL_HOME_PAGE_IMPLEMENTATION.md`
3. Check browser console for error messages
4. Review database RLS policies in Supabase console

---

**Setup Time**: ~10 minutes (migration + verification)
**Difficulty**: Easy
**Risk Level**: Low (backward compatible)
