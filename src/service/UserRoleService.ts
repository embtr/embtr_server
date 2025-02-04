import { AccountDao } from '@src/database/AccountDao';
import { RoleDao } from '@src/database/RoleDao';
import { UserDao } from '@src/database/UserDao';
import { Context, NewUserContext } from '@src/general/auth/Context';
import { Role } from '@src/roles/Roles';

export class UserRoleService {
    public static async addUserRole(context: Context | NewUserContext, uid: string, role: Role) {
        await this.addUserRoles(context, uid, [role]);
    }

    public static async addUserRoles(
        context: Context | NewUserContext,
        uid: string,
        roles: Role[]
    ) {
        const databaseRoles = await RoleDao.getAllByName(roles);
        if (!databaseRoles) {
            return;
        }

        const user = await UserDao.getByUid(uid);
        if (!user) {
            throw new Error('User not found');
        }

        const account = await AccountDao.getByUid(uid);
        if (!account) {
            return;
        }

        const databaseRoleIds = databaseRoles.map((role) => {
            return role.id;
        });

        try {
            const updatedUser = await UserDao.addUserRoles(user.uid, databaseRoleIds);
            if (!updatedUser) {
                return;
            }
        } catch (error) {
            return;
        }

        try {
            await AccountDao.addAccountRoles(account!.uid, roles);
        } catch (error) {
            await UserDao.removeUserRoles(user.uid, databaseRoleIds);
        }
    }

    public static async removeUserRole(context: Context, uid: string, role: Role) {
        await this.removeUserRoles(context, uid, [role]);
    }

    public static async removeUserRoles(context: Context, uid: string, roles: Role[]) {
        const databaseRoles = await RoleDao.getAllByName(roles);
        if (!databaseRoles) {
            return;
        }

        const user = await UserDao.getByUid(uid);
        if (!user) {
            return;
        }

        const account = await AccountDao.getByUid(uid);
        if (!account) {
            return;
        }

        const databaseRoleIds = databaseRoles.map((role) => {
            return role.id;
        });

        try {
            const updatedUser = await UserDao.removeUserRoles(user.uid, databaseRoleIds);
            if (!updatedUser) {
                return;
            }
        } catch (error) {
            return;
        }

        try {
            await AccountDao.removeAccountRoles(account!.uid, roles);
        } catch (error) {
            await UserDao.addUserRoles(user.uid, databaseRoleIds);
        }
    }

    public static async hasPremiumRole(context: Context, userId: number): Promise<boolean> {
        return this.hasRole(context, userId, Role.PREMIUM);
    }

    public static async hasRole(context: Context, userId: number, role: Role): Promise<boolean> {
        const user = await UserDao.getById(userId);
        if (!user) {
            return false;
        }

        const hasRole = user.roles.some((userRole) => {
            return userRole.name === role;
        });

        return hasRole;
    }

    public static async isAdmin(email: string): Promise<boolean> {
        const account = await AccountDao.getByEmail(email);
        const isAdmin = account?.customClaims?.roles?.includes(Role.ADMIN);

        return isAdmin;
    }

    public static async isUser(email: string): Promise<boolean> {
        const account = await AccountDao.getByEmail(email);
        const isAdmin = account?.customClaims?.roles?.includes(Role.USER);

        return isAdmin;
    }

    public static async isPremium(email: string): Promise<boolean> {
        const account = await AccountDao.getByEmail(email);
        const isPremium = account?.customClaims?.roles?.includes(Role.PREMIUM);

        return isPremium;
    }

    public static async getRoles(email: string) {
        const user = await UserDao.getByEmail(email);
        const account = await AccountDao.getByEmail(email);
        const accountRoles = account?.customClaims?.roles;
        const userRoles = user?.roles;

        return {
            accountRoles,
            userRoles,
        };
    }
}
