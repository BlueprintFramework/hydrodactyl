<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use PDO;
use PDOException;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Location;
use Pterodactyl\Models\Database;
use Illuminate\Http\Request;
use Pterodactyl\Models\DatabaseHost;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Exceptions\Service\HasActiveServersException;
use Pterodactyl\Services\Databases\Hosts\HostUpdateService;
use Pterodactyl\Services\Databases\Hosts\HostCreationService;
use Pterodactyl\Services\Databases\Hosts\HostDeletionService;
use Pterodactyl\Http\Requests\Admin\DatabaseHostFormRequest;
use Pterodactyl\Contracts\Repository\DatabaseRepositoryInterface;
use Pterodactyl\Contracts\Repository\LocationRepositoryInterface;
use Pterodactyl\Contracts\Repository\DatabaseHostRepositoryInterface;

class DatabaseHostController extends Controller
{
    /**
     * DatabaseHostController constructor.
     */
    public function __construct(
        private DatabaseHostRepositoryInterface $repository,
        private DatabaseRepositoryInterface $databaseRepository,
        private LocationRepositoryInterface $locationRepository,
        private HostCreationService $creationService,
        private HostUpdateService $updateService,
        private HostDeletionService $deletionService,
    ) {
    }

    /**
     * Return every database host with its database count and linked node.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->repository->getWithViewDetails()
                ->map(fn (DatabaseHost $host) => $this->transform($host) + [
                    'databases_count' => (int) $host->databases_count,
                ])
                ->values(),
        ]);
    }

    /**
     * Return a single database host with a page of its databases.
     */
    public function view(DatabaseHost $host): JsonResponse
    {
        $databases = $this->databaseRepository->getDatabasesForHost($host->id);
        $host->loadMissing('node');

        return response()->json([
            'data' => $this->transform($host) + [
                'databases' => [
                    'items' => collect($databases->items())
                        ->map(function (Database $database) {
                            $server = $database->getRelation('server');

                            return [
                                'id' => $database->id,
                                'database' => $database->database,
                                'username' => $database->username,
                                'remote' => $database->remote,
                                'max_connections' => $database->max_connections,
                                'server' => $server instanceof Server ? [
                                    'id' => $server->id,
                                    'name' => $server->name,
                                ] : null,
                            ];
                        })
                        ->values(),
                    'pagination' => [
                        'total' => $databases->total(),
                        'count' => count($databases->items()),
                        'per_page' => $databases->perPage(),
                        'current_page' => $databases->currentPage(),
                        'total_pages' => $databases->lastPage(),
                    ],
                ],
            ],
        ]);
    }

    /**
     * Return the nodes a database host can be linked to, grouped by location name.
     */
    public function options(): JsonResponse
    {
        return response()->json([
            'nodes' => $this->locationRepository->getAllWithNodes()
                ->flatMap(function (Location $location) {
                    $nodes = [];
                    foreach ($location->nodes as $node) {
                        $nodes[] = [
                            'id' => $node->id,
                            'name' => $node->name,
                            'location' => $location->short,
                        ];
                    }

                    return $nodes;
                })
                ->values(),
        ]);
    }

    /**
     * Create a new database host.
     */
    public function store(DatabaseHostFormRequest $request): JsonResponse
    {
        try {
            $host = $this->creationService->handle($request->normalize());
        } catch (\Exception $exception) {
            $message = $this->connectionErrorMessage($exception);
            if (is_null($message)) {
                throw $exception;
            }

            return response()->json(['message' => $message], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json(['data' => $this->transform($host)], JsonResponse::HTTP_CREATED);
    }

    /**
     * Update an existing database host.
     */
    public function update(DatabaseHostFormRequest $request, DatabaseHost $host): JsonResponse
    {
        try {
            $host = $this->updateService->handle($host->id, $request->normalize());
        } catch (\Exception $exception) {
            $message = $this->connectionErrorMessage($exception);
            if (is_null($message)) {
                throw $exception;
            }

            return response()->json(['message' => $message], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json(['data' => $this->transform($host)]);
    }

    /**
     * Delete a database host, provided it has no databases attached.
     */
    public function destroy(DatabaseHost $host): JsonResponse
    {
        try {
            $this->deletionService->handle($host->id);
        } catch (HasActiveServersException $exception) {
            return response()->json(['message' => $exception->getMessage()], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Test the supplied credentials against a MySQL host without persisting anything.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $data = $request->validate([
            'host' => 'required|string',
            'port' => 'required|integer|min:1|max:65535',
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        try {
            $dsn = "mysql:host={$data['host']};port={$data['port']};charset=utf8";

            $pdo = new PDO($dsn, $data['username'], $data['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5, // 5 second timeout
            ]);

            $version = $pdo->query('SELECT VERSION() as version')->fetchColumn();

            $grants = $pdo->query('SHOW GRANTS FOR CURRENT_USER()')->fetchAll(PDO::FETCH_COLUMN);
            $hasGrantOption = false;
            foreach ($grants as $grant) {
                if (stripos($grant, 'GRANT OPTION') !== false) {
                    $hasGrantOption = true;
                    break;
                }
            }

            $message = "Successfully connected to MySQL server (Version: {$version}).";
            if (!$hasGrantOption) {
                $message .= ' Warning: The user appears to lack GRANT OPTION permission which is required for creating databases and users.';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'version' => $version,
                'has_grant_option' => $hasGrantOption,
            ]);
        } catch (PDOException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $exception->getMessage(),
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\Exception $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $exception->getMessage(),
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    /**
     * Map a database host into the shape consumed by the admin interface.
     */
    private function transform(DatabaseHost $host): array
    {
        return [
            'id' => $host->id,
            'name' => $host->name,
            'host' => $host->host,
            'port' => (int) $host->port,
            'username' => $host->username,
            'max_databases' => $host->max_databases,
            'node_id' => $host->node_id,
            'node' => $host->node ? [
                'id' => $host->node->id,
                'name' => $host->node->name,
            ] : null,
        ];
    }

    /**
     * Extract a user facing message from a PDO related failure, if any. Returns
     * null when the exception has nothing to do with the database connection.
     */
    private function connectionErrorMessage(\Exception $exception): ?string
    {
        if (!$exception instanceof PDOException && !$exception->getPrevious() instanceof PDOException) {
            return null;
        }

        return sprintf(
            'There was an error while trying to connect to the host or while executing a query: "%s"',
            $exception->getMessage()
        );
    }
}
