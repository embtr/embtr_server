import { Interactable } from './types/interactable/Interactable';
export const ACCOUNT = '/account/';
export const ACCOUNT_SEND_EMAIL_VERIFICATION_ENDPOINT = `${ACCOUNT}send_verification_email/`;

export const USER = '/user/';
export const TASK = '/task/';
export const PLANNED_DAY = '/planned-day/';
export const PLANNED_TASK = '/planned-task/';
export const PLANNED_DAY_RESULT = '/planned-day-result/';
export const USER_POST = '/user-post/';
export const NOTIFICATION = '/notification/';
export const DAILY_HISTORY = '/daily-history/';
export const QUOTE_OF_THE_DAY = '/quote-of-the-day/';
export const CHALLENGE = '/challenge/';
export const FEATURED_POST = '/featured-post/';

export const getInteractableEndpoint = (interactable: Interactable) => {
  switch (interactable) {
    case Interactable.USER_POST:
      return USER_POST;
    case Interactable.PLANNED_DAY_RESULT:
      return PLANNED_DAY_RESULT;
    case Interactable.QUOTE_OF_THE_DAY:
      return QUOTE_OF_THE_DAY;
    case Interactable.CHALLENGE:
      return CHALLENGE;
    case Interactable.FEATURED_POST:
      return FEATURED_POST;

    default:
      return undefined;
  }
};

export const getLocalizedEndpoint = (url: string) => {
  return url.substring(url.indexOf('/'));
};
