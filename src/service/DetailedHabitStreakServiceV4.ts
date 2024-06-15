import { PureDate } from '@resources/types/date/PureDate';
import { HabitStreak, HabitStreakResult } from '@resources/types/dto/HabitStreak';
import { Context } from '@src/general/auth/Context';
import { PlannedDayService } from './PlannedDayService';
import { DayKeyUtility } from '@src/utility/date/DayKeyUtility';
import { PlannedDay, ScheduledHabit } from '@resources/schema';
import { Constants } from '@resources/types/constants/constants';
import { UserPropertyService } from './UserPropertyService';
import { PlannedDayCommonService } from './common/PlannedDayCommonService';
import { ScheduledHabitService } from './ScheduledHabitService';
import { HabitStreakEventDispatcher } from '@src/event/habit_streak/HabitStreakEventDispatcher';
import { DateUtility } from '@src/utility/date/DateUtility';
import { HabitStreakService } from './HabitStreakService';

// "comment" - stronkbad - 2024-03-13

export class DetailedHabitStreakServiceV4 {
    public static async getAdvanced(context: Context, userId: number): Promise<HabitStreak> {
        const days = 209;

        const habitStreak = await this.getForDays(context, userId, days);
        return habitStreak;
    }

    public static async getBasic(context: Context, userId: number): Promise<HabitStreak> {
        const days = 30;

        const habitStreak = await this.getForDays(context, userId, days);
        return habitStreak;
    }

    public static async get(context: Context, userId: number, days: number): Promise<HabitStreak> {
        const habitStreak = await this.getForDays(context, userId, days);

        return habitStreak;
    }

    private static async getForDays(
        context: Context,
        userId: number,
        days: number
    ): Promise<HabitStreak> {
        const endDate = await this.getEndDateForUser(context, userId);

        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - days);

        const medianDate = new Date(endDate);
        medianDate.setDate(endDate.getDate() - Math.floor(days / 2));

        HabitStreakEventDispatcher.onRefresh(context, userId);

        // 1. get streak constants, schedules and plannedDays
        const [currentHabitStreak, lonestHabitStreak, plannedDays, scheduledHabits] =
            await Promise.all([
                this.getCurrentHabitStreak(context, userId),
                this.getLongestHabitStreak(context, userId),
                PlannedDayService.getAllInDateRange(context, userId, startDate, endDate),
                ScheduledHabitService.getAllForUserInDateRange(
                    context,
                    userId,
                    PureDate.fromDateOnServer(startDate),
                    PureDate.fromDateOnServer(endDate)
                ),
            ]);

        // 2. calculate the data for the habit graph
        const habitStreakResults: HabitStreakResult[] = await this.getHabitStreak(
            startDate,
            endDate,
            scheduledHabits,
            plannedDays
        );

        // 3. send it on back
        const habitStreak: HabitStreak = {
            startDate: PureDate.fromDateOnServer(startDate),
            medianDate: PureDate.fromDateOnServer(medianDate),
            endDate: PureDate.fromDateOnServer(endDate),

            currentStreak: currentHabitStreak,
            longestStreak: lonestHabitStreak,
            streakRank: 0,
            results: habitStreakResults,
        };

        return habitStreak;
    }

    private static async getEndDateForUser(context: Context, userId: number) {
        const earliestPossibleEndDate = this.getLastCompletedDayInAllTimezones();
        const latestPossibleEndDate = this.getFirstCompletedDayInAllTimezones();

        const allDates = DateUtility.getAllDatesInBetween(
            earliestPossibleEndDate,
            latestPossibleEndDate
        );
        allDates.reverse();

        let currentDate = earliestPossibleEndDate;
        for (const date of allDates) {
            const dayKey = DayKeyUtility.getDayKey(date);
            const plannedDayExists = await PlannedDayService.exists(context, userId, dayKey);
            if (!plannedDayExists) {
                continue;
            }

            const completionStatus = await PlannedDayService.getCompletionStatus(
                context,
                userId,
                dayKey
            );

            if (
                completionStatus === Constants.CompletionState.COMPLETE ||
                completionStatus === Constants.CompletionState.NO_SCHEDULE ||
                completionStatus === Constants.CompletionState.FAILED
            ) {
                currentDate = date;
                break;
            }
        }

        return currentDate;
    }

    private static getLastCompletedDayInAllTimezones(): Date {
        const currentDate = new Date();
        const utc12Offset = -12 * 60; // UTC-12 offset in minutes
        const utc12Time = currentDate.getTime() + utc12Offset * 60 * 1000;
        const utc12Date = new Date(utc12Time);

        utc12Date.setDate(utc12Date.getDate() - 1);
        utc12Date.setUTCHours(0, 0, 0, 0);

        return utc12Date;
    }

    private static getFirstCompletedDayInAllTimezones(): Date {
        const currentDate = new Date();
        const utc14Offset = 14 * 60; // UTC-14 offset in minutes
        const utc14Time = currentDate.getTime() + utc14Offset * 60 * 1000;
        const utc14Date = new Date(utc14Time);

        utc14Date.setDate(utc14Date.getDate());
        utc14Date.setUTCHours(0, 0, 0, 0);

        return utc14Date;
    }

    private static async getHabitStreak(
        startDate: Date,
        endDate: Date,
        scheduledHabits: ScheduledHabit[],
        plannedDays: PlannedDay[]
    ) {
        const habitStreakResult: HabitStreakResult[] = [];
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const plannedDay = plannedDays.find(
                (plannedDay) => plannedDay.date?.toDateString() === date.toDateString()
            );

            const dayKey = DayKeyUtility.getDayKey(date);
            const completionState = this.getCompletionStateForPlannedDay(
                scheduledHabits,
                date,
                plannedDay
            );

            habitStreakResult.push({
                dayKey: dayKey,
                result: completionState,
            });
        }

        return habitStreakResult;
    }

    private static async getCurrentHabitStreak(context: Context, userId: number): Promise<number> {
        const currentStreak = await HabitStreakService.get(
            context,
            userId,
            Constants.HabitStreakType.CURRENT
        );
        return currentStreak?.streak ?? 0;
    }

    private static async getLongestHabitStreak(context: Context, userId: number): Promise<number> {
        const longestStreak = await HabitStreakService.get(
            context,
            userId,
            Constants.HabitStreakType.LONGEST
        );
        return longestStreak?.streak ?? 0;
    }

    private static getCompletionStateForPlannedDay(
        scheduledHabits: ScheduledHabit[],
        date: Date,
        plannedDay?: PlannedDay
    ) {
        if (plannedDay?.status) {
            return Constants.getCompletionState(plannedDay.status);
        }

        // at this point we do not have a planned day, so if we have *any* scheduled habit, we have failed
        const scheduledHabitCount = PlannedDayCommonService.getScheduledActiveHabitCount(
            scheduledHabits,
            date
        );

        if (scheduledHabitCount > 0) {
            return Constants.CompletionState.FAILED;
        }

        return Constants.CompletionState.NO_SCHEDULE;
    }
}