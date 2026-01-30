const handleSync = async () => {
    try {
        console.log('=== UI: Starting Google Calendar Sync ===');
        
        // 1. Calculate Date Range (Current Month)
        const now = currentDate;
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        console.log('UI: Fetching events for:', { start, end });

        // 2. Fetch Raw Data from Backend
        const googleRawEvents = await window.api.calendar.getGoogleEvents(start, end);
        console.log('UI: Received Raw Events:', googleRawEvents);
        console.log('UI: Number of events:', googleRawEvents?.length || 0);

        if (!googleRawEvents || googleRawEvents.length === 0) {
            alert('No events found for this period.');
            return;
        }

        // Log first raw event to see structure
        if (googleRawEvents.length > 0) {
            console.log('UI: First RAW event structure:', JSON.stringify(googleRawEvents[0], null, 2));
        }

        // 3. MAP DATA (Frontend Logic)
        const normalizedEvents = googleRawEvents.map((evt: any) => {
            console.log(`UI: Processing event ID: ${evt.id}, summary: ${evt.summary}`);
            
            // A. Handle Title
            const title = evt.summary || '(No Title)';
            
            // B. Handle Time & Date
            const startData = evt.start || {};
            const endData = evt.end || {};

            let start_time_iso = "";
            let end_time_iso = "";
            let isAllDay = true;

            console.log(`UI: Event "${title}" - startData:`, startData, 'endData:', endData);

            if (startData.dateTime) {
                // TIMED EVENT
                isAllDay = false;
                const startObj = new Date(startData.dateTime);
                const endObj = new Date(endData.dateTime || startData.dateTime);

                start_time_iso = startObj.toISOString();
                end_time_iso = endObj.toISOString();

                console.log(`UI: Timed event - start_time: ${start_time_iso}, end_time: ${end_time_iso}`);

            } else if (startData.date) {
                // ALL-DAY EVENT
                isAllDay = true;
                const parts = startData.date.split('-');
                const localDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                start_time_iso = localDate.toISOString();
                
                const endLocalDate = new Date(localDate);
                endLocalDate.setHours(23, 59, 59);
                end_time_iso = endLocalDate.toISOString();

                console.log(`UI: All-day event - start_time: ${start_time_iso}, end_time: ${end_time_iso}`);
            } else {
                console.error(`UI: Event "${title}" has no valid start time!`, evt);
                return null;
            }

            // C. Return Magnus Item Structure (ONLY CalendarItem fields!)
            const item = {
                id: `gcal-${evt.id}`,
                title: title,
                description: evt.description || '',
                
                // CRITICAL: Use ONLY fields from CalendarItem interface
                start_time: start_time_iso,
                end_time: end_time_iso,
                is_all_day: isAllDay,
                
                type: 'event' as const,
                status: 'todo' as const,
                priority: 'medium' as const,
                domain: 'work' as const,
                
                isSynced: true,
                googleEventId: evt.id,
                googleCalendarId: 'primary'
            };

            console.log(`UI: Normalized item:`, item);
            return item;
        }).filter((item): item is CalendarItem => item !== null);

        console.log('UI: Total normalized events:', normalizedEvents.length);
        if (normalizedEvents.length > 0) {
            console.log('UI: First normalized event:', JSON.stringify(normalizedEvents[0], null, 2));
        }

        // 4. Update State
        setItems(prev => {
            const clean = prev.filter(i => !i.isSynced && !i.id?.toString().startsWith('gcal-'));
            const merged = [...clean, ...normalizedEvents];
            
            console.log(`UI: State merge - Local: ${clean.length}, Google: ${normalizedEvents.length}, Total: ${merged.length}`);
            console.log('UI: Merged items:', merged);
            
            return merged;
        });

        alert(`✅ Synced ${normalizedEvents.length} events from Google Calendar!\n\nCheck console for details.`);

    } catch (e) {
        console.error('=== UI: Sync Error ===', e);
        alert('❌ Sync Failed. Check console for details.');
    }
};
