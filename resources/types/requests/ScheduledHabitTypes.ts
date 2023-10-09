import { Response } from "./RequestTypes";
import { ScheduledHabit } from "../../schema";

export interface CreateScheduledHabitRequest {
  taskId: number;
  description?: string;
  daysOfWeekIds?: number[];
  timesOfDayIds?: number[]
  quantity?: number;
  unitId?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateScheduledHabitResponse extends Response {
  scheduledHabit?: ScheduledHabit;
}

export interface GetScheduledHabitResponse extends Response {
  scheduledHabit?: ScheduledHabit;
}