import { join } from 'path';
import { existsSync, promises } from 'fs';
import { MarkdownView, Plugin, TFile, parseYaml, stringifyYaml } from 'obsidian';
import moment from 'moment';

import { SampleSettingTab } from './pluginSetting';
import { RoutineTasks } from './routineTasks';
import { DEFAULT_SETTINGS, PluginSettings } from './constants/pluginSettings';

export class RoutinePlugin extends Plugin {
  settings: PluginSettings;
  routineTasks: RoutineTasks;

  async onload() {
    await this.loadSettings();

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this));

    this.routineTasks = new RoutineTasks(this.app, this);

    this.registerEvent(
      this.app.workspace.on('file-open', async (file: TFile) => {
        if (this.isDailyNote(file) && this.settings.pathToRoutineTasks) {
          await this.routineTasks.insertTasks(file);
        }

        this.updateCountOfNoteViewed();
      }),
    );
  }

  onunload() {}

  get dailyNotes() {
    // @ts-ignore
    const basePath = this.app.vault.adapter.basePath as string;
    const configDir = this.app.vault.configDir;

    return {
      path: join(basePath, configDir, 'daily-notes.json'),
      settings: { format: DEFAULT_SETTINGS.dailyNoteFormat },
    };
  }

  // TODO: probably better will be move this logic to settings
  async getDailyNoteFormat() {
    const isSettingsExist = existsSync(this.dailyNotes.path);

    if (isSettingsExist) {
      let format = DEFAULT_SETTINGS.dailyNoteFormat;

      const file = await promises.readFile(this.dailyNotes.path, 'utf-8');

      format = (JSON.parse(file) as { format: string }).format;

      return format;
    }

    return this.dailyNotes.settings.format;
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      { dailyNoteFormat: await this.getDailyNoteFormat() },
      await this.loadData(),
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  updateCountOfNoteViewed() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const propName = this.settings.nameOfCountField;
    const content = view?.getViewData() || '';

    const hadProps = content.startsWith('---');
    const props = hadProps ? parseYaml(content.split('---')[1]) : {};

    const prevCount = Number(props[propName]) || 0;
    props[propName] = prevCount ? prevCount + 1 : 1;

    const updatedText = hadProps
      ? content
          ?.split('---')
          .map((content, index) => (index === 1 ? `\n${stringifyYaml(props)}` : content))
          .join('---')
      : `---\n${stringifyYaml(props)}---\n${content}`;

    view?.setViewData(updatedText, false);
  }

  isDailyNote(file: TFile) {
    return moment(file.basename, this.settings.dailyNoteFormat, true).isValid();
  }
}
