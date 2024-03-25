import { Context } from '@src/general/auth/Context';
import eventBus from '../eventBus';
import { Event } from '../events';

export namespace UserPropertyEventDispatcher {
    export const onMissing = (context: Context, key: string) => {
        const type: Event.UserProperty.Event = {
            context,
            key,
        };

        eventBus.emit(Event.UserProperty.Missing, type);
    };
}
