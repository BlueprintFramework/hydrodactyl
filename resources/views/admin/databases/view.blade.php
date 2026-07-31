@extends('layouts.admin')

@section('title')
    Database Hosts &rarr; View &rarr; {{ $host->name }}
@endsection

@section('content-header')
    <h1>{{ $host->name }}<small>Viewing associated databases and details for this database host.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.databases') }}">Database Hosts</a></li>
        <li class="active">{{ $host->name }}</li>
    </ol>
@endsection

@section('content')
<form action="{{ route('admin.databases.view', $host->id) }}" method="POST">
    <div class="row">
        <div class="col-sm-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Host Details</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label for="pName" class="form-label">Name</label>
                        <input type="text" id="pName" name="name" class="form-control" value="{{ old('name', $host->name) }}" />
                    </div>
                    <div class="form-group">
                        <label for="pType" class="form-label">Database Type</label>
                        <select name="type" id="pType" class="form-control">
                            @foreach(\Pterodactyl\Models\DatabaseHost::typeLabels() as $value => $label)
                                <option value="{{ $value }}" {{ old('type', $host->type) === $value ? 'selected' : '' }}>{{ $label }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pHost" class="form-label">Host</label>
                        <input type="text" id="pHost" name="host" class="form-control" value="{{ old('host', $host->host) }}" />
                        <p class="text-muted small">The IP address or FQDN that should be used when attempting to connect to this database host <em>from the panel</em>.</p>
                    </div>
                    <div class="form-group">
                        <label for="pPort" class="form-label">Port</label>
                        <input type="text" id="pPort" name="port" class="form-control" value="{{ old('port', $host->port) }}" />
                        <p class="text-muted small">The port used by this database host.</p>
                    </div>
                    <div class="form-group">
                        <label for="pNodeId" class="form-label">Linked Node</label>
                        <select name="node_id" id="pNodeId" class="form-control">
                            <option value="">None</option>
                            @foreach($locations as $location)
                                <optgroup label="{{ $location->short }}">
                                    @foreach($location->nodes as $node)
                                        <option value="{{ $node->id }}" {{ $host->node_id !== $node->id ?: 'selected' }}>{{ $node->name }}</option>
                                    @endforeach
                                </optgroup>
                            @endforeach
                        </select>
                        <p class="text-muted small">This setting does nothing other than default to this database host when adding a database to a server on the selected node.</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-sm-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">User Details</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label for="pUsername" class="form-label">Username</label>
                        <input type="text" name="username" id="pUsername" class="form-control" value="{{ old('username', $host->username) }}" />
                        <p class="text-muted small">The username of an account that has enough permissions to provision databases or credentials on this host.</p>
                    </div>
                    <div class="form-group">
                        <label for="pPassword" class="form-label">Password</label>
                        <input type="password" name="password" id="pPassword" class="form-control" />
                        <p class="text-muted small">The password to the account defined. Leave blank to continue using the assigned password.</p>
                    </div>
                    <hr />
                    <p class="text-danger small text-left">Use a database administration account with enough privileges to create and remove databases or users for the selected engine. Do not reuse the same credentials as the panel database.</p>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">Save</button>
                    <button name="_method" value="DELETE" class="btn btn-sm btn-danger pull-left muted muted-hover"><i class="fa fa-trash-o"></i></button>
                </div>
            </div>
        </div>
    </div>
</form>
<div class="row">
    <div class="col-xs-12">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Databases</h3>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tr>
                        <th>Server</th>
                        <th>Type</th>
                        <th>Database Name</th>
                        <th>Username</th>
                        <th>Connections From</th>
                        <th>Max Connections</th>
                        <th></th>
                    </tr>
                    @foreach($databases as $database)
                        <tr>
                            <td class="middle"><a href="{{ route('admin.servers.view', $database->getRelation('server')->id) }}">{{ $database->getRelation('server')->name }}</a></td>
                            <td class="middle">{{ \Pterodactyl\Models\DatabaseHost::typeLabels()[$database->type] ?? $database->type }}</td>
                            <td class="middle">{{ $database->database }}</td>
                            <td class="middle">{{ $database->username }}</td>
                            <td class="middle">{{ $database->remote }}</td>
                            @if($database->max_connections != null)
                                <td class="middle">{{ $database->max_connections }}</td>
                            @else
                                <td class="middle">Unlimited</td>
                            @endif
                            <td class="text-center">
                                <a href="{{ route('admin.servers.view.database', $database->getRelation('server')->id) }}">
                                    <button class="btn btn-xs btn-primary">Manage</button>
                                </a>
                            </td>
                        </tr>
                    @endforeach
                </table>
            </div>
            @if($databases->hasPages())
                <div class="box-footer with-border">
                    <div class="col-md-12 text-center">{!! $databases->render() !!}</div>
                </div>
            @endif
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $('#pNodeId').select2();
    </script>
@endsection
