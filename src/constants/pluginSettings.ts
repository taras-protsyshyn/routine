export interface PluginSettings {
  nameOfCountField: string;
  pathToRoutineTasks: string;
  dailyNoteFormat: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  nameOfCountField: 'count_of_viewed',
  dailyNoteFormat: 'YYYY-MM-DD',
  pathToRoutineTasks: '',
};
