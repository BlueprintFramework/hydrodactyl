/**
 * Helpers for uploading files and folders from the browser.
 *
 * The daemon writes every uploaded file to `directory/filename` and creates any missing
 * parent directories, so the folder structure is preserved by sending each file with a
 * `directory` pointing at its relative location.
 */

export interface UploadCandidate {
    file: File;
    /**
     * The path of the file relative to the folder or files that were selected, using
     * forward slashes. For example: `my-folder/sub/file.txt`.
     */
    relativePath: string;
}

export interface CollectedUpload {
    files: UploadCandidate[];
    /**
     * Every directory that was encountered, relative to the selected root. This is only
     * populated when dropping folders (the file picker cannot report empty directories).
     */
    directories: string[];
}

/**
 * Remove empty, `.` and `..` segments from a browser-provided relative path. Browsers
 * normally hand us a safe path, but this is defense in depth against a crafted file name
 * being used to escape the server root.
 */
export const sanitizeRelativePath = (path: string): string =>
    path
        .replace(/\\/g, '/')
        .split('/')
        .filter((segment) => segment !== '' && segment !== '.' && segment !== '..')
        .join('/');

/**
 * Return the directory portion of a relative path, or an empty string when the file is
 * at the root of the selection.
 */
export const getRelativeDirectory = (relativePath: string): string => {
    const index = relativePath.lastIndexOf('/');

    return index === -1 ? '' : relativePath.slice(0, index);
};

/**
 * Returns the directories that do not contain any files (directly or in a subdirectory),
 * so that empty folders are still created on the server.
 */
export const getEmptyDirectories = ({ files, directories }: CollectedUpload): string[] => {
    const populated = new Set<string>();

    for (const { relativePath } of files) {
        const segments = relativePath.split('/').slice(0, -1);

        for (let i = 1; i <= segments.length; i++) {
            populated.add(segments.slice(0, i).join('/'));
        }
    }

    return directories.filter((directory) => !populated.has(directory));
};

/**
 * Collect uploads from a plain file list. Folder selections expose the relative path of
 * each file through `webkitRelativePath`.
 */
export const collectFromFileList = (files: FileList): CollectedUpload => ({
    files: Array.from(files).map((file) => ({
        file,
        relativePath: sanitizeRelativePath(file.webkitRelativePath || file.name),
    })),
    directories: [],
});

/**
 * Synchronously capture the entries from a drop event. This must be called during the drop
 * handler itself because the data transfer items become invalid once the event completes.
 */
export const getFileSystemEntries = (items: DataTransferItemList): FileSystemEntry[] => {
    const entries: FileSystemEntry[] = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item) {
            continue;
        }

        if (item.kind !== 'file' || typeof item.webkitGetAsEntry !== 'function') {
            continue;
        }

        const entry = item.webkitGetAsEntry();
        if (entry) {
            entries.push(entry);
        }
    }

    return entries;
};

const readAllEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> =>
    new Promise((resolve, reject) => {
        const entries: FileSystemEntry[] = [];

        const read = () => {
            reader.readEntries((batch) => {
                if (batch.length === 0) {
                    resolve(entries);

                    return;
                }

                entries.push(...batch);
                read();
            }, reject);
        };

        read();
    });

const getFile = (entry: FileSystemFileEntry): Promise<File> =>
    new Promise((resolve, reject) => entry.file(resolve, reject));

const walkEntry = async (entry: FileSystemEntry, collected: CollectedUpload): Promise<void> => {
    if (entry.isDirectory) {
        const relativePath = sanitizeRelativePath(entry.fullPath);
        if (relativePath !== '') {
            collected.directories.push(relativePath);
        }

        const children = await readAllEntries((entry as FileSystemDirectoryEntry).createReader());
        for (const child of children) {
            await walkEntry(child, collected);
        }

        return;
    }

    if (entry.isFile) {
        collected.files.push({
            file: await getFile(entry as FileSystemFileEntry),
            relativePath: sanitizeRelativePath(entry.fullPath),
        });
    }
};

/**
 * Recursively read a set of dropped file system entries, preserving the folder structure.
 */
export const collectFromEntries = async (entries: FileSystemEntry[]): Promise<CollectedUpload> => {
    const collected: CollectedUpload = { files: [], directories: [] };

    for (const entry of entries) {
        await walkEntry(entry, collected);
    }

    return collected;
};
