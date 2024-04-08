import { Challenge, ScheduledHabit, TimeOfDay } from '@resources/schema';
import { ModelConverter } from '@src/utility/model_conversion/ModelConverter';
import { Context } from '@src/general/auth/Context';
import { HabitSummary } from '@resources/types/habit/Habit';
import { PureDate } from '@resources/types/date/PureDate';
import { ScheduledHabitSummaryProvider } from '@src/provider/ScheduledHabitSummaryProvider';
import { ScheduledHabitDao } from '@src/database/ScheduledHabitDao';
import { ServiceException } from '@src/general/exception/ServiceException';
import { Code } from '@resources/codes';
import { DayKeyUtility } from '@src/utility/date/DayKeyUtility';
import { PlannedDayDao } from '@src/database/PlannedDayDao';
import { DateUtility } from '@src/utility/date/DateUtility';
import { PlannedHabitService } from './PlannedHabitService';
import { HttpCode } from '@src/common/RequestResponses';

export class ScheduledHabitService {
    public static async createOrUpdate(
        context: Context,
        scheduledHabit: ScheduledHabit
    ): Promise<ScheduledHabit> {
        if (scheduledHabit.id) {
            return this.update(context, scheduledHabit);
        }

        return this.create(context, scheduledHabit);
    }

    public static async createFromChallenge(context: Context, challenge: Challenge): Promise<ScheduledHabit[]> {
        const scheduledHabits: ScheduledHabit[] = [];

        for (const requirement of challenge.challengeRequirements ?? []) {
            const task = requirement.task;

            if (!task?.id) {
                throw new ServiceException(HttpCode.RESOURCE_NOT_FOUND, Code.RESOURCE_NOT_FOUND, "failure creating scheduledHabit from challenge");
            }

            const defaultTimeOfDay: TimeOfDay = {
                id: 5
            };

            const scheduledHabit: ScheduledHabit = {
                taskId: task?.id,
                detailsEnabled: false,
                daysOfWeekEnabled: false,
                timesOfDayEnabled: false,
                timesOfDay: [defaultTimeOfDay],
                startDate: challenge.start,
                endDate: challenge.end,
            }

            const createdScheduledHabit = await this.create(context, scheduledHabit);
            scheduledHabits.push(createdScheduledHabit);
        }

        return scheduledHabits;
    }

    public static async create(
        context: Context,
        scheduledHabit: ScheduledHabit
    ): Promise<ScheduledHabit> {
        const createdScheduledHabit = await ScheduledHabitDao.create(
            context.userId,
            scheduledHabit
        );

        const createdScheduledHabitModel: ScheduledHabit =
            ModelConverter.convert(createdScheduledHabit);
        return createdScheduledHabitModel;
    }

    public static async update(
        context: Context,
        scheduledHabit: ScheduledHabit
    ): Promise<ScheduledHabit> {
        if (!scheduledHabit.id) {
            throw new ServiceException(400, Code.INVALID_REQUEST, 'invalid request');
        }

        const existingScheduledHabit = await ScheduledHabitDao.get(scheduledHabit.id);
        if (!existingScheduledHabit) {
            throw new ServiceException(
                404,
                Code.SCHEDULED_HABIT_NOT_FOUND,
                'scheduled habit not found'
            );
        }

        const existingScheduledHabitModel: ScheduledHabit =
            ModelConverter.convert(existingScheduledHabit);

        const clientDayKey = context.dayKey;
        const clientDayKeyDate = DateUtility.getDate(clientDayKey);

        const isModified = await PlannedHabitService.existsByDayKeyAndScheduledHabitId(
            context,
            context.dayKey,
            scheduledHabit.id
        );

        let endDate = DateUtility.getDayBefore(clientDayKeyDate);
        let newStartDate = clientDayKeyDate;
        if (isModified) {
            endDate = clientDayKeyDate;
            newStartDate = DateUtility.getDayAfter(clientDayKeyDate);
        }

        // 1. set end date on current scheduled habit
        existingScheduledHabitModel.endDate = endDate;

        // 2. create new scheduled habit with updated values and dates
        const updatedScheduledHabitModal: ScheduledHabit = {
            ...existingScheduledHabitModel,
            ...scheduledHabit,
        };
        updatedScheduledHabitModal.startDate = newStartDate;
        updatedScheduledHabitModal.endDate = undefined;

        const promises = [
            ScheduledHabitDao.update(context.userId, existingScheduledHabitModel),
            ScheduledHabitDao.create(context.userId, updatedScheduledHabitModal),
        ];

        const [_, updatedScheduledHabit] = await Promise.all(promises);

        const updatedScheduledHabitModel: ScheduledHabit =
            ModelConverter.convert(updatedScheduledHabit);

        return updatedScheduledHabitModel;
    }

    public static async replace(
        context: Context,
        scheduledHabit: ScheduledHabit
    ): Promise<ScheduledHabit> {
        const updatedScheduledHabit = this.update(context, scheduledHabit);
        return updatedScheduledHabit;
    }

