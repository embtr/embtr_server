import eventBus from '../eventBus';
import { Event } from '../events';
import { UserPropertyEventHandler } from './UserPropertyEventHandler';

eventBus.on(Event.UserProperty.Missing, async (event: Event.UserProperty.Event) => {
    try {
        await UserPropertyEventHandler.onMissing(event);
    } catch (e) {
        console.error('Error updating planned day completion status', e);
    }
});
