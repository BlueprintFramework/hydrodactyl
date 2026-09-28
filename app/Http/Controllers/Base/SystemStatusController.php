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
      $metrics = Cache::remember('system_metrics', 60, function () {
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
        'message' => __('strings.system_status.retrieve_failed'),
        'error' => $e->getMessage()
      ], 500);
    }
  }

  private function getMemoryUsage(): array
  {
    if (PHP_OS_FAMILY === 'Darwin') {
      $memory = shell_exec('vm_stat');
      if (!$memory) {
        throw new \RuntimeException(__('strings.system_status.vm_stat_failed'));
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
    $memory = shell_exec('free -b');
    if (!$memory) {
      throw new \RuntimeException(__('strings.system_status.free_command_failed'));
    }

    if (!preg_match('/Mem:\s+(\d+)\s+(\d+)\s+(\d+)/', $memory, $matches)) {
      throw new \RuntimeException(__('strings.system_status.memory_parse_failed'));
    }

    return [
      'total' => (int) $matches[1],
      'used' => (int) $matches[2],
      'free' => (int) $matches[3]
    ];
  }

  private function getTotalMemoryMac(): int
  {
    $memory = shell_exec('sysctl hw.memsize');
    if (!$memory || !preg_match('/hw.memsize: (\d+)/', $memory, $matches)) {
      throw new \RuntimeException(__('strings.system_status.total_memory_failed'));
    }
    return (int) $matches[1];
  }

  private function getCpuUsage(): float
  {
    if (PHP_OS_FAMILY === 'Darwin') {
      $cmd = "top -l 1 | grep -E '^CPU' | awk '{print $3}' | cut -d'%' -f1";
    } else {
      $cmd = "top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'";
    }

    $usage = shell_exec($cmd);
    if ($usage === null) {
      throw new \RuntimeException(__('strings.system_status.cpu_usage_failed'));
    }

    return (float) $usage;
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
      throw new \RuntimeException(__('strings.system_status.disk_info_failed'));
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
        throw new \RuntimeException(__('strings.system_status.uptime_failed'));
      }
      return time() - (int) $matches[1];
    }

    $uptime = @file_get_contents('/proc/uptime');
    if ($uptime === false) {
      throw new \RuntimeException(__('strings.system_status.uptime_read_failed'));
    }

    return (int) floatval($uptime);
  }
}