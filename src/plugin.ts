import { MarkdownView, Plugin, TFile, parseYaml, stringifyYaml } from 'obsidian';

import { SampleSettingTab } from './pluginSetting';
import { DEFAULT_SETTINGS, PluginSettings } from './constants/pluginSettings';

export class RoutinePlugin extends Plugin {
  settings: PluginSettings;

  async onload() {
    await this.loadSettings();

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on('file-open', (file: TFile) => {
        this.updateCountOfNoteViewed();
      }),
    );
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
}
