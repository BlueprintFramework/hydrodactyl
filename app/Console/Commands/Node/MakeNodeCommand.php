<?php

namespace Pterodactyl\Console\Commands\Node;

use Illuminate\Console\Command;
use Pterodactyl\Services\Nodes\NodeCreationService;

class MakeNodeCommand extends Command
{
    protected $signature = 'p:node:make
                            {--name= : A name to identify the node.}
                            {--description= : A description to identify the node.}
                            {--locationId= : A valid locationId.}
                            {--fqdn= : The domain name (e.g node.example.com) to be used for connecting to the daemon. An IP address may only be used if you are not using SSL for this node.}
                            {--internal-fqdn= : Internal domain name for panel-to-Wings communication (optional).}
                            {--public= : Should the node be public or private? (public=1 / private=0).}
                            {--scheme= : Which scheme should be used? (Enable SSL=https / Disable SSL=http).}
                            {--proxy= : Is the daemon behind a proxy? (Yes=1 / No=0).}
                            {--maintenance= : Should maintenance mode be enabled? (Enable Maintenance mode=1 / Disable Maintenance mode=0).}
                            {--maxMemory= : Set the max memory amount.}
                            {--overallocateMemory= : Enter the amount of ram to overallocate (% or -1 to overallocate the maximum).}
                            {--maxDisk= : Set the max disk amount.}
                            {--overallocateDisk= : Enter the amount of disk to overallocate (% or -1 to overallocate the maximum).}
                            {--uploadSize= : Enter the maximum upload filesize.}
                            {--daemonListeningPort= : Enter the wings listening port.}
                            {--daemonSFTPPort= : Enter the wings SFTP listening port.}
                            {--daemonBase= : Enter the base folder.}
                            {--daemonType= : Enter the daemon Backend.}
                            {--backupDisk= : Enter the Backup type}
                            {--bucket= : Enter the S3 bucket ID}';

    protected $description = 'Creates a new node on the system via the CLI.';

    /**
     * MakeNodeCommand constructor.
     */
    public function __construct(private NodeCreationService $creationService)
    {
        parent::__construct();
    }

    /**
     * Handle the command execution process.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    public function handle()
    {
        $data['name'] = $this->option('name') ?? $this->ask(__('command/messages.node.ask_short'));
        $data['description'] = $this->option('description') ?? $this->ask(__('command/messages.node.ask_description'));
        $data['location_id'] = $this->option('locationId') ?? $this->ask(__('command/messages.node.ask_location_id'));
        $data['scheme'] = $this->option('scheme') ?? $this->anticipate(
            __('command/messages.node.ask_scheme'),
            ['https', 'http'],
            'https'
        );
        $data['fqdn'] = $this->option('fqdn') ?? $this->ask(__('command/messages.node.ask_fqdn'));
        $data['internal_fqdn'] = $this->option('internal-fqdn') ?? $this->ask(__('command/messages.node.ask_internal_fqdn'), '');
        $data['public'] = $this->option('public') ?? $this->confirm(__('command/messages.node.ask_public'), true);
        $data['behind_proxy'] = $this->option('proxy') ?? $this->confirm(__('command/messages.node.ask_behind_proxy'));
        $data['maintenance_mode'] = $this->option('maintenance') ?? $this->confirm(__('command/messages.node.ask_maintenance'));
        $data['memory'] = $this->option('maxMemory') ?? $this->ask(__('command/messages.node.ask_memory'));
        $data['memory_overallocate'] = $this->option('overallocateMemory') ?? $this->ask(__('command/messages.node.ask_memory_overallocate'));
        $data['disk'] = $this->option('maxDisk') ?? $this->ask(__('command/messages.node.ask_disk'));
        $data['disk_overallocate'] = $this->option('overallocateDisk') ?? $this->ask(__('command/messages.node.ask_disk_overallocate'));
        $data['upload_size'] = $this->option('uploadSize') ?? $this->ask(__('command/messages.node.ask_upload_size'), '100');
        $data['daemonListen'] = $this->option('daemonListeningPort') ?? $this->ask(__('command/messages.node.ask_daemon_port'), '8080');
        $data['daemonSFTP'] = $this->option('daemonSFTPPort') ?? $this->ask(__('command/messages.node.ask_daemon_sftp_port'), '2022');
        $data['daemonBase'] = $this->option('daemonBase') ?? $this->ask(__('command/messages.node.ask_daemon_base'), '/var/lib/pterodactyl/volumes');
        $data['daemonType'] = $this->option('daemonType') ?? $this->ask(__('command/messages.node.ask_daemon_type'), 'wings');
        $data['backupDisk'] = $this->option('backupDisk') ?? $this->ask(__('command/messages.node.ask_backup_disk'), 'wings');
        $data['bucket'] = $this->option('bucket') ?: null;

        $node = $this->creationService->handle($data);
        $this->line(__('command/messages.node.created', ['location' => $data['location_id'], 'name' => $data['name'], 'id' => $node->id]));
    }
}
