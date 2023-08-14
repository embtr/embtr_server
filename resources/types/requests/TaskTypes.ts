import { Task as TaskModel, TaskPreference } from "../../schema";
import { Response } from "./RequestTypes";

export interface GetTaskResponse extends Response {
  task?: TaskModel;
}

export interface SearchTasksResponse extends Response {
  tasks: TaskModel[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
}

export interface CreateTaskResponse extends Response {
  task?: TaskModel;
}

export interface TaskPreferenceRequest {
  unitId?: number;
  quantity?: number;
}

export interface TaskPreferenceResponse extends Response {
  preference?: TaskPreference
}
