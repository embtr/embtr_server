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

const plannedDayRouter = express.Router();

plannedDayRouter.get(
    ['/:id', '/v1/:id'],
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

plannedDayRouter.get(
    ['/:userId/:dayKey', '/v1/:userId/:dayKey'],
    authenticate,
    authorize,
    validateGetByUser,
    runEndpoint(async (req, res) => {
        const context = await ContextService.get(req);
        const userId = Number(req.params.userId);
        const dayKey = req.params.dayKey;

        const plannedDay = await PlannedDayService.getByUser(context, userId, dayKey);
        const response: GetPlannedDayResponse = { ...SUCCESS, plannedDay };
        res.json(response);
    })
);

plannedDayRouter.get(
    ['/:userId/:dayKey/isComplete', '/v1/:userId/:dayKey/isComplete'],
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

plannedDayRouter.post(
    ['/', '/v1/'],
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

plannedDayRouter.post(
    ['/:dayKey/planned-task', '/v1/:dayKey/planned-task'],
    authenticate,
    authorize,
    validatePlannedTaskPost,
    runEndpoint(async (req, res) => {
        const context = await ContextService.get(req);
        const dayKey = req.params.dayKey;
        const plannedTask: PlannedTask = req.body.plannedTask;

        const updatedPlannedTask = await PlannedHabitService.createOrUpdate(
            context,
            dayKey,
            plannedTask
        );
        const response: CreatePlannedTaskResponse = { ...SUCCESS, plannedTask: updatedPlannedTask };
        res.json(response);
    })
);

plannedDayRouter.put(
    ['/planned-task/', '/v1/planned-task/'],
    authenticate,
    authorize,
    runEndpoint(async (req, res) => {
        const context = await ContextService.get(req);
        const plannedTask: PlannedTask = req.body.plannedTask;

        const updatedPlannedTask = await PlannedHabitService.update(context, plannedTask);
        const response: UpdatePlannedTaskResponse = { ...SUCCESS, plannedTask: updatedPlannedTask };
        res.json(response);
    })
);

export default plannedDayRouter;
