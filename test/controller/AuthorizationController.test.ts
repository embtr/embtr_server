import { AuthenticationController } from '@src/controller/AuthenticationController';
import { AuthorizationController } from '@src/controller/AuthorizationController';
import { Role } from '@src/roles/Roles';
import { RO_NO_ROLE_TEST_USER_EMAIL, RO_USER_ROLE_TEST_USER_EMAIL, TEST_USER_PASSWORD } from '@test/util/DedicatedTestUsers';

describe('authorization', () => {
    describe('role extraction', () => {
        describe('fail cases', () => {
            test('bearer token is missing', async () => {
                const roles: Role[] = await AuthorizationController.getRolesFromToken('');
                expect(roles).toEqual([]);
            });

            test('bearer token is invalid', async () => {
                const roles: Role[] = await AuthorizationController.getRolesFromToken('invalid token');
                expect(roles).toEqual([]);
            });
        });

        describe('success cases', () => {
            test('can get user roles with valid account no roles', async () => {
                const token = await AuthenticationController.generateValidIdToken(RO_NO_ROLE_TEST_USER_EMAIL, TEST_USER_PASSWORD);
                const roles: Role[] = await AuthorizationController.getRolesFromToken(`Bearer ${token}`);
                expect(roles).toEqual([]);
            });

            test('can get user roles with valid account with roles', async () => {
                const token = await AuthenticationController.generateValidIdToken(RO_USER_ROLE_TEST_USER_EMAIL, TEST_USER_PASSWORD);
                const roles: Role[] = await AuthorizationController.getRolesFromToken(`Bearer ${token}`);
                expect(roles).toEqual([Role.USER]);
            });
        });
    });
});
