import { logger } from '@src/common/logger/Logger';
import { PlannedDay, PlannedTask, User } from '@resources/schema';
import { Constants } from '@resources/types/constants/constants';
import { Context } from '@src/general/auth/Context';
import { DayKeyUtility } from '@src/utility/date/DayKeyUtility';
import { TimeOfDayUtility } from '@src/utility/TimeOfDayUtility';
import { UserPropertyUtility } from '@src/utility/UserPropertyUtility';
import { PlannedDayService } from '../PlannedDayService';
import { PushNotificationService } from '../PushNotificationService';
import { UserService } from '../UserService';
import { Code } from '@resources/codes';
import { ServiceException } from '@src/general/exception/ServiceException';

export class ReminderService {
    public static async sendDailyReminders(context: Context): Promise<void> {
        const users = await UserService.getUsersWithProperty(
            context,
            Constants.UserPropertyKey.REMINDER_NOTIFICATIONS_SETTING,
            Constants.ReminderNotificationSetting.DAILY
        );

        for (const user of users) {
            const isAwayModeEnabled = UserPropertyUtility.isAwayModeEnabled(user);
            if (isAwayModeEnabled) {
                console.log('skipping notifications, ' + user.username + ' is in away mode');
                continue;
            }

            try {
                await this.sendUserDailyReminder(context, user);
            } catch (e) {
                logger.error('failed to send user daily reminder', e);
            }
        }
    }

    public static async sendPeriodicReminders(context: Context): Promise<void> {
        const users = await UserService.getUsersWithProperty(
            context,
            Constants.UserPropertyKey.REMINDER_NOTIFICATIONS_SETTING,
            Constants.ReminderNotificationSetting.PERIODICALLY
        );

        for (const user of users) {
            const isAwayModeEnabled = UserPropertyUtility.isAwayModeEnabled(user);
            if (isAwayModeEnabled) {
                console.log('skipping notifications, ' + user.username + ' is in away mode');
                continue;
            }

            try {
                await this.sendUserPeriodicReminder(context, user);
            } catch (e) {
                logger.error('failed to send user periodic reminder', e);
            }
        }
    }

    public static async sendDailyWarnings(context: Context) {
        const users = await UserService.getUsersWithProperty(
            context,
            Constants.UserPropertyKey.WARNING_NOTIFICATIONS_SETTING,
            Constants.WarningNotificationSetting.DAILY
        );

        for (const user of users) {
            const isAwayModeEnabled = UserPropertyUtility.isAwayModeEnabled(user);
            if (isAwayModeEnabled) {
                console.log('skipping notifications, ' + user.username + ' is in away mode');
                continue;
            }

            try {
                await this.sendUserDailyWarning(context, user);
            } catch (e) {
                logger.error('failed to send user daily warning', e);
            }
        }
    }

    public static async sendPeriodicWarnings(context: Context): Promise<void> {
        const users = await UserService.getUsersWithProperty(
            context,
            Constants.UserPropertyKey.WARNING_NOTIFICATIONS_SETTING,
            Constants.WarningNotificationSetting.PERIODICALLY
        );

        for (const user of users) {
            const isAwayModeEnabled = UserPropertyUtility.isAwayModeEnabled(user);
            if (isAwayModeEnabled) {
                console.log('skipping notifications, ' + user.username + ' is in away mode');
                continue;
            }

            try {
                await this.sendUserPeriodicWarning(context, user);
            } catch (e) {
                logger.error('failed to send periodic warning', e);
            }
        }
    }

    private static isDailyReminderLocalTime(timezone: string) {
        return TimeOfDayUtility.isHourOfDayForTimezone(10, timezone);
    }

    private static isDailyWarningLocalTime(timezone: string) {
        return TimeOfDayUtility.isHourOfDayForTimezone(16, timezone);
    }

