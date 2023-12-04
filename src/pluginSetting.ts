import { App, PluginSettingTab, Setting } from 'obsidian';

import { RoutinePlugin } from './plugin';

export class SampleSettingTab extends PluginSettingTab {
  plugin: RoutinePlugin;

  constructor(app: App, plugin: RoutinePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Properties name')
      .setDesc('Set the name of properties for count of viewed')
      .addText(text =>
        text
          .setPlaceholder('Properties name')
          .setValue(this.plugin.settings.nameOfCountField)
          .onChange(async value => {
            // TODO: will be nice to have a logic on update the value name grab the all previous value and add to new
            this.plugin.settings.nameOfCountField = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Routine file')
      .setDesc('Set the path to your file with routine')
      .addText(
        (
          text, //TODO: will be nice to have here aucompleat
        ) =>
          text
            .setPlaceholder('Routine/tasks')
            .setValue(this.plugin.settings.pathToRoutineTasks)
            .onChange(async value => {
              this.plugin.settings.pathToRoutineTasks = value;

              await this.plugin.saveSettings();
            }),
      );
  }
}
