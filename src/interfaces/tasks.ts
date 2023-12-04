export interface IRoutineTask {
  name: string;
  frequency: string;
  start_date: string;
  end_date?: string;
}

export interface IRoutineTasks {
  tasks: IRoutineTask[];
}
