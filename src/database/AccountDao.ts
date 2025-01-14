import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { logger } from '@src/common/logger/Logger';
import { firebase } from '@src/auth/Firebase';
import { Code } from '@resources/codes';
import { Role } from '@src/roles/Roles';

export interface CreateAccountResult {
    user: UserRecord | undefined;
    code: Code;
}

export class AccountDao {
    public static async create(email: string, password: string): Promise<CreateAccountResult> {
        let user: UserRecord | undefined = undefined;
        try {
            user = await firebase.auth().createUser({
                email,
                displayName: email,
                password,
            });

            return {
                user,
                code: Code.SUCCESS,
            };
        } catch (error) {
            // @ts-ignore :(
            const code = error.errorInfo.code;

            switch (code) {
                case 'auth/email-already-exists':
                    return { user: undefined, code: Code.CREATE_ACCOUNT_EMAIL_IN_USE };
                case 'auth/invalid-email':
                    return { user: undefined, code: Code.CREATE_ACCOUNT_INVALID_EMAIL };
                case 'auth/invalid-password':
                    return { user: undefined, code: Code.CREATE_ACCOUNT_INVALID_PASSWORD };
            }
        }

        return { user: undefined, code: Code.GENERIC_ERROR };
    }

    public static async deleteByUid(uid: string): Promise<void> {
        const account = await this.getByUid(uid);
        if (!account) {
            return;
        }

        await firebase.auth().deleteUser(account.uid);
    }

    public static async verifyEmail(email: string): Promise<void> {
        const account = await this.getByEmail(email);
        if (account) {
            await firebase.auth().updateUser(account.uid, {
                emailVerified: true,
            });
        }
    }

    public static async getByEmail(email: string): Promise<UserRecord | undefined> {
        try {
            const user = await firebase.auth().getUserByEmail(email);
            return user;
        } catch (error) {
            return undefined;
        }
    }

    public static async getByUid(uid: string): Promise<UserRecord | undefined> {
        try {
            const user = await firebase.auth().getUser(uid);
            return user;
        } catch (error) {
            return undefined;
        }
    }

    public static async addAccountRole(uid: string, role: Role): Promise<void> {
        this.addAccountRoles(uid, [role]);
    }

    public static async addAccountRoles(uid: string, roles: Role[]): Promise<void> {
        let updatedRoles = Array.from(new Set(roles));
        const currentRoles = await this.getCustomClaims(uid);
        if (currentRoles) {
            updatedRoles = Array.from(new Set([...currentRoles.roles, ...roles]));
        }

        await this.updateCustomClaim(uid, 'roles', updatedRoles);
    }

    public static async removeAccountRole(uid: string, role: Role): Promise<void> {
        this.removeAccountRoles(uid, [role]);
    }

    public static async removeAccountRoles(uid: string, roles: Role[]): Promise<void> {
        const currentRoles = await this.getCustomClaims(uid);
        if (currentRoles) {
            const updatedRoles = currentRoles.roles.filter((role: Role) => !roles.includes(role));
            await this.updateCustomClaim(uid, 'roles', updatedRoles);
        }
    }

    public static async updateCustomClaim(uid: string, key: string, value: unknown): Promise<void> {
        let updatedClaims = { [key]: value };
        const currentClaims = await this.getCustomClaims(uid);
        if (currentClaims) {
            updatedClaims = { ...currentClaims, [key]: value };
        }

        try {
            await firebase.auth().setCustomUserClaims(uid, updatedClaims);
        } catch (error) {
            logger.error('Error updating user custom claims:', error);
        }
    }

    public static async clearCustomClaims(uid: string): Promise<void> {
        try {
            await firebase.auth().setCustomUserClaims(uid, {});
        } catch (error) {
            logger.error('Error clearing user custom claims:', error);
        }
    }

    public static async existsByEmail(email: string): Promise<boolean> {
        const account = await this.getByEmail(email);
        return !!account;
    }

    public static async existsByUid(uid: string): Promise<boolean> {
        const account = await this.getByUid(uid);
        return !!account;
    }

    private static async getCustomClaims(uid: string) {
        try {
            const user = await firebase.auth().getUser(uid);
            const customClaims = user.customClaims;

            return customClaims;
        } catch (error) {
            logger.error('Error getting user custom claims:', error);
        }
    }
}
