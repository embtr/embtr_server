import { prisma } from '@database/prisma';

export class ScheduledHabitController {
    public static async create(
        userId: number,
        taskId: number,
        description?: string,
        quantity?: number,
        unitId?: number,
        daysOfWeekIds?: number[],
        timesOfDayIds?: number[],
        startDate?: Date,
        endDate?: Date
    ) {
        let unit = {};
        if (unitId) {
            unit = {
                unit: {
                    connect: {
                        id: unitId ?? 1,
                    },
                },
            };
        }

        return await prisma.scheduledHabit.create({
            data: {
                user: {
                    connect: {
                        id: userId,
                    },
                },
                task: {
                    connect: {
                        id: taskId,
                    },
                },
                ...unit,
                description: description,
                quantity: quantity ?? 1,
                daysOfWeek: {
                    connect: daysOfWeekIds?.map((id) => {
                        return {
                            id,
                        };
                    }),
                },
                timesOfDay: {
                    connect: timesOfDayIds?.map((id) => {
                        return {
                            id,
                        };
                    }),
                },
                startDate,
                endDate,
            },
            include: {
                task: true,
                unit: true,
                daysOfWeek: true,
                timesOfDay: true,
            },
        });
    }

    public static async update(
        id: number,
        userId: number,
        taskId: number,
        description?: string,
        quantity?: number,
        unitId?: number,
        daysOfWeekIds?: number[],
        timesOfDayIds?: number[],
        startDate?: Date,
        endDate?: Date
    ) {
        let unitData = {};
        if (unitId) {
            unitData = {
                unit: {
                    connect: {
                        id: unitId ?? 1,
                    },
                },
            };
        }

        let descriptionData = {};
        if (description) {
            descriptionData = {
                description,
            };
        }

        let quantityData = {};
        if (quantity) {
            quantityData = {
                quantity,
            };
        }

        let daysOfWeekData = {};
        if (daysOfWeekIds) {
            daysOfWeekData = {
                daysOfWeek: {
                    set: daysOfWeekIds?.map((id) => {
                        return {
                            id,
                        };
                    }),
                },
            };
        }

        let timesOfDayData = {};
        if (timesOfDayIds) {
            timesOfDayData = {
                timesOfDay: {
                    set: timesOfDayIds?.map((id) => {
                        return {
                            id,
                        };
                    }),
                },
            };
        }

        let startDateData = {};
        if (startDate) {
            startDateData = {
                startDate,
            };
        }

        let endDateData = {};
        if (endDate) {
            endDateData = {
                endDate,
            };
        }

        return await prisma.scheduledHabit.update({
            where: {
                id: id,
            },
            data: {
                user: {
                    connect: {
                        id: userId,
                    },
                },
                task: {
                    connect: {
                        id: taskId,
                    },
                },
                ...unitData,
                ...descriptionData,
                ...quantityData,
                ...daysOfWeekData,
                ...timesOfDayData,
                ...startDateData,
                ...endDateData,
            },
            include: {
                task: true,
                unit: true,
                daysOfWeek: true,
                timesOfDay: true,
            },
        });
    }

    public static async archive(userId: number, id: number, date: Date) {
        return await prisma.scheduledHabit.updateMany({
            where: {
                id: id,
                userId: userId,
            },
            data: {
                endDate: date,
            },
        });
    }

    public static async replace(
        id: number,
        userId: number,
        taskId: number,
        description?: string,
        quantity?: number,
        unitId?: number,
        daysOfWeekIds?: number[],
        timesOfDayIds?: number[],
        startDate?: Date,
        endDate?: Date
    ) {
        return await prisma.scheduledHabit.update({
            where: {
                id: id,
            },

            data: {
                user: {
                    connect: {
                        id: userId,
                    },
                },
                task: {
                    connect: {
                        id: taskId,
                    },
                },
                description: description,
                quantity: quantity ?? 1,
                daysOfWeek: daysOfWeekIds
                    ? {
                          set: daysOfWeekIds?.map((id) => {
                              return {
                                  id,
                              };
                          }),
                      }
                    : undefined,
                timesOfDay: timesOfDayIds
                    ? {
                          set: timesOfDayIds?.map((id) => {
                              return {
                                  id,
                              };
                          }),
                      }
                    : undefined,
                unit: unitId
                    ? {
                          connect: {
                              id: unitId,
                          },
                      }
                    : undefined,
                startDate,
                endDate,
            },
            include: {
                task: true,
                unit: true,
                daysOfWeek: true,
                timesOfDay: true,
            },
        });
    }

    public static async get(id: number) {
        return await prisma.scheduledHabit.findUnique({
            where: {
                id: id,
            },
            include: {
                task: true,
                unit: true,
                daysOfWeek: true,
                timesOfDay: true,
            },
        });
    }

    public static async getRecent(userId: number) {
        return await prisma.scheduledHabit.findMany({
            where: {
                userId: userId,
                OR: [
                    {
                        startDate: null,
                    },
                    {
                        startDate: {
                            lte: new Date(), // this may need to be yesterday
                        },
                    },
                ],
            },
            include: {
                task: true,
                unit: true,
                daysOfWeek: true,
                timesOfDay: true,
            },
        });
    }

    public static async getActive(userId: number) {
        return await prisma.scheduledHabit.findMany({
            where: {
                userId: userId,
                OR: [
                    {
                        startDate: null,
                    },
                    {
                        startDate: {
                            lte: new Date(), // this may need to be yesterday
                        },
                    },
                ],
            },
            include: {
                task: true,
                unit: true,
                daysOfWeek: true,
                timesOfDay: true,
            },
        });
    }

    public static async getForUserAndDayOfWeekAndDate(
        userId: number,
        dayOfWeek: number,
        date: Date
    ) {
        return await prisma.scheduledHabit.findMany({
            where: {
                userId: userId,
                daysOfWeek: {
                    some: {
                        id: dayOfWeek,
                    },
                },
                AND: [
                    {
                        OR: [
                            {
                                startDate: null,
                            },
                            {
                                startDate: {
                                    lte: date,
                                },
                            },
                        ],
                    },
                    {
                        OR: [
                            {
                                endDate: null,
                            },
                            {
                                endDate: {
                                    gte: date,
                                },
                            },
                        ],
                    },
                ],
            },
            include: {
                task: true,
                unit: true,
                daysOfWeek: true,
                timesOfDay: true,
            },
        });
    }
}
