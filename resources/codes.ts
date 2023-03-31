export enum Code {
    SUCCESS,
    UNAUTHORIZED,
    GENERIC_ERROR,
    FORBIDDEN,
    RESOURCE_NOT_FOUND,
    RESOURCE_ALREADY_EXISTS,
    INVALID_REQUEST,

    //CREATE USER
    CREATE_ACCOUNT_EMAIL_IN_USE,
    CREATE_ACCOUNT_INVALID_EMAIL,
    CREATE_ACCOUNT_INVALID_PASSWORD,

    //FORGOT PASSWORD
    FORGOT_ACCOUNT_PASSWORD_INVALID_EMAIL,
    FORGOT_ACCOUNT_PASSWORD_UNKNOWN_EMAIL,

    //SEND_VERIFICATION_EMAIL
    SEND_ACCOUNT_VERIFICATION_EMAIL_UNKNOWN_EMAIL,
    SEND_ACCOUNT_VERIFICATION_EMAIL_INVALID_EMAIL,
    SEND_ACCOUNT_VERIFICATION_EMAIL_TOO_MANY_ATTEMPTS,

    //ACCOUNT AUTHENTICATION
    ACCOUNT_AUTHENTICATION_INVALID_CREDENTIALS,

    //USER CREATION
    USER_CREATE_FAILED,
    USER_CREATE_ALREADY_EXISTS,

    //USER UPDATE
    USER_UPDATE_FAILED,

    //TASKS
    TASK_CREATE_FAILED_ALREADY_EXISTS,
    TASK_CREATE_FAILED_MISSING_REQUIREMENTS,
    TASK_CREATE_SUCCESS,

    //PLANNED_DAY
    PLANNED_DAY_FAILED_ALREADY_EXISTS,
    PLANNED_DAY_FAILED_MISSING_REQUIREMENTS,
    PLANNED_DAY_SUCCESS,

    CREATE_PLANNED_DAY_FAILED

}
