import {
    rawDataToFileObject,
    rawDataToServerAllocation,
    rawDataToServerBackup,
    rawDataToServerEggVariable,
} from '@/api/transformers';

describe('@/api/transformers.ts', () => {
    describe('rawDataToServerAllocation()', () => {
        it('should transform allocation data', () => {
            const data = {
                attributes: {
                    id: 1,
                    ip: '127.0.0.1',
                    ip_alias: null,
                    port: 25565,
                    notes: null,
                    is_default: true,
                },
            };
            const result = rawDataToServerAllocation(data);
            expect(result.id).toBe(1);
            expect(result.ip).toBe('127.0.0.1');
            expect(result.port).toBe(25565);
            expect(result.isDefault).toBe(true);
            expect(result.alias).toBeNull();
            expect(result.notes).toBeNull();
        });
    });

    describe('rawDataToFileObject()', () => {
        const fileData = {
            attributes: {
                name: 'server.jar',
                mode: '0644',
                mode_bits: '0644',
                size: 1024000,
                is_file: true,
                is_symlink: false,
                mimetype: 'application/jar',
                created_at: '2024-01-01T00:00:00Z',
                modified_at: '2024-01-02T00:00:00Z',
            },
        };

        it('should transform file data', () => {
            const result = rawDataToFileObject(fileData);
            expect(result.name).toBe('server.jar');
            expect(result.isFile).toBe(true);
            expect(result.isSymlink).toBe(false);
            expect(result.size).toBe(1024000);
            expect(result.mimetype).toBe('application/jar');
        });

        it('should generate a unique key', () => {
            const result = rawDataToFileObject(fileData);
            expect(result.key).toMatch(/^(file|dir)_/);
        });

        it('should parse date strings', () => {
            const result = rawDataToFileObject(fileData);
            expect(result.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
            expect(result.modifiedAt).toEqual(new Date('2024-01-02T00:00:00Z'));
        });

        describe('isArchiveType()', () => {
            it('should return true for zip files', () => {
                const data = {
                    ...fileData,
                    attributes: { ...fileData.attributes, mimetype: 'application/zip' },
                };
                expect(rawDataToFileObject(data).isArchiveType()).toBe(true);
            });

            it('should return true for gzip files', () => {
                const data = {
                    ...fileData,
                    attributes: { ...fileData.attributes, mimetype: 'application/gzip' },
                };
                expect(rawDataToFileObject(data).isArchiveType()).toBe(true);
            });

            it('should return false for non-archive files', () => {
                const data = {
                    ...fileData,
                    attributes: { ...fileData.attributes, mimetype: 'text/plain' },
                };
                expect(rawDataToFileObject(data).isArchiveType()).toBe(false);
            });

            it('should return false for directories', () => {
                const data = {
                    attributes: {
                        ...fileData.attributes,
                        is_file: false,
                        mimetype: 'inode/directory',
                    },
                };
                expect(rawDataToFileObject(data).isArchiveType()).toBe(false);
            });
        });

        describe('isEditable()', () => {
            it('should return false for archive files', () => {
                const data = {
                    ...fileData,
                    attributes: { ...fileData.attributes, mimetype: 'application/zip' },
                };
                expect(rawDataToFileObject(data).isEditable()).toBe(false);
            });

            it('should return false for directories', () => {
                const data = {
                    attributes: {
                        ...fileData.attributes,
                        is_file: false,
                        mimetype: 'inode/directory',
                    },
                };
                expect(rawDataToFileObject(data).isEditable()).toBe(false);
            });

            it('should return true for text files', () => {
                const data = {
                    ...fileData,
                    attributes: { ...fileData.attributes, mimetype: 'text/plain' },
                };
                expect(rawDataToFileObject(data).isEditable()).toBe(true);
            });
        });
    });

    describe('rawDataToServerBackup()', () => {
        const backupData = {
            attributes: {
                uuid: 'abc-123',
                is_successful: true,
                is_locked: false,
                is_automatic: true,
                is_software_change: true,
                name: 'Daily Backup',
                ignored_files: '*.log',
                checksum: 'sha256:abc',
                bytes: 1048576,
                size_gb: 0.001,
                adapter: 's3',
                is_rustic: false,
                snapshot_id: null,
                created_at: '2024-01-01T00:00:00Z',
                completed_at: '2024-01-01T01:00:00Z',
                expires_at: '2024-01-04T00:00:00Z',
                job_id: null,
                job_status: 'completed',
                job_progress: 100,
                job_message: null,
                job_error: null,
                job_started_at: null,
                job_last_updated_at: null,
                can_retry: false,
            },
        };

        it('should transform backup data', () => {
            const result = rawDataToServerBackup(backupData);
            expect(result.uuid).toBe('abc-123');
            expect(result.isSuccessful).toBe(true);
            expect(result.isSoftwareChange).toBe(true);
            expect(result.name).toBe('Daily Backup');
            expect(result.bytes).toBe(1048576);
            expect(result.adapter).toBe('s3');
        });

        it('should parse date fields', () => {
            const result = rawDataToServerBackup(backupData);
            expect(result.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
            expect(result.completedAt).toEqual(new Date('2024-01-01T01:00:00Z'));
            expect(result.expiresAt).toEqual(new Date('2024-01-04T00:00:00Z'));
        });

        it('should handle null completed_at', () => {
            const data = {
                attributes: {
                    ...backupData.attributes,
                    completed_at: null,
                    is_successful: false,
                },
            };
            const result = rawDataToServerBackup(data);
            expect(result.completedAt).toBeNull();
        });

        it('should determine isInProgress from job_status', () => {
            const pending = {
                attributes: { ...backupData.attributes, job_status: 'pending' },
            };
            expect(rawDataToServerBackup(pending).isInProgress).toBe(true);

            const running = {
                attributes: { ...backupData.attributes, job_status: 'running' },
            };
            expect(rawDataToServerBackup(running).isInProgress).toBe(true);

            const done = {
                attributes: { ...backupData.attributes, job_status: 'completed' },
            };
            expect(rawDataToServerBackup(done).isInProgress).toBe(false);
        });
    });

    describe('rawDataToServerEggVariable()', () => {
        it('should transform egg variable data', () => {
            const data = {
                attributes: {
                    name: 'Server JAR',
                    description: 'The JAR file to use',
                    env_variable: 'SERVER_JAR',
                    default_value: 'server.jar',
                    server_value: 'paper.jar',
                    is_editable: true,
                    rules: 'required|string|max:255',
                },
            };
            const result = rawDataToServerEggVariable(data);
            expect(result.name).toBe('Server JAR');
            expect(result.envVariable).toBe('SERVER_JAR');
            expect(result.serverValue).toBe('paper.jar');
            expect(result.isEditable).toBe(true);
            expect(result.rules).toEqual(['required', 'string', 'max:255']);
        });
    });
});
