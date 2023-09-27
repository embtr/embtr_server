import { prisma } from '@database/prisma';
import { PlannedDay, PlannedTask, Task, Prisma } from '@prisma/client';
import { PlannedTask as PlannedTaskModel, Unit } from '@resources/schema';

export type PlannedTaskFull = PlannedTask & { plannedDay: PlannedDay };
export type HabitJourneyQueryResults = Prisma.PromiseReturnType<
    typeof PlannedTaskController.getHabitJourneys
>;

// ¯\_(ツ)_/¯ - weakpotatoclone - 2023-06-02
// ¯\_(ツ)_/¯ - weakpotatoclone - 2023-06-28

export class PlannedTaskController {
    public static async create(
        plannedDay: PlannedDay,
        task: Task,
        quantity?: number,
        unit?: Unit
    ): Promise<PlannedTask | null> {
        const data = {
            plannedDay: {
                connect: {
                    id: plannedDay.id,
                },
            },
            task: {
                connect: {
                    id: task.id,
                },
            },
            unit: {},
            status: 'INCOMPLETE',
            completedQuantity: 0,
            quantity: quantity ?? 1,
        };

        if (unit !== undefined) {
            data.unit = {
                connect: {
                    id: unit.id,
                },
            };
        }

        return prisma.plannedTask.create({
            data,
            include: {
                unit: true,
            },
        });
    }

    public static async update(plannedTask: PlannedTaskModel): Promise<PlannedTaskFull> {
        const active = plannedTask.active !== undefined ? { active: plannedTask.active } : {};
        const status = plannedTask.status !== undefined ? { status: plannedTask.status } : {};
        const quantity =
            plannedTask.quantity !== undefined ? { quantity: plannedTask.quantity } : {};
        const completedQuantity =
            plannedTask.completedQuantity !== undefined
                ? { completedQuantity: plannedTask.completedQuantity }
                : {};
        const unit = plannedTask.unitId !== undefined ? { unitId: plannedTask.unitId } : {};

        const result = await prisma.plannedTask.update({
            where: {
                id: plannedTask.id,
            },
            data: {
                ...active,
                ...status,
                ...quantity,
                ...completedQuantity,
                ...unit,
            },
            include: {
                plannedDay: true,
                unit: true,
            },
        });

        return result;
    }

    public static async get(id: number): Promise<PlannedTaskFull | null> {
        return prisma.plannedTask.findUnique({
            where: {
                id,
            },
            include: {
                plannedDay: true,
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
}
