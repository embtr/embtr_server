import { Prisma, User } from '@prisma/client';
import { User as UserModel } from '@resources/schema';
import { prisma } from '@database/prisma';
import { Constants } from '@resources/types/constants/constants';
import { Role } from '@src/roles/Roles';
import { UserPropertyUtility } from '@src/utility/UserPropertyUtility';

export const UserIncludes = {
    roles: true,
    properties: {
        where: {
            key: {
                in: UserPropertyUtility.ALLOWED_PROPERTIES,
            },
        },
    },
    userBadges: {
        include: {
            badge: {
                include: {
                    icon: true,
                },
            },
        },
    },
};

export class UserDao {
    public static async getByIds(ids: number[]): Promise<User[]> {
        const users = await prisma.user.findMany({
            where: {
                id: {
                    in: ids,
                },
            },
            include: {
                userBadges: {
                    include: {
                        badge: {
                            include: {
                                icon: true,
                            },
                        },
                    },
                },
            },
        });

        return users;
    }

    public static async getByUid(uid: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: {
                uid: uid,
            },
            include: UserIncludes,
        });

        return user;
    }

    public static async existsByEmail(email: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        return !!user;
    }

    public static async existsById(id: number): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: {
                id: id,
            },
        });

        return !!user;
    }

    public static async existsByUsername(username: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: {
                username: username,
            },
        });

        return !!user;
    }

    public static async getByEmail(email: string) {
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            },
            include: UserIncludes,
        });

        return user;
    }

    public static async getAll(query?: Record<string, string>): Promise<User[]> {
        const users = await prisma.user.findMany({
            ...(query?.page && {
                skip: (Number(query.page) - 1) * Number(query.limit || 25),
            }),
            ...(query?.limit && {
                take: Number(query.limit),
            }),
            ...(query?.sort && {
                orderBy: [
                    {
                        createdAt: query.sort as Prisma.SortOrder,
                    },
                ],
            }),
            include: {
                scheduledHabits: {
                    include: {
                        plannedTasks: true,
                    },
                },
                properties: true,
            },
        });

        return users;
    }

    public static async getAllUserCount(): Promise<number> {
        const count = await prisma.user.count();
        return count;
    }

    public static async getAllPremiumUserCount(): Promise<number> {
        const count = await prisma.user.count({
            where: {
                roles: {
                    some: {
                        name: 'premium',
                    },
                },
            },
        });
        return count;
    }

    public static async existsByUid(uid: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: {
                uid: uid,
            },
        });

        return !!user;
    }

    public static async getById(id: number) {
        const user = await prisma.user.findUnique({
            where: {
                id: id,
            },
            include: UserIncludes,
        });

        return user;
    }

    public static async getByIdForAdmin(id: number) {
        const user = await prisma.user.findUnique({
            where: {
                id: id,
            },
            include: {
                roles: true,
                scheduledHabits: {
                    include: {
                        task: true,
                        plannedTasks: true,
                    },
                },
                plannedDays: {
                    include: {
                        plannedTasks: {
                            include: {
                                scheduledHabit: {
                                    include: {
                                        task: {
                                            include: {
                                                icon: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                challenges: true,
                properties: true,
            },
        });

        return user;
    }

    public static async getByUsername(username: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: {
                username: username,
            },
            include: {
                roles: {
                    select: {
                        name: true,
                    },
                },
                properties: true,
                pushNotificationTokens: {
                    select: {
                        id: true,
                        token: true,
                    },
                    where: {
                        active: true,
                    },
                },
            },
        });

        return user;
    }

    public static async search(query: string): Promise<User[]> {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        username: {
                            contains: query,
                        },
                    },
                    {
                        displayName: {
                            contains: query,
                        },
                    },
                ],
            },
            include: UserIncludes,
        });

        return users;
    }

    public static async adminSearch(query: string): Promise<User[]> {
        const idQuery = isNaN(Number(query))
            ? {}
            : {
                id: {
                    equals: Number(query),
                },
            };

        const users = await prisma.user.findMany({
            include: {
                scheduledHabits: {
                    include: {
                        plannedTasks: true,
                    },
                },
            },
            where: {
                OR: [
                    {
                        username: {
                            contains: query,
                        },
                    },
                    {
                        displayName: {
                            contains: query,
                        },
                    },
                    {
                        email: {
                            contains: query,
                        },
                    },
                    {
                        uid: {
                            equals: query,
                        },
                    },
                    ...[idQuery],
                ],
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return users;
    }

    public static async create(uid: string, email: string): Promise<User | null> {
        const newUser = await prisma.user.create({
            data: {
                uid: uid,
                email: email,
                bio: 'welcome to embtr!',
                location: 'earth',
                photoUrl: '',
            },
        });

        return newUser;
    }

    public static async deleteByUid(uid: string): Promise<User | null> {
        return await prisma.user.delete({
            where: {
                uid: uid,
            },
        });
    }

    public static async update(uid: string, user: UserModel): Promise<User | null> {
        const username = user.username !== undefined ? { username: user.username.trim() } : {};
        const displayName =
            user.displayName !== undefined ? { displayName: user.displayName.trim() } : {};
        const bio = user.bio !== undefined ? { bio: user.bio.trim() } : {};
        const location = user.location !== undefined ? { location: user.location.trim() } : {};
        const photoUrl = user.photoUrl !== undefined ? { photoUrl: user.photoUrl } : {};
        const bannerUrl = user.bannerUrl !== undefined ? { bannerUrl: user.bannerUrl } : {};
        const accountSetup =
            user.accountSetup !== undefined ? { accountSetup: user.accountSetup } : {};
        const termsVersion =
            user.termsVersion !== undefined ? { termsVersion: user.termsVersion } : {};

        const updatedUser = await prisma.user.update({
            where: {
                uid: uid,
            },
            data: {
                ...username,
                ...displayName,
                ...bio,
                ...location,
                ...photoUrl,
                ...bannerUrl,
                ...accountSetup,
                ...termsVersion,
            },
        });

        return updatedUser;
    }

    public static async addUserRole(uid: string, roleId: number) {
        const updatedUser = await prisma.user.update({
            where: {
                uid: uid,
            },
            data: {
                roles: {
                    connect: {
                        id: roleId,
                    },
                },
            },
        });

        return updatedUser;
    }

    public static async addUserRoles(uid: string, roleIds: number[]) {
        const updatedUser = await prisma.user.update({
            where: {
                uid: uid,
            },
            data: {
                roles: {
                    connect: roleIds.map((id) => {
                        return {
                            id: id,
                        };
                    }),
                },
            },
        });

        return updatedUser;
    }

    public static async removeUserRole(uid: string, roleId: number) {
        const updatedUser = await prisma.user.update({
            where: {
                uid: uid,
            },
            data: {
                roles: {
                    disconnect: {
                        id: roleId,
                    },
                },
            },
        });

        return updatedUser;
    }

    public static async removeUserRoles(uid: string, roleIds: number[]) {
        const updatedUser = await prisma.user.update({
            where: {
                uid: uid,
            },
            data: {
                roles: {
                    disconnect: roleIds.map((id) => {
                        return {
                            id: id,
                        };
                    }),
                },
            },
        });

        return updatedUser;
    }

    public static async getUsersWithRole(role: Role): Promise<User[]> {
        const users = await prisma.user.findMany({
            where: {
                roles: {
                    some: {
                        name: role,
                    },
                },
            },
            include: UserIncludes,
        });

        return users;
    }

    public static async getUsersWithBadge(key: string): Promise<User[]> {
        const users = await prisma.user.findMany({
            where: {
                userBadges: {
                    some: {
                        badge: {
                            key: key,
                        },
                    },
                },
            },
            include: UserIncludes,
        });

        return users;
    }

    public static async getUsersWithProperty(
        key: Constants.UserPropertyKey,
        value: string
    ): Promise<User[]> {
        const users = await prisma.user.findMany({
            where: {
                properties: {
                    some: {
                        key: key,
                        value: value,
                    },
                },
            },
            include: {
                properties: true,
                pushNotificationTokens: {
                    select: {
                        id: true,
                        token: true,
                    },
                    where: {
                        active: true,
                    },
                },
            },
        });

        return users;
    }

    public static async getUsersWithoutProperty(key: Constants.UserPropertyKey): Promise<User[]> {
        const users = await prisma.user.findMany({
            where: {
                properties: {
                    none: {
                        key: key,
                    },
                },
            },
            include: {
                properties: true,
                pushNotificationTokens: {
                    select: {
                        id: true,
                        token: true,
                    },
                    where: {
                        active: true,
                    },
                },
            },
        });

        return users;
    }

    public static getActiveUsersForRange = async (startDate: Date, endDate: Date) => {
        const results = await prisma.plannedDay.findMany({
            distinct: ['userId'],
            where: {
                plannedTasks: {
                    some: {
                        active: true,
                        status: {
                            not: 'INCOMPLETE',
                        },
                        updatedAt: {
                            gt: startDate,
                            lte: endDate,
                        },
                    },
                },
            },
        });

        return results.length;
    };

    public static async getAllWithInactiveUsers(date: Date): Promise<User[]> {
        const users = await prisma.user.findMany({
            where: {
                scheduledHabits: {
                    some: {
                        OR: [
                            {
                                endDate: null,
                            },
                            {
                                endDate: {
                                    gte: date + 'T00:00:00.000Z',
                                },
                            },
                        ],
                    },
                },
            },
            include: {
                properties: true,
            },
        });

        return users;
    }

    public static async getAllWithNoScheduledHabits(): Promise<User[]> {
        const users = await prisma.user.findMany({
            where: {
                scheduledHabits: {
                    none: {},
                },
            },
            include: {
                properties: true,
                pushNotificationTokens: {
                    select: {
                        id: true,
                        token: true,
                    },
                    where: {
                        active: true,
                    },
                },
            },
        });

        return users;
    }

    public static async getAllWithAllExpiredScheduledHabits(date: Date): Promise<User[]> {
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        scheduledHabits: {
                            every: {
                                endDate: {
                                    lte: date,
                                    not: null,
                                },
                            },
                        },
                    },
                    {
                        scheduledHabits: {
                            some: {},
                        },
                    },
                ],
            },
            include: {
                properties: true,
                pushNotificationTokens: {
                    select: {
                        id: true,
                        token: true,
                    },
                    where: {
                        active: true,
                    },
                },
            },
        });

        return users;
    }

    public static async getAllInactiveWithScheduledHabits(
        today: Date,
        cutoffDate: Date
    ): Promise<User[]> {
        const users = await prisma.user.findMany({
            where: {
                scheduledHabits: {
                    some: {
                        AND: [
                            {
                                OR: [
                                    {
                                        endDate: null,
                                        active: true,
                                    },
                                    {
                                        endDate: {
                                            gte: today,
                                        },
                                        active: true,
                                    },
                                ],
                            },
                            {
                                plannedTasks: {
                                    every: {
                                        updatedAt: {
                                            lt: cutoffDate,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            include: {
                properties: true,
                pushNotificationTokens: {
                    select: {
                        id: true,
                        token: true,
                    },
                    where: {
                        active: true,
                    },
                },
            },
        });

        return users;
    }
}
