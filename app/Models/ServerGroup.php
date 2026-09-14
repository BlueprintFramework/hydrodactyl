<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * \Pterodactyl\Models\ServerGroup.
 *
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property int $sort_order
 * @property bool $is_collapsed
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Database\Eloquent\Collection|\Pterodactyl\Models\Server[] $servers
 * @property int|null $servers_count
 * @property User $user
 *
 * @method static \Illuminate\Database\Eloquent\Builder|ServerGroup newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ServerGroup newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ServerGroup query()
 * @method static \Illuminate\Database\Eloquent\Builder|ServerGroup whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ServerGroup whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ServerGroup whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ServerGroup whereSortOrder($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ServerGroup whereIsCollapsed($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ServerGroup whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|ServerGroup whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
class ServerGroup extends Model
{
    /** @use HasFactory<\Database\Factories\ServerFactory> */
    use HasFactory;

    protected $table = 'server_groups';

    protected $guarded = ['id', self::CREATED_AT, self::UPDATED_AT];

    public static array $validationRules = [
        'user_id' => 'required|integer|exists:users,id',
        'name' => 'required|string|min:1|max:191',
        'description' => 'sometimes|nullable|string|max:1000',
        'sort_order' => 'sometimes|integer|min:0',
        'is_collapsed' => 'sometimes|boolean',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'sort_order' => 'integer',
        'is_collapsed' => 'boolean',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];

    /**
     * Get the user who owns this group.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the servers in this group.
     */
    public function servers(): HasMany
    {
        return $this->hasMany(Server::class, 'group_id');
    }
}
