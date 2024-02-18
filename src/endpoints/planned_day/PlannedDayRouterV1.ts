import { authenticate } from '@src/middleware/authentication';
import { runEndpoint } from '@src/middleware/error/ErrorMiddleware';
import { authorize } from '@src/middleware/general/GeneralAuthorization';
import {
    validateGetById,
    validateGetByUser,
    validatePlannedDayPost,
    validatePlannedTaskPost,
} from '@src/middleware/planned_day/PlannedDayValidation';
import { PlannedDayService } from '@src/service/PlannedDayService';
import { PlannedHabitService } from '@src/service/PlannedHabitService';
import express from 'express';
import { ContextService } from '@src/service/ContextService';
import { PlannedTask } from '@resources/schema';
import { SUCCESS } from '@src/common/RequestResponses';
import { Context } from '@src/general/auth/Context';
import {
    CreatePlannedDayResponse,
    GetPlannedDayResponse,
} from '@resources/types/requests/PlannedDayTypes';
import { GetBooleanResponse } from '@resources/types/requests/GeneralTypes';
import {
    CreatePlannedTaskResponse,
    UpdatePlannedTaskResponse,
} from '@resources/types/requests/PlannedTaskTypes';
import { routeLogger } from '@src/middleware/logging/LoggingMiddleware';
import { PlannedDayTransformationServiceV1 } from '@src/transform/PlannedDayTransformationService';
import { PlannedHabitTransformationServiceV1 } from '@src/transform/PlannedHabitTransformationService';

const plannedDayRouterV1 = express.Router();
const v = 'v1';

const plannedDayTransformationService = new PlannedDayTransformationServiceV1();
const plannedHabitTransformationService = new PlannedHabitTransformationServiceV1();

plannedDayRouterV1.get(
    '/:id',
    routeLogger(v),
    authenticate,
    authorize,
    validateGetById,
    runEndpoint(async (req, res) => {
        const context = await ContextService.get(req);
        const id = Number(req.params.id);

        const plannedDay = await PlannedDayService.getById(context, id);
        const response: GetPlannedDayResponse = { ...SUCCESS, plannedDay };
        res.json(response);
    })
);

/**
 * @deprecated on version 1.0.14 (use version 2.0.0)
 */
plannedDayRouterV1.get(
    '/:userId/:dayKey',
    routeLogger(v),
    authenticate,
    authorize,
    validateGetByUser,
    runEndpoint(async (req, res) => {
        const context = await ContextService.get(req);
        const userId = Number(req.params.userId);
        const dayKey = req.params.dayKey;

        const plannedDay = await PlannedDayService.getByUser(context, userId, dayKey);
        const transformedPlannedDay = plannedDayTransformationService.transformOut(plannedDay);
        const response: GetPlannedDayResponse = { ...SUCCESS, plannedDay: transformedPlannedDay };
        res.json(response);
    })
);

plannedDayRouterV1.get(
    '/:userId/:dayKey/isComplete',
    routeLogger(v),
    authenticate,
    authorize,
    validateGetByUser,
    runEndpoint(async (req, res) => {
        const context = await ContextService.get(req);
        const userId = Number(req.params.userId);
        const dayKey = req.params.dayKey;

        const isComplete = await PlannedDayService.getIsComplete(context, userId, dayKey);
        const response: GetBooleanResponse = { ...SUCCESS, result: isComplete };
        res.json(response);
    })
);

plannedDayRouterV1.post(
    '/',
    routeLogger(v),
    authenticate,
    authorize,
    validatePlannedDayPost,
    runEndpoint(async (req, res) => {
        const context: Context = await ContextService.get(req);
        const dayKey = req.body.dayKey;

        const plannedDay = await PlannedDayService.create(context, dayKey);
        const response: CreatePlannedDayResponse = { ...SUCCESS, plannedDay };
        res.json(response);
    })
);

/**
 * @deprecated on version 1.0.14 (use version 2.0.0)
 */
plannedDayRouterV1.post(
    '/:dayKey/planned-task',
    routeLogger(v),
    authenticate,
    authorize,
    validatePlannedTaskPost,
    runEndpoint(async (req, res) => {
        const context = await ContextService.get(req);
        const dayKey = req.params.dayKey;
        const plannedTask: PlannedTask = req.body.plannedTask;
        const transformedPlannedTask = plannedHabitTransformationService.transformIn(plannedTask);

        const updatedPlannedTask = await PlannedHabitService.createOrUpdate(
            context,
            dayKey,
            transformedPlannedTask
        );
        const transformedUpdatedPlannedTask =
            plannedHabitTransformationService.transformOut(updatedPlannedTask);
        const response: CreatePlannedTaskResponse = {
            ...SUCCESS,
            plannedTask: transformedUpdatedPlannedTask,
        };
        res.json(response);
    })
);

/**
 * @deprecated on version 1.0.14 (use version 2.0.0)
 */
plannedDayRouterV1.put(
    '/planned-task/',
    routeLogger(v),
    authenticate,
    authorize,
    runEndpoint(async (req, res) => {
        const context = await ContextService.get(req);
        const plannedTask: PlannedTask = req.body.plannedTask;

        const transformedPlannedTask = plannedHabitTransformationService.transformIn(plannedTask);
        const updatedPlannedTask = await PlannedHabitService.update(
            context,
            transformedPlannedTask
        );
        const transformedUpdatedPlannedTask =
            plannedHabitTransformationService.transformOut(updatedPlannedTask);

        const response: UpdatePlannedTaskResponse = {
            ...SUCCESS,
            plannedTask: transformedUpdatedPlannedTask,
        };
        res.json(response);
    })
);

export default plannedDayRouterV1;
