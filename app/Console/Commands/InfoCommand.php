<?php

namespace Pterodactyl\Console\Commands;

use Illuminate\Console\Command;
use Pterodactyl\Services\Helpers\SoftwareVersionService;
use Illuminate\Contracts\Config\Repository as ConfigRepository;

class InfoCommand extends Command
{
    protected $description = 'Displays the application, database, and email configurations along with the panel version.';

    protected $signature = 'p:info';

    /**
     * VersionCommand constructor.
     */
    public function __construct(private ConfigRepository $config, private SoftwareVersionService $versionService)
    {
        parent::__construct();
    }

    /**
     * Handle execution of command.
     */
    public function handle()
    {
        $this->output->title(__('command/messages.info.version_information'));
        $this->table([], [
            [__('command/messages.info.panel_version'), $this->config->get('app.version')],
            [__('command/messages.info.latest_version'), $this->versionService->getPanel()],
            [__('command/messages.info.up_to_date'), $this->versionService->isLatestPanel() ? __('command/messages.info.yes') : $this->formatText(__('command/messages.info.no'), 'bg=red')],
            [__('command/messages.info.unique_identifier'), $this->config->get('pterodactyl.service.author')],
        ], 'compact');

        $this->output->title(__('command/messages.info.application_configuration'));
        $this->table([], [
            [__('command/messages.info.environment'), $this->formatText($this->config->get('app.env'), $this->config->get('app.env') === 'production' ?: 'bg=red')],
            [__('command/messages.info.debug_mode'), $this->formatText($this->config->get('app.debug') ? __('command/messages.info.yes') : __('command/messages.info.no'), !$this->config->get('app.debug') ?: 'bg=red')],
            [__('command/messages.info.installation_url'), $this->config->get('app.url')],
            [__('command/messages.info.installation_directory'), base_path()],
            [__('command/messages.info.timezone'), $this->config->get('app.timezone')],
            [__('command/messages.info.cache_driver'), $this->config->get('cache.default')],
            [__('command/messages.info.queue_driver'), $this->config->get('queue.default')],
            [__('command/messages.info.session_driver'), $this->config->get('session.driver')],
            [__('command/messages.info.filesystem_driver'), $this->config->get('filesystems.default')],
            [__('command/messages.info.default_theme'), $this->config->get('themes.active')],
            [__('command/messages.info.proxies'), $this->config->get('trustedproxies.proxies')],
        ], 'compact');

        $this->output->title(__('command/messages.info.database_configuration'));
        $driver = $this->config->get('database.default');
        $this->table([], [
            [__('command/messages.info.driver'), $driver],
            [__('command/messages.info.host'), $this->config->get("database.connections.$driver.host")],
            [__('command/messages.info.port'), $this->config->get("database.connections.$driver.port")],
            [__('command/messages.info.database'), $this->config->get("database.connections.$driver.database")],
            [__('command/messages.info.username'), $this->config->get("database.connections.$driver.username")],
        ], 'compact');

        // TODO: Update this to handle other mail drivers
        $this->output->title(__('command/messages.info.email_configuration'));
        $this->table([], [
            [__('command/messages.info.driver'), $this->config->get('mail.default')],
            [__('command/messages.info.host'), $this->config->get('mail.mailers.smtp.host')],
            [__('command/messages.info.port'), $this->config->get('mail.mailers.smtp.port')],
            [__('command/messages.info.username'), $this->config->get('mail.mailers.smtp.username')],
            [__('command/messages.info.from_address'), $this->config->get('mail.from.address')],
            [__('command/messages.info.from_name'), $this->config->get('mail.from.name')],
            [__('command/messages.info.encryption'), $this->config->get('mail.mailers.smtp.encryption')],
        ], 'compact');
    }

    /**
     * Format output in a Name: Value manner.
     */
    private function formatText(string $value, string $opts = ''): string
    {
        return sprintf('<%s>%s</>', $opts, $value);
    }
}
