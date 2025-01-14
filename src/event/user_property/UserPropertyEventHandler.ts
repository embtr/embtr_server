import { Constants } from '@resources/types/constants/constants';

import { Event } from '../events';

export class UserPropertyEventHandler {
    private static activeOnMissingEvents = new Set<string>();
    private static activeOnUpdatedEvents = new Set<string>();

    public static async onMissing(event: Event.UserProperty.Event) { }
}
