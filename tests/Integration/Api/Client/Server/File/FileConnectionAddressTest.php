<?php

namespace Pterodactyl\Tests\Integration\Api\Client\Server\File;

use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class FileConnectionAddressTest extends ClientApiIntegrationTestCase
{
    /**
     * Browser-facing signed URLs (file uploads and downloads) must point at the node's public
     * FQDN, not the internal FQDN that is reserved for panel-to-daemon communication.
     */
    public function testFileUrlsUseThePublicFqdnWhenAnInternalFqdnIsSet()
    {
        /** @var \Pterodactyl\Models\User $user */
        /** @var \Pterodactyl\Models\Server $server */
        [$user, $server] = $this->generateTestAccount();

        $server->node->update([
            'fqdn' => 'panel.example.com',
            'internal_fqdn' => '10.0.0.5',
        ]);

        $upload = $this->actingAs($user)->getJson($this->link($server, '/files/upload'));
        $upload->assertOk();
        $this->assertStringContainsString('http://panel.example.com:8080/upload/file', $upload->json('attributes.url'));
        $this->assertStringNotContainsString('10.0.0.5', $upload->json('attributes.url'));

        $download = $this->actingAs($user)->getJson($this->link($server, '/files/download') . '?file=server.properties');
        $download->assertOk();
        $this->assertStringContainsString('http://panel.example.com:8080/download/file', $download->json('attributes.url'));
        $this->assertStringNotContainsString('10.0.0.5', $download->json('attributes.url'));
    }
}
