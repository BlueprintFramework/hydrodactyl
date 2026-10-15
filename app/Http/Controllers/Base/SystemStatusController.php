<?php

namespace Pterodactyl\Http\Controllers\Base;

use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SystemStatusController extends Controller
{
    /**
     * Get system metrics and status
     */
  public function index(): JsonResponse
  {
    try {
      $metrics = Cache::remember('system_metrics', 300, function () {
        return [
          'status' => 'running',
          'timestamp' => now()->toIso8601String(),
          'metrics' => [
            'uptime' => $this->getUptime(),
            'memory' => $this->getMemoryUsage(),
            'cpu' => $this->getCpuUsage(),
            'cpu_cores' => $this->getCpuCores(),
            'disk' => $this->getDiskUsage(),
          ],
          'system' => [
            'php_version' => PHP_VERSION,
            'os' => php_uname(),
            'hostname' => gethostname(),
            'load_average' => sys_getloadavg(),
          ]
        ];
      });

      return response()->json($metrics);

    } catch (\Exception $e) {
      return response()->json([
        'status' => 'error',
        'message' => 'Failed to retrieve system metrics',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  private function getMemoryUsage(): array
  {
    if (PHP_OS_FAMILY === 'Darwin') {
      $memory = shell_exec('vm_stat');
      if (!$memory) {
        throw new \RuntimeException('Failed to execute vm_stat command');
      }

      // Parse memory stats more reliably
      $stats = [];
      foreach (explode("\n", $memory) as $line) {
        if (preg_match('/Pages\s+([^:]+):\s+(\d+)/', $line, $matches)) {
          $stats[strtolower($matches[1])] = (int) $matches[2];
        }
      }

      $page_size = 4096; // Default page size for macOS

      $total_memory = $this->getTotalMemoryMac();
      $free_memory = ($stats['free'] ?? 0) * $page_size;
      $used_memory = $total_memory - $free_memory;

      return [
        'total' => $total_memory,
        'used' => $used_memory,
        'free' => $free_memory,
        'page_size' => $page_size
      ];
    }

    // Linux memory calculation
    $memory = @file_get_contents('/proc/meminfo');
    if ($memory === false) {
      throw new \RuntimeException('Failed to read memory information');
    }

    $stats = [];
    foreach (explode("\n", $memory) as $line) {
      if (preg_match('/^(\w+):\s+(\d+)\s*kB/', $line, $matches)) {
        $stats[$matches[1]] = (int) $matches[2] * 1024;
      }
    }

    $total = $stats['MemTotal'] ?? 0;
    $free = $stats['MemFree'] ?? 0;
    $available = $stats['MemAvailable']
      ?? ($free + ($stats['Buffers'] ?? 0) + ($stats['Cached'] ?? 0));

    return [
      'total' => $total,
      'used' => max(0, $total - $available),
      'free' => $free
    ];
  }

  private function getTotalMemoryMac(): int
  {
    $memory = shell_exec('sysctl hw.memsize');
    if (!$memory || !preg_match('/hw.memsize: (\d+)/', $memory, $matches)) {
      throw new \RuntimeException('Failed to get total memory size');
    }
    return (int) $matches[1];
  }

  private function getCpuUsage(): float
  {
    if (PHP_OS_FAMILY === 'Darwin') {
      $usage = shell_exec("top -l 1 | grep -E '^CPU' | awk '{print $3}' | cut -d'%' -f1");
      if ($usage === null) {
        throw new \RuntimeException('Failed to get CPU usage');
      }

      return (float) $usage;
    }

    // Sample /proc/stat twice rather than spawning `top`.
    $first = $this->readCpuStat();
    usleep(100000);
    $second = $this->readCpuStat();

    if ($first === null || $second === null) {
      throw new \RuntimeException('Failed to read CPU usage');
    }

    $totalDelta = $second['total'] - $first['total'];
    if ($totalDelta <= 0) {
      return 0.0;
    }

    $idleDelta = $second['idle'] - $first['idle'];

    return round((1 - ($idleDelta / $totalDelta)) * 100, 2);
  }

  private function readCpuStat(): ?array
  {
    $stat = @file_get_contents('/proc/stat');
    if ($stat === false) {
      return null;
    }

    foreach (explode("\n", $stat) as $line) {
      if (!str_starts_with($line, 'cpu ')) {
        continue;
      }

      $parts = preg_split('/\s+/', trim(substr($line, 3)));
      if ($parts === false || count($parts) < 4) {
        return null;
      }

      $parts = array_map('intval', $parts);

      return [
        'total' => array_sum($parts),
        'idle' => $parts[3] + ($parts[4] ?? 0),
      ];
    }

    return null;
  }

  private function getCpuCores(): int
  {
    if (PHP_OS_FAMILY === 'Linux') {
      $out = shell_exec('nproc 2>/dev/null');
      if ($out !== null && is_numeric(trim($out))) {
        return (int) trim($out);
      }

      $cpuinfo = @file_get_contents('/proc/cpuinfo');
      if ($cpuinfo !== false) {
        return (int) preg_match_all('/^processor\s/m', $cpuinfo);
      }
    }

    return 1;
  }

  private function getDiskUsage(): array
  {
    $total = disk_total_space('/');
    $free = disk_free_space('/');

    if ($total === false || $free === false) {
      throw new \RuntimeException('Failed to get disk  space information');
    }

    return [
      'total' => $total,
      'free' => $free,
      'used' => $total - $free
    ];
  }

  private function getUptime(): int
  {
    if (PHP_OS_FAMILY === 'Darwin') {
      $uptime = shell_exec('sysctl -n kern.boottime');
      if (!$uptime || !preg_match('/sec = (\d+)/', $uptime, $matches)) {
        throw new \RuntimeException('Failed to get system uptime');
      }
      return time() - (int) $matches[1];
    }

    $uptime = @file_get_contents('/proc/uptime');
    if ($uptime === false) {
      throw new \RuntimeException('Failed to read uptime file');
    }

    return (int) floatval($uptime);
  }
}