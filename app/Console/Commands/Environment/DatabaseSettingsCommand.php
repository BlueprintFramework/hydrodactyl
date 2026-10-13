<?php

namespace Pterodactyl\Console\Commands\Environment;

use Illuminate\Console\Command;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\DatabaseManager;
use Pterodactyl\Traits\Commands\EnvironmentWriterTrait;

class DatabaseSettingsCommand extends Command
{
    use EnvironmentWriterTrait;

    protected $description = 'Configure database settings for the Panel.';

    protected $signature = 'p:environment:database
                            {--host= : The connection address for the MySQL server.}
                            {--port= : The connection port for the MySQL server.}
                            {--database= : The database to use.}
                            {--username= : Username to use when connecting.}
                            {--password= : Password to use for this database.}';

    protected array $variables = [];

    /**
     * DatabaseSettingsCommand constructor.
     */
    public function __construct(private DatabaseManager $database, private Kernel $console)
    {
        parent::__construct();
    }

    /**
     * Handle command execution.
     *
     * @throws \Pterodactyl\Exceptions\PterodactylException
     */
    public function handle(): int
    {
        $this->output->note(__('command/messages.environment.database.localhost_note'));
        $this->variables['DB_HOST'] = $this->option('host') ?? $this->ask(
            __('command/messages.environment.database.ask_host'),
            config('database.connections.mysql.host', '127.0.0.1')
        );

        $this->variables['DB_PORT'] = $this->option('port') ?? $this->ask(
            __('command/messages.environment.database.ask_port'),
            config('database.connections.mysql.port', 3306)
        );

        $this->variables['DB_DATABASE'] = $this->option('database') ?? $this->ask(
            __('command/messages.environment.database.ask_name'),
            config('database.connections.mysql.database', 'panel')
        );

        $this->output->note(__('command/messages.environment.database.root_note'));
        $this->variables['DB_USERNAME'] = $this->option('username') ?? $this->ask(
            __('command/messages.environment.database.ask_username'),
            config('database.connections.mysql.username', 'pterodactyl')
        );

        $askForMySQLPassword = true;
        if (!empty(config('database.connections.mysql.password')) && $this->input->isInteractive()) {
            $this->variables['DB_PASSWORD'] = config('database.connections.mysql.password');
            $askForMySQLPassword = $this->confirm(__('command/messages.environment.database.ask_change_password'));
        }

        if ($askForMySQLPassword) {
            $this->variables['DB_PASSWORD'] = $this->option('password') ?? $this->secret(__('command/messages.environment.database.ask_password'));
        }

        try {
            $this->testMySQLConnection();
        } catch (\PDOException $exception) {
            $this->output->error(__('command/messages.environment.database.connection_failed', ['error' => $exception->getMessage()]));
            $this->output->error(__('command/messages.environment.database.not_saved'));

            if ($this->confirm(__('command/messages.environment.database.ask_retry'))) {
                $this->database->disconnect('_pterodactyl_command_test');

                return $this->handle();
            }

            return 1;
        }

        $this->writeToEnvironment($this->variables);

        $this->info($this->console->output());

        return 0;
    }

    /**
     * Test that we can connect to the provided MySQL instance and perform a selection.
     */
    private function testMySQLConnection()
    {
        config()->set('database.connections._pterodactyl_command_test', [
            'driver' => 'mysql',
            'host' => $this->variables['DB_HOST'],
            'port' => $this->variables['DB_PORT'],
            'database' => $this->variables['DB_DATABASE'],
            'username' => $this->variables['DB_USERNAME'],
            'password' => $this->variables['DB_PASSWORD'],
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'strict' => true,
        ]);

        $this->database->connection('_pterodactyl_command_test')->getPdo();
    }
}