    private static getUserPeriod(timezone: string) {
        const currentTime = new Date();
        const usersHour = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone: timezone,
        }).format(currentTime);

        if (usersHour === '08') {
            return Constants.Period.MORNING;
        }

        if (usersHour === '12') {
            return Constants.Period.AFTERNOON;
        }

        if (usersHour === '16') {
            return Constants.Period.EVENING;
        }

        if (usersHour === '20') {
            return Constants.Period.NIGHT;
        }

        return undefined;
    }

    private static getUserWarningPeriod(timezone: string) {
        const currentTime = new Date();
        const usersHour = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone: timezone,
        }).format(currentTime);

        if (usersHour === '11') {
            return Constants.Period.MORNING;
        }

        if (usersHour === '15') {
            return Constants.Period.AFTERNOON;
        }

        if (usersHour === '19') {
            return Constants.Period.EVENING;
        }

        if (usersHour === '21') {
            return Constants.Period.NIGHT;
        }

        return undefined;
    }

    private static getIncompleteCount(plannedTasks: PlannedTask[]) {
        const totalHabitCount = plannedTasks.length;
        const finshedHabitCount = plannedTasks.filter((task) => {
            if (
                task.status === Constants.CompletionState.FAILED ||
                task.status === Constants.CompletionState.SKIPPED
            ) {
                return true;
            }

            const completed = task.completedQuantity || 0;
            const quantity = task.quantity || 1;

            return completed >= quantity;
        }).length;
        const unfinishedHabitCount = totalHabitCount - finshedHabitCount;

        return unfinishedHabitCount;
    }

    public static async sendUserDailyReminder(context: Context, user: User): Promise<void> {
        if (!user.id) {
            return;
        }

        const timezone = UserPropertyUtility.getProperty(user, Constants.UserPropertyKey.TIMEZONE);
        if (!timezone?.value) {
            return;
        }

        const isDailyReminderLocalTime = this.isDailyReminderLocalTime(timezone.value);
        if (!isDailyReminderLocalTime) {
            return;
        }

        const dayKey = DayKeyUtility.getDayKeyFromTimezone(timezone.value);
        const plannedDay = await this.getFullyPopulatedPlannedDayOrPlaceholder(
            context,
            user,
            dayKey
        );
        const plannedTasks = plannedDay.plannedTasks;
        if (!plannedTasks) {
            return;
        }

        const incompleteCount = this.getIncompleteCount(plannedTasks);
        if (incompleteCount === 0) {
            return;
        }

        const habit = incompleteCount === 1 ? 'habit' : 'habits';
        const message = `You have ${incompleteCount} ${habit} to complete today!`;

        PushNotificationService.sendGenericNotification(context, user, message);
    }

    public static async sendUserPeriodicReminder(context: Context, user: User) {
        if (!user.id) {
            return;
        }

        const timezone = UserPropertyUtility.getProperty(user, Constants.UserPropertyKey.TIMEZONE);
        if (!timezone?.value) {
            return;
        }

        const period = this.getUserPeriod(timezone.value);
        if (!period) {
            return;
        }

        const dayKey = DayKeyUtility.getDayKeyFromTimezone(timezone.value);
        const plannedDay = await this.getFullyPopulatedPlannedDayOrPlaceholder(
            context,
            user,
            dayKey
        );
        if (!plannedDay?.plannedTasks) {
            return;
        }

        const plannedTasks = plannedDay.plannedTasks.filter((task) => {
            return (
                task.timeOfDay?.period === period ||
                task.timeOfDay?.period === undefined ||
                task.timeOfDay.period === Constants.Period.DEFAULT
            );
        });

        if (plannedTasks.length === 0) {
            return;
        }

        const incompleteCount = this.getIncompleteCount(plannedTasks);
        if (incompleteCount === 0) {
            return;
        }

        const periodPretty = TimeOfDayUtility.getPeriodPretty(period);
        const habit = incompleteCount === 1 ? 'habit' : 'habits';
        const message = `You have ${incompleteCount} ${habit} to complete this ${periodPretty}!`;

        PushNotificationService.sendGenericNotification(context, user, message);
    }

    public static async sendUserDailyWarning(context: Context, user: User) {
        if (!user.id) {
            return;
        }

        const timezone = UserPropertyUtility.getProperty(user, Constants.UserPropertyKey.TIMEZONE);
        if (!timezone?.value) {
            return;
        }

        const isDailyWarningLocalTime = this.isDailyWarningLocalTime(timezone.value);
        if (!isDailyWarningLocalTime) {
            return;
        }

        const dayKey = DayKeyUtility.getDayKeyFromTimezone(timezone.value);
        const plannedDay = await this.getFullyPopulatedPlannedDayOrPlaceholder(
            context,
            user,
            dayKey
        );
        const plannedTasks = plannedDay.plannedTasks;
        if (!plannedTasks) {
            return;
        }

        const incompleteCount = this.getIncompleteCount(plannedTasks);
        if (incompleteCount === 0) {
            return;
        }

        const habit = incompleteCount === 1 ? 'habit' : 'habits';
        const message = `Heads up! You have ${incompleteCount} ${habit} remaining today.`;

        PushNotificationService.sendGenericNotification(context, user, message);
    }

    public static async sendUserPeriodicWarning(context: Context, user: User) {
        if (!user.id) {
            return;
        }

        const timezone = UserPropertyUtility.getProperty(user, Constants.UserPropertyKey.TIMEZONE);
        if (!timezone?.value) {
            return;
        }

        const period = this.getUserWarningPeriod(timezone.value);
        if (!period) {
            return;
        }

        const dayKey = DayKeyUtility.getDayKeyFromTimezone(timezone.value);
        const plannedDay = await this.getFullyPopulatedPlannedDayOrPlaceholder(
            context,
            user,
            dayKey
        );
        if (!plannedDay?.plannedTasks) {
            return;
        }

        const plannedTasks = plannedDay.plannedTasks.filter((task) => {
            return (
                task.timeOfDay?.period === period ||
                task.timeOfDay?.period === undefined ||
                task.timeOfDay.period === Constants.Period.DEFAULT
            );
        });

        if (plannedTasks.length === 0) {
            return;
        }

        const incompleteCount = this.getIncompleteCount(plannedTasks);
        if (incompleteCount === 0) {
            return;
        }

        const periodPretty = TimeOfDayUtility.getPeriodPretty(period);
        const habit = incompleteCount === 1 ? 'habit' : 'habits';
        const message = `Heads up! You have ${incompleteCount} ${habit} remaining this ${periodPretty}.`;

        PushNotificationService.sendGenericNotification(context, user, message);
    }

    private static async getFullyPopulatedPlannedDayOrPlaceholder(
        context: Context,
        user: User,
        dayKey: string
    ): Promise<PlannedDay> {
        if (!user.id) {
            throw new ServiceException(404, Code.USER_NOT_FOUND, 'user not found');
        }

        const plannedDay = await PlannedDayService.getFullyPopulatedByUser(
            context,
            user.id,
            dayKey
        );
        if (plannedDay) {
            return plannedDay;
        }

        const plannedDayPlaceholder = await PlannedDayService.getFullyPopulatedPlaceholderByUser(
            context,
            user.id,
            dayKey
        );
        return plannedDayPlaceholder;
    }
}
