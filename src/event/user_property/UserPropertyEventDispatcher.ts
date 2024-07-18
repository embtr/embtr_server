import { Context } from '@src/general/auth/Context';
import eventBus from '../eventBus';
import { Event } from '../events';

export namespace UserPropertyEventDispatcher {
    export const onMissing = (context: Context, key: string) => {
        const event: Event.UserProperty.Event = new Event.UserProperty.Event(context, key);
        eventBus.emit(Event.UserProperty.Missing, event);
    };

    export const onUpdated = (context: Context, key: string, value?: string) => {
        const event: Event.UserProperty.Event = new Event.UserProperty.Event(context, key, value);
        eventBus.emit(Event.UserProperty.Updated, event);
    };
}
