import { prisma } from '@database/prisma';
import { PlannedDay, PlannedTask, Prisma } from '@prisma/client';
import { PlannedTask as PlannedTaskModel } from '@resources/schema';
import { Constants } from '@resources/types/constants/constants';

export type PlannedTaskFull = PlannedTask & { plannedDay: PlannedDay };
export type HabitJourneyQueryResults = Prisma.PromiseReturnType<
    typeof PlannedHabitDao.getHabitJourneys
>;

// ¯\_(ツ)_/¯ - weakpotatoclone - 2023-06-02
// ¯\_(ツ)_/¯ - weakpotatoclone - 2023-06-28

const includes = {
    plannedDay: true,
    scheduledHabit: {
        include: {
            timesOfDay: true,
        },
    },
    timeOfDay: true,
    originalTimeOfDay: true,
    unit: true,
};

export class PlannedHabitDao {
    public static async create(plannedTask: PlannedTaskModel): Promise<PlannedTask | null> {
        const unit = plannedTask.unitId
            ? {
                unit: {
                    connect: {
                        id: plannedTask.unitId,
                    },
                },
            }
            : {};

        const icon = plannedTask.iconId
            ? {
                icon: {
                    connect: {
                        id: plannedTask.iconId,
                    },
                },
            }
            : {};

        const timeOfDay = {
            timeOfDay: {
                connect: {
                    id: plannedTask.timeOfDayId ?? 5,
                },
            },
        };

        const originalTimeOfDay = {
            originalTimeOfDay: {
                connect: {
                    id: plannedTask.originalTimeOfDayId ?? 5,
                },
            },
        };

        return prisma.plannedTask.create({
            data: {
                plannedDay: {
                    connect: {
                        id: plannedTask.plannedDayId,
                    },
                },
                scheduledHabit: {
                    connect: {
                        id: plannedTask.scheduledHabitId,
                    },
                },
                ...timeOfDay,
                ...originalTimeOfDay,
                ...unit,
                ...icon,
                title: plannedTask.title,
                description: plannedTask.description,
                quantity: plannedTask.quantity ?? 1,
                completedQuantity: plannedTask.completedQuantity ?? 0,
                status: plannedTask.status ?? Constants.CompletionState.INCOMPLETE,
                active: plannedTask.active ?? true,
            },

            include: {
                ...includes,
            },
        });
    }

    public static async update(plannedTask: PlannedTaskModel): Promise<PlannedTaskFull> {
        const {
            active = true,
            status = Constants.CompletionState.INCOMPLETE,
            title = '',
            description = '',
            quantity = 1,
            completedQuantity = 0,
            unitId,
            timeOfDayId = 5,
        } = plannedTask;

        const unit = {
            unit: unitId
                ? {
                    connect: {
                        id: unitId,
                    },
                }
                : {
                    disconnect: true,
                },
        };

        const icon = {
            icon: plannedTask.iconId
                ? {
                    connect: {
                        id: plannedTask.iconId,
                    },
                }
                : {
                    disconnect: true,
                },
        };

        const result = await prisma.plannedTask.update({
            where: {
                id: plannedTask.id,
            },
            data: {
                active,
                status,
                title,
                description,
                quantity,
                completedQuantity,
                timeOfDay: {
                    connect: {
                        id: timeOfDayId,
                    },
                },
                ...unit,
                ...icon,
            },
            include: {
                ...includes,
            },
        });

        return result;
    }

    public static async getByPlannedDayAndScheduledHabitAndTimeOfDay(
        plannedDayId: number,
        scheduledHabitId: number,
        timeOfDayId: number
    ) {
        const results = await prisma.plannedTask.findFirst({
            where: {
                plannedDayId,
                scheduledHabitId,
                timeOfDayId,
            },
        });

        return results;
    }

    public static async get(id: number): Promise<PlannedTaskFull | null> {
        return prisma.plannedTask.findUnique({
            where: {
                id,
            },
            include: {
                plannedDay: true,
                scheduledHabit: {
                    include: {
                        timesOfDay: {
                            select: {
                                period: true,
                            },
                        },
                        icon: true,
                        task: true,
                    },
                },
                timeOfDay: true,
                originalTimeOfDay: true,
                unit: true,
                icon: true,
            },
        });
    }

    public static async getAllByPlannedDayId(plannedDayId: number) {
        return prisma.plannedTask.findMany({
            where: {
                plannedDayId,
            },
            include: {
                ...includes,
            },
        });
    }

    public static async getByPlannedDayIdAndTaskId(plannedDayId: number, taskId: number) {
        return prisma.plannedTask.findMany({
            where: {
                active: true,
                plannedDay: {
                    id: plannedDayId,
                },
            },
            include: {
                plannedDay: true,
            },
        });
    }

    public static async count(userId: number): Promise<number> {
        return prisma.plannedTask.count({
            where: {
                plannedDay: {
                    userId,
                },
            },
        });
    }

    public static async completedExists(userId: number): Promise<boolean> {
        const results = await prisma.plannedTask.findMany({
            where: {
                plannedDay: {
                    userId,
                },
            },
        });

        for (const result of results) {
            if ((result.completedQuantity ?? 0) >= (result.quantity ?? 1)) {
                return true;
            }
        }

        return false;
    }

    public static async deleteByUserIdAndPlannedDayIdAndTaskId(
        userId: number,
        plannedDayId: number,
        taskId: number
    ) {
        return prisma.plannedTask.deleteMany({
            where: {
                plannedDay: {
                    userId,
                    id: plannedDayId,
                },
            },
        });
    }

    public static async getHabitJourneys(userId: number) {
        const result = await prisma.$queryRaw(
            Prisma.sql`
SELECT habit.id                                                                      as habitId,
       habit.title                                                                   as habitTitle,
       habit.iconName                                                                as iconName,
       habit.iconSource                                                              as iconSource,
       season.id                                                                     as season,
       DATE(planned_day.date - INTERVAL (((WEEKDAY(planned_day.date) + 7) % 7)) DAY) AS seasonDate,
       COUNT(distinct planned_day.id)                                                as daysInSeason
FROM planned_task
         JOIN task ON planned_task.taskId = task.id
         JOIN habit ON planned_task.habitId = habit.id
         JOIN planned_day ON plannedDayId = planned_day.id
         JOIN season on season.date = DATE(planned_day.date - INTERVAL (((WEEKDAY(planned_day.date) + 7) % 7)) DAY)
WHERE userId = ${userId}
  AND planned_day.date >= '2023-01-01'
  AND status != 'FAILED'
  AND planned_task.active = true
  AND planned_task.quantity > 0
  AND planned_task.completedQuantity >= planned_task.quantity
GROUP BY habit.id, seasonDate, season
order by habitId desc, seasonDate desc;
`
        );

        const formattedResults = result as unknown[];
        formattedResults.forEach((row: any) => {
            row.daysInSeason = parseInt(row.daysInSeason);
        });

        return formattedResults;
    }

    public static async countAllCompleted(): Promise<number> {
        const response = await prisma.$queryRaw(
            Prisma.sql`
          SELECT count(*) FROM planned_task WHERE completedQuantity >= quantity
        `
        );
        const result = response as Record<string, string>[];
        return parseInt(result[0]['count(*)']);
    }
}
