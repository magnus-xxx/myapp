// CORRECT handleSync replacement for PlanView.tsx
// The backend sends: start_time, end_time (snake_case)
// The expansion utility expects: start_time, end_time (snake_case)
// DO NOT use: date, startTime, endTime (these are wrong!)

const handleSync = async () => {
    try {
        console.log('=== UI: Starting Google Calendar Sync ===');
        
        // 1. Calculate Range for current month view
        const now = currentDate; // Use state, not new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        console.log('UI: Fetching events for period:', { start, end });

        // 2. Fetch from IPC
        const googleRawEvents = await window.api.calendar.getGoogleEvents(start, end);
        
        if (!googleRawEvents || googleRawEvents.length === 0) {
            console.warn('UI: No events received from Google');
            alert('Sync complete. No events found for this month.');
            return;
        }

        console.log('UI: Received events:', googleRawEvents.length);
        console.log('UI: First raw event from backend:', JSON.stringify(googleRawEvents[0], null, 2));

        // 3. NORMALIZATION - Ensure data matches CalendarItem interface
        const normalizedEvents = googleRawEvents.map((evt: any, index: number) => {
            console.log(`UI: Processing event ${index + 1}: "${evt.title}"`);
            console.log(`  - start_time: ${evt.start_time}`);
            console.log(`  - end_time: ${evt.end_time}`);
            console.log(`  - is_all_day: ${evt.is_all_day}`);

            // Validate start_time exists and is valid
            if (!evt.start_time) {
                console.error(`UI: Event "${evt.title}" missing start_time! Skipping.`);
                return null;
            }

            // Validate it's a valid date
            const startDate = new Date(evt.start_time);
            if (isNaN(startDate.getTime())) {
                console.error(`UI: Event "${evt.title}" has invalid start_time: ${evt.start_time}. Skipping.`);
                return null;
            }

            // Ensure end_time is valid, default to start_time + 1 hour if missing
            let validEndTime = evt.end_time;
            if (!validEndTime) {
                const endDate = new Date(startDate);
                endDate.setHours(endDate.getHours() + 1);
                validEndTime = endDate.toISOString();
                console.log(`  - Fixed missing end_time: ${validEndTime}`);
            }

            // Validate end_time
            const endDate = new Date(validEndTime);
            if (isNaN(endDate.getTime())) {
                const fixedEnd = new Date(startDate);
                fixedEnd.setHours(fixedEnd.getHours() + 1);
                validEndTime = fixedEnd.toISOString();
                console.log(`  - Fixed invalid end_time: ${validEndTime}`);
            }

            // Return normalized event matching CalendarItem interface
            const normalized = {
                id: evt.id, // Already has 'gcal-' prefix from backend
                title: evt.title || '(No Title)',
                description: evt.description || '',
                
                // CRITICAL: Use snake_case fields (start_time, end_time)
                // These are what the expansion utility expects!
                start_time: evt.start_time,  // Keep as ISO string from backend
                end_time: validEndTime,      // Keep as ISO string
                
                type: 'event' as const,
                status: (evt.status || 'todo') as const,
                priority: (evt.priority || 'medium') as const,
                domain: (evt.domain || 'work') as const,
                is_all_day: evt.is_all_day || false,
                
                // Sync metadata
                isSynced: true,
                googleEventId: evt.googleEventId,
                googleCalendarId: evt.googleCalendarId
            };

            console.log(`  ✓ Normalized:`, {
                id: normalized.id,
                title: normalized.title,
                start_time: normalized.start_time,
                end_time: normalized.end_time,
                is_all_day: normalized.is_all_day
            });

            return normalized;
        }).filter((evt): evt is any => evt !== null);

        console.log('UI: Successfully normalized:', normalizedEvents.length, 'events');
        console.log('UI: First normalized event:', JSON.stringify(normalizedEvents[0], null, 2));

        // 4. Merge State - Remove old Google events, add new ones
        setItems(prevItems => {
            // Keep only local items (not synced from Google)
            const localOnly = prevItems.filter(i => {
                const isGoogle = i.isSynced || i.id?.toString().startsWith('gcal-');
                return !isGoogle;
            });
            
            const merged = [...localOnly, ...normalizedEvents];
            
            console.log('UI: Merge complete:');
            console.log(`  - Local items: ${localOnly.length}`);
            console.log(`  - Google items: ${normalizedEvents.length}`);
            console.log(`  - Total: ${merged.length}`);
            
            // Verify a Google item is in the merged array
            const sampleGoogle = merged.find(i => i.isSynced);
            if (sampleGoogle) {
                console.log('  ✓ Sample Google item in state:', {
                    id: sampleGoogle.id,
                    title: sampleGoogle.title,
                    start_time: sampleGoogle.start_time
                });
            } else {
                console.warn('  ⚠ No Google items found in merged state!');
            }
            
            return merged;
        });

        console.log('=== UI: Sync Complete ===');
        alert(`✅ Synced ${normalizedEvents.length} events from Google!\n\nCheck console for details.`);

    } catch (e) {
        console.error('=== UI: Sync Error ===', e);
        console.error('Error details:', e);
        alert('❌ Sync Failed. Check console for details.');
    }
};
