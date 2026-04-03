import { Notice, Plugin, TFile, TFolder } from 'obsidian';
import { DEFAULT_SETTINGS, GitLabWikiSettings, GitLabWikiSettingTab } from './settings';

const RE_MD_LINK = /\[([^\]\n]+)\]\(([^)\n]+)\)/g;
const EXTERNAL_PREFIXES = ['http://', 'https://', '//', '#', 'mailto:'];

export default class GitLabWikiPlugin extends Plugin {
    settings!: GitLabWikiSettings;

    async onload() {
        await this.loadSettings();

        this.addRibbonIcon('upload', 'GitLab Wiki: Normalize', () => this.runNormalization());

        this.addCommand({
            id: 'normalize-gitlab-wiki',
            name: 'Normalize links and create folder indexes',
            callback: () => this.runNormalization(),
        });

        this.addSettingTab(new GitLabWikiSettingTab(this.app, this));
    }

    async runNormalization() {
        new Notice('GitLab Wiki: запуск...');
        let created = 0;
        let fixed = 0;

        // Шаг 1: создаём index-страницы для папок
        const allItems = this.app.vault.getAllLoadedFiles();
        const folders = allItems.filter(f => f instanceof TFolder) as TFolder[];

        for (const folder of folders) {
            if (this.isIgnoredFolder(folder)) continue;

            const parentPath = folder.parent?.path ?? '';
            const indexPath = parentPath ? `${parentPath}/${folder.name}.md` : `${folder.name}.md`;

            if (!this.app.vault.getAbstractFileByPath(indexPath)) {
                await this.app.vault.create(indexPath, '');
                created++;
            }
        }

        // Шаг 2: исправляем ссылки
        const files = this.app.vault.getMarkdownFiles();
        for (const file of files) {
            if (this.isIgnoredFile(file)) continue;
            const original = await this.app.vault.read(file);
            const updated = this.fixLinks(original);
            if (updated !== original) {
                await this.app.vault.modify(file, updated);
                fixed++;
            }
        }

        new Notice(`✓ Создано: ${created} страниц, исправлено: ${fixed} файлов`);
    }

    isIgnoredFolder(folder: TFolder): boolean {
        return folder.path.split('/').some(p =>
            p.startsWith('.') || this.settings.ignoreDirs.includes(p)
        );
    }

    isIgnoredFile(file: TFile): boolean {
        const parts = file.path.split('/');
        if (parts.some(p => p.startsWith('.') || this.settings.ignoreDirs.includes(p))) return true;
        return this.settings.ignoreFiles.includes(file.name);
    }

    fixLinks(content: string): string {
        return content.replace(RE_MD_LINK, (_, text, url) => `[${text}](${this.fixUrl(url)})`);
    }

    fixUrl(url: string): string {
        if (EXTERNAL_PREFIXES.some(p => url.startsWith(p))) return url;
        if (url.endsWith('.md')) url = url.slice(0, -3);
        if (!url.startsWith('./') && !url.startsWith('../') && !url.startsWith('/')) url = './' + url;
        return url;
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<GitLabWikiSettings>);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}