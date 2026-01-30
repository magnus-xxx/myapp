// REPLACEMENT FOR handleSync function in PlanView.tsx
// Replace lines 215-264 with this code:

const handleSync = async () => {
    console.log('=== UI: Starting Google Calendar Sync ===');
    try {
        // 1. Calculate Date Range for current view
        const now = currentDate; // Use the state 'currentDate'
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        console.log('UI: Sync period:', { start, end });
        console.log('UI: Current date:', currentDate);

        // 2. Fetch from Main Process
        const googleRawEvents = await window.api.calendar.getGoogleEvents(start, end);
        console.log('UI: Raw Google Events received:', googleRawEvents?.length || 0);
        
        if (!googleRawEvents || googleRawEvents.length === 0) {
            console.warn('UI: No events received from Google Calendar');
            alert('Sync complete. No events found for this month.');
            return;
        }

        console.log('UI: First raw event:', JSON.stringify(googleRawEvents[0], null, 2));

        // 3. NORMALIZE DATA (Critical Fix)
        const normalizedEvents = googleRawEvents.map((evt: any, index: number) => {
            console.log(`UI: Normalizing event ${index + 1}/${googleRawEvents.length}:`, evt.title);

            // Validate that we have the required fields
            if (!evt.start_time) {
                console.error('UI: Event missing start_time:', evt);
                return null;
            }

            // The backend already sends start_time and end_time as ISO strings
            // We just need to ensure they're valid
            const startDate = new Date(evt.start_time);
            const endDate = new Date(evt.end_time || evt.start_time);

            if (isNaN(startDate.getTime())) {
                console.error('UI: Invalid start_time:', evt.start_time);
                return null;
            }

            // Ensure end_time is valid, default to start + 1 hour if missing
            let validEndTime = evt.end_time;
            if (!validEndTime || isNaN(endDate.getTime())) {
                const defaultEnd = new Date(startDate);
                defaultEnd.setHours(defaultEnd.getHours() + 1);
                validEndTime = defaultEnd.toISOString();
                console.log('UI: Fixed missing/invalid end_time for:', evt.title);
            }

            const normalized = {
                id: evt.id, // Keep the 'gcal-' prefixed ID
                title: evt.title || '(No title)',
                description: evt.description || '',
                start_time: evt.start_time, // Already ISO string from backend
                end_time: validEndTime,     // Already ISO string from backend
                type: 'event' as const,
                status: evt.status || 'todo' as const,
                priority: evt.priority || 'medium' as const,
                domain: evt.domain || 'work' as const,
                is_all_day: evt.is_all_day || false,
                isSynced: true, // Flag for UI styling
                googleEventId: evt.googleEventId,
                googleCalendarId: evt.googleCalendarId
            };

            console.log(`UI: Normalized event ${index + 1}:`, {
                id: normalized.id,
                title: normalized.title,
                start_time: normalized.start_time,
                end_time: normalized.end_time,
                is_all_day: normalized.is_all_day
            });

            return normalized;
        }).filter((evt): evt is any => evt !== null);

        console.log('UI: Successfully normalized events:', normalizedEvents.length);
        console.log('UI: First normalized event:', JSON.stringify(normalizedEvents[0], null, 2));

        // 4. Merge State (Filter out old Google events to avoid duplicates)
        setItems(prevItems => {
            const localOnly = prevItems.filter(i => !i.isSynced && !i.id?.toString().startsWith('gcal-'));
            const merged = [...localOnly, ...normalizedEvents];
            
            console.log('UI: Merge complete.');
            console.log('  - Local items:', localOnly.length);
            console.log('  - Google items:', normalizedEvents.length);
            console.log('  - Total items:', merged.length);
            console.log('UI: Sample Google item in merged state:', merged.find(i => i.isSynced));
            
            return merged;
        });

        console.log('=== UI: Sync Complete ===');
        alert(`✅ Synced ${normalizedEvents.length} events from Google Calendar!\n\nCheck console for details.`);

    } catch (e) {
        console.error('=== UI: Sync Error ===', e);
        alert('❌ Sync Failed. Check console for details.');
    }
};
