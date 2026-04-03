import { App, PluginSettingTab, Setting } from 'obsidian';
import GitLabWikiPlugin from './main';

export interface GitLabWikiSettings {
    ignoreDirs: string[];
    ignoreFiles: string[];
}

export const DEFAULT_SETTINGS: GitLabWikiSettings = {
    ignoreDirs: ['.git', '.obsidian', '.tools', '.gitlab', '.trash', 'templates', 'Templates'],
    ignoreFiles: ['_sidebar.md', 'home.md', 'README.md'],
};

export class GitLabWikiSettingTab extends PluginSettingTab {
    plugin: GitLabWikiPlugin;

    constructor(app: App, plugin: GitLabWikiPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'GitLab Wiki Publisher' });

        new Setting(containerEl)
            .setName('Игнорировать папки')
            .setDesc('Через запятую')
            .addText(text => text
                .setValue(this.plugin.settings.ignoreDirs.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.ignoreDirs = value.split(',').map(s => s.trim()).filter(Boolean);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Игнорировать файлы')
            .setDesc('Через запятую')
            .addText(text => text
                .setValue(this.plugin.settings.ignoreFiles.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.ignoreFiles = value.split(',').map(s => s.trim()).filter(Boolean);
                    await this.plugin.saveSettings();
                }));
    }
}