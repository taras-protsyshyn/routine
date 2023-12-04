import { join } from 'path';
import { promises } from 'fs';

import { IRoutineTask, IRoutineTasks } from './interfaces/tasks';
import { App, MarkdownView, TFile } from 'obsidian';
import { RoutinePlugin } from './plugin';
import { extractJSONfromNote } from './utils/extractJSONfromNote';

import moment, { Moment } from 'moment';

export class RoutineTasks {
  plugin: RoutinePlugin;
  app: App;
  data: RoutineTasks;
  sectionTitle: string;

  constructor(app: App, plugin: RoutinePlugin) {
    this.app = app;
    this.plugin = plugin;
    this.sectionTitle = 'Routine Tasks';
  }

  getViewData() {
    const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    return view?.getViewData() || '';
  }

  checkIfNoteAlreadyContainsTask(task: IRoutineTask) {
    const content = this.getViewData();

    return content.includes(`] ${task.name}`);
  }

  // TODO: add ability to set array of values for frequency
  checkFrequency(task: IRoutineTask, noteDate: Moment): boolean {
    switch (true) {
      case task.frequency.includes('/day'): {
        const per = Number(task.frequency.split('/')[2]) || 1;
        const diff = noteDate.diff(this.parseDate(task.start_date), 'days');

        return diff % per === 0;
      }
      case task.frequency.includes('/month'): {
        const day = Number(task.frequency.split('/')[2]) || 1;

        return noteDate.get('D') === day;
      }

      // @ts-ignore
      case noteDate._locale._weekdays.some(w => task.frequency.includes(w.toLowerCase())): {
        const weekDay = task.frequency.split('/')[1] || '';

        return noteDate.format('dddd').toLowerCase() === weekDay.toLowerCase();
      }

      default:
        return false;
    }
  }

  //   TODO: better to move it to utils
  parseDate(date?: string) {
    return moment(date, this.plugin.settings.dailyNoteFormat, true);
  }

  isNoteInRange(task: IRoutineTask, noteDate: Moment) {
    return noteDate.isBetween(
      this.parseDate(task.start_date),
      task.end_date ? this.parseDate(task.end_date) : moment().add(2, 'year'),
      undefined,
      '[]',
    );
  }

  async getData(): Promise<IRoutineTasks> {
    // @ts-ignore
    const basePath = this.app.vault.adapter.basePath as string;
    const pathToRoutineTasks = join(basePath, this.plugin.settings.pathToRoutineTasks);
    const taskFile = await promises.readFile(pathToRoutineTasks, 'utf-8');

    return extractJSONfromNote<IRoutineTasks>(taskFile);
  }

  async relatedTask(file: TFile) {
    const noteDate = this.parseDate(file.basename);
    const data = await this.getData();

    return data.tasks
      .filter(task => this.isNoteInRange(task, noteDate))
      .filter(task => this.checkFrequency(task, noteDate))
      .filter(task => !this.checkIfNoteAlreadyContainsTask(task));
  }

  formattedTasks(tasks: IRoutineTasks['tasks']) {
    return tasks.map(t => ` - [ ] ${t.name} #${t.frequency}`).join('\n');
  }

  async insertTasks(file: TFile) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const relatedTasks = await this.relatedTask(file);
    if (!relatedTasks.length) return;

    const formattedTasks = this.formattedTasks(relatedTasks);
    const content = this.getViewData();

    // TODO: need to update logic for inserting this section, in some case its a doble creating it
    const title = `\n## ${this.sectionTitle}\n\n`;

    if (content.includes(title)) {
      view?.setViewData(
        content
          .split(title)
          .map((str, i) => (i === 1 ? `${formattedTasks}\n${str}` : str))
          .join(title),
        false,
      );
    } else {
      view?.setViewData(`${content}${title}${formattedTasks}`, false);
    }
  }
}