    public static async getAllByHabit(
        context: Context,
        habitId: number
    ): Promise<ScheduledHabit[]> {
        const scheduledHabits = await ScheduledHabitDao.getAllByHabitIdAndUserId(
            habitId,
            context.userId
        );
        if (!scheduledHabits) {
            throw new ServiceException(
                404,
                Code.SCHEDULED_HABIT_NOT_FOUND,
                'scheduled habit not found'
            );
        }

        const scheduledHabitModels: ScheduledHabit[] = ModelConverter.convertAll(scheduledHabits);
        return scheduledHabitModels;
    }

    public static async get(context: Context, id: number): Promise<ScheduledHabit> {
        const scheduledHabit = await ScheduledHabitDao.get(id);
        if (!scheduledHabit) {
            throw new ServiceException(
                404,
                Code.SCHEDULED_HABIT_NOT_FOUND,
                'scheduled habit not found'
            );
        }

        const scheduledHabitModel: ScheduledHabit = ModelConverter.convert(scheduledHabit);
        return scheduledHabitModel;
    }

    public static async getRecent(userId: number): Promise<ScheduledHabit[]> {
        const scheduledHabits = await ScheduledHabitDao.getRecent(userId);
        if (!scheduledHabits) {
            return [];
        }

        const scheduledHabitModels: ScheduledHabit[] = ModelConverter.convertAll(scheduledHabits);
        return scheduledHabitModels;
    }

    public static async getPast(context: Context, date: PureDate): Promise<ScheduledHabit[]> {
        const scheduledHabits = await ScheduledHabitDao.getPast(context.userId, date);
        if (!scheduledHabits) {
            return [];
        }

        const scheduledHabitModels: ScheduledHabit[] = ModelConverter.convertAll(scheduledHabits);
        return scheduledHabitModels;
    }

    public static async getActive(context: Context, date: PureDate): Promise<ScheduledHabit[]> {
        const scheduledHabits = await ScheduledHabitDao.getActive(context.userId, date);
        if (!scheduledHabits) {
            return [];
        }

        const scheduledHabitModels: ScheduledHabit[] = ModelConverter.convertAll(scheduledHabits);
        return scheduledHabitModels;
    }

    public static async getFuture(context: Context, date: PureDate): Promise<ScheduledHabit[]> {
        const scheduledHabits = await ScheduledHabitDao.getFuture(context.userId, date);
        if (!scheduledHabits) {
            return [];
        }

        const scheduledHabitModels: ScheduledHabit[] = ModelConverter.convertAll(scheduledHabits);
        return scheduledHabitModels;
    }

    public static async getAllForUserInDateRange(
        context: Context,
        userId: number,
        startDate: PureDate,
        endDate: PureDate
    ): Promise<ScheduledHabit[]> {
        const scheduledHabits = await ScheduledHabitDao.getForUserInDateRange(
            userId,
            startDate,
            endDate
        );
        if (!scheduledHabits) {
            return [];
        }

        const scheduledHabitModels: ScheduledHabit[] = ModelConverter.convertAll(scheduledHabits);
        return scheduledHabitModels;
    }

    public static async getHabitSummaries(
        context: Context,
        cutoffDate: PureDate
    ): Promise<HabitSummary[]> {
        const scheduledHabits = await ScheduledHabitDao.getAll(context.userId);
        const scheduledHabitModels: ScheduledHabit[] = ModelConverter.convertAll(scheduledHabits);
        const habitSummaries = ScheduledHabitSummaryProvider.createSummaries(
            scheduledHabitModels,
            cutoffDate
        );

        habitSummaries.sort((a, b) => {
            const aSort = a.nextHabitDays ?? -1 * (a.lastHabitDays ?? 0);
            const bSort = b.nextHabitDays ?? -1 * (b.lastHabitDays ?? 0);
            return aSort > bSort ? 1 : -1;
        });

        return habitSummaries;
    }

    public static async getHabitSummary(
        context: Context,
        habitId: number,
        cutoffDate: PureDate
    ): Promise<HabitSummary> {
        const scheduledHabits = await ScheduledHabitDao.getAllByHabitIdAndUserId(
            habitId,
            context.userId
        );
        if (!scheduledHabits) {
            throw new ServiceException(
                404,
                Code.SCHEDULED_HABIT_NOT_FOUND,
                'scheduled habit not found'
            );
        }

        const scheduledHabitModels: ScheduledHabit[] = ModelConverter.convertAll(scheduledHabits);
        const habitSummaries = ScheduledHabitSummaryProvider.createSummaries(
            scheduledHabitModels,
            cutoffDate
        );

        if (habitSummaries.length !== 1) {
            throw new ServiceException(
                500,
                Code.SCHEDULED_HABIT_ERROR,
                'failed to create habit summary'
            );
        }

        return habitSummaries[0];
    }

    public static async archive(context: Context, id: number, date: PureDate): Promise<void> {
        const dayKey = DayKeyUtility.getDayKeyFromPureDate(date);
        const plannedDay = await PlannedDayDao.getByUserAndDayKey(context.userId, dayKey);
        const plannedTaskHasScheduledHabit = plannedDay?.plannedTasks?.some((task) => {
            return task.scheduledHabitId === id;
        });

        const utcDate = date.toUtcDate();
        if (!plannedTaskHasScheduledHabit) {
            utcDate.setDate(utcDate.getDate() - 1);
        }

        await ScheduledHabitDao.archive(context.userId, id, utcDate);
    }

    public static async count(context: Context): Promise<number> {
        return ScheduledHabitDao.count(context.userId);
    }
}
