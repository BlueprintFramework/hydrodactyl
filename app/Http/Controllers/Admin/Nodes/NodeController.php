<?php

namespace Pterodactyl\Http\Controllers\Admin\Nodes;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Pterodactyl\Models\Node;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Illuminate\Support\Facades\DB;

class NodeController extends Controller
{
    /**
     * NodeController constructor.
     */
    public function __construct(private ViewFactory $view) {}

    /**
     * Returns a listing of nodes on the system.
     */
    public function index(Request $request): View
    {
        $nodes = QueryBuilder::for(
            Node::query()->with('location')->withCount('servers')
        )
            ->allowedFilters(['uuid', 'name'])
            ->allowedSorts(['id'])
            ->paginate(25);

        // Single aggregate query instead of N+1 per-node queries.
        $stats = DB::table('servers')
            ->select(
                'node_id',
                DB::raw('COALESCE(SUM(memory), 0) as sum_memory'),
                DB::raw('COALESCE(SUM(disk), 0) as sum_disk')
            )
            ->whereIn('node_id', $nodes->pluck('id'))
            ->where('exclude_from_resource_calculation', false)
            ->groupBy('node_id')
            ->get()
            ->keyBy('node_id');

        foreach ($nodes as $node) {
            $nodeStats = $stats->get($node->id, (object) ['sum_memory' => 0, 'sum_disk' => 0]);

            $memoryPercent = $node->memory > 0
                ? ($nodeStats->sum_memory / $node->memory) * 100
                : 0;
            $diskPercent = $node->disk > 0
                ? ($nodeStats->sum_disk / $node->disk) * 100
                : 0;

            $node->memory_percent = round($memoryPercent);
            $node->memory_color = $memoryPercent < 50 ? '#50af51' : ($memoryPercent < 70 ? '#e0a800' : '#d9534f');
            $node->allocated_memory = humanizeSize($nodeStats->sum_memory * 1024 * 1024);
            $node->total_memory = humanizeSize($node->memory * 1024 * 1024);

            $node->disk_percent = round($diskPercent);
            $node->disk_color = $diskPercent < 50 ? '#50af51' : ($diskPercent < 70 ? '#e0a800' : '#d9534f');
            $node->allocated_disk = humanizeSize($nodeStats->sum_disk * 1024 * 1024);
            $node->total_disk = humanizeSize($node->disk * 1024 * 1024);
        }

        return $this->view->make('admin.nodes.index', ['nodes' => $nodes]);
    }
}
