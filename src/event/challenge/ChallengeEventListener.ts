import { logger } from '@src/common/logger/Logger';
import eventBus from '../eventBus';
import { Event } from '../events';
import { ChallengeEventHandler } from './ChallengeEventHandler';

eventBus.on(Event.Challenge.Joined, (event: Event.Challenge.Event) => {
    try {
        logger.info('Challenge event received', Event.Challenge.Joined, event);
        ChallengeEventHandler.onJoined(event);
    } catch (e) {
        console.error('error in', Event.Challenge.Joined, e);
    }
});

eventBus.on(Event.Challenge.Left, (event: Event.Challenge.Event) => {
    try {
        logger.info('Challenge event received', Event.Challenge.Left, event);
        ChallengeEventHandler.onLeft(event);
    } catch (e) {
        console.error('error in', Event.Challenge.Left, e);
    }
});