@extends('layouts.admin')

@section('title')
    {{ __('admin/databases.index.title') }}
@endsection

@section('content-header')
    <h1>{{ __('admin/databases.index.title') }}<small>{{ __('admin/databases.index.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li class="active">{{ __('admin/databases.index.title') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ __('admin/databases.index.host_list') }}</h3>
                <div class="box-tools">
                    <button class="btn btn-sm btn-primary" data-toggle="modal" data-target="#newHostModal">{{ __('admin/databases.index.create_new') }}</button>
                </div>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tbody>
                        <tr>
                            <th>{{ __('strings.id') }}</th>
                            <th>{{ __('strings.name') }}</th>
                            <th>{{ __('admin/databases.index.host') }}</th>
                            <th>{{ __('strings.port') }}</th>
                            <th>{{ __('strings.username') }}</th>
                            <th class="text-center">{{ __('strings.databases') }}</th>
                            <th class="text-center">{{ __('strings.node') }}</th>
                        </tr>
                        @foreach ($hosts as $host)
                            <tr>
                                <td><code>{{ $host->id }}</code></td>
                                <td><a href="{{ route('admin.databases.view', $host->id) }}">{{ $host->name }}</a></td>
                                <td><code>{{ $host->host }}</code></td>
                                <td><code>{{ $host->port }}</code></td>
                                <td>{{ $host->username }}</td>
                                <td class="text-center">{{ $host->databases_count }}</td>
                                <td class="text-center">
                                    @if(! is_null($host->node))
                                        <a href="{{ route('admin.nodes.view', $host->node->id) }}">{{ $host->node->name }}</a>
                                    @else
                                        <span class="label label-default">{{ __('strings.none') }}</span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="newHostModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <form action="{{ route('admin.databases') }}" method="POST" id="databaseHostForm">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="{{ __('strings.close') }}"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">{{ __('admin/databases.index.create_title') }}</h4>
                </div>
                <div class="modal-body">
                    <div id="testResult" style="display: none;"></div>

                    <div class="form-group">
                        <label for="pName" class="form-label">{{ __('strings.name') }}</label>
                        <input type="text" name="name" id="pName" class="form-control" value="{{ old('name') }}" />
                        <p class="text-muted small">{{ __('admin/databases.index.name_help') }}</p>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label for="pHost" class="form-label">{{ __('admin/databases.index.host') }}</label>
                            <input type="text" name="host" id="pHost" class="form-control" value="{{ old('host') }}" />
                            <p class="text-muted small">{!! __('admin/databases.index.host_help') !!}</p>
                        </div>
                        <div class="col-md-6">
                            <label for="pPort" class="form-label">{{ __('strings.port') }}</label>
                            <input type="text" name="port" id="pPort" class="form-control" value="{{ old('port', '3306') }}"/>
                            <p class="text-muted small">{{ __('admin/databases.index.port_help') }}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label for="pUsername" class="form-label">{{ __('strings.username') }}</label>
                            <input type="text" name="username" id="pUsername" class="form-control" value="{{ old('username') }}" />
                            <p class="text-muted small">{{ __('admin/databases.index.username_help') }}</p>
                        </div>
                        <div class="col-md-6">
                            <label for="pPassword" class="form-label">{{ __('strings.password') }}</label>
                            <input type="password" name="password" id="pPassword" class="form-control" />
                            <p class="text-muted small">{{ __('admin/databases.index.password_help') }}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="pNodeId" class="form-label">{{ __('admin/databases.index.linked_node') }}</label>
                        <select name="node_id" id="pNodeId" class="form-control">
                            <option value="">{{ __('strings.none') }}</option>
                            @foreach($locations as $location)
                                <optgroup label="{{ $location->short }}">
                                    @foreach($location->nodes as $node)
                                        <option value="{{ $node->id }}" {{ old('node_id') == $node->id ? 'selected' : '' }}>{{ $node->name }}</option>
                                    @endforeach
                                </optgroup>
                            @endforeach
                        </select>
                        <p class="text-muted small">{{ __('admin/databases.index.linked_node_help') }}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <p class="text-danger small text-left">{!! __('admin/databases.index.danger_notice') !!}</p>
                    {!! csrf_field() !!}
                    <button type="button" class="btn btn-default btn-sm pull-left" data-dismiss="modal">{{ __('strings.cancel') }}</button>
                    <button type="button" id="testDatabaseBtn" class="btn btn-primary btn-sm">{{ __('admin/databases.index.test_database') }}</button>
                    <button type="submit" class="btn btn-success btn-sm">{{ __('strings.create') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $('#pNodeId').select2();

        // Test database connection
        $('#testDatabaseBtn').on('click', function() {
            const button = $(this);
            const originalText = button.text();
            const resultDiv = $('#testResult');

            // Show loading state
            button.prop('disabled', true).text(@js(__('admin/databases.index.testing')));
            resultDiv.hide().removeClass('alert alert-danger alert-success').html('');

            // Get form data
            const formData = {
                host: $('#pHost').val(),
                port: $('#pPort').val(),
                username: $('#pUsername').val(),
                password: $('#pPassword').val(),
                _token: '{{ csrf_token() }}'
            };

            // Validate required fields
            if (!formData.host || !formData.port || !formData.username || !formData.password) {
                resultDiv.html('<strong>' + @js(__('admin/databases.index.error_label')) + '</strong> ' + @js(__('admin/databases.index.fill_required'))).addClass('alert alert-danger').show();
                button.prop('disabled', false).text(originalText);
                return;
            }

            // Simple AJAX request
            $.ajax({
                url: '{{ route('admin.databases.test') }}',
                method: 'POST',
                data: formData,
                success: function(response) {
                    if (response.success) {
                        resultDiv.html('<strong>' + @js(__('admin/databases.index.success_label')) + '</strong> ' + response.message).addClass('alert alert-success').show();
                    } else {
                        resultDiv.html('<strong>' + @js(__('admin/databases.index.error_label')) + '</strong> ' + response.message).addClass('alert alert-danger').show();
                    }
                },
                error: function(xhr) {
                    let message = @js(__('admin/databases.index.unexpected_error'));
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        message = xhr.responseJSON.message;
                    } else if (xhr.statusText) {
                        message = xhr.statusText;
                    }
                    resultDiv.html('<strong>' + @js(__('admin/databases.index.error_label')) + '</strong> ' + message).addClass('alert alert-danger').show();
                },
                complete: function() {
                    button.prop('disabled', false).text(originalText);
                }
            });
        });

        // Clear test results when modal is opened
        $('#newHostModal').on('show.bs.modal', function() {
            $('#testResult').hide().empty();
        });

        // Re-open modal if there are old inputs (form was submitted but had errors)
        @if($errors->any())
            $(document).ready(function() {
                $('#newHostModal').modal('show');
            });
        @endif
    </script>
@endsection
