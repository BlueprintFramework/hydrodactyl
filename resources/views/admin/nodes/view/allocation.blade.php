@extends('layouts.admin')

@section('title')
    {{ __('admin/node.view.allocation.title', ['name' => $node->name]) }}
@endsection

@section('content-header')
    <h1>{{ $node->name }}<small>{{ __('admin/node.view.allocation.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.nodes') }}">{{ __('admin/navigation.sidebar.nodes') }}</a></li>
        <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></li>
        <li class="active">{{ __('admin/node.view.allocation.breadcrumb') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="nav-tabs-custom nav-tabs-floating">
            <ul class="nav nav-tabs">
                <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ __('admin/node.view.tabs.about') }}</a></li>
                <li><a href="{{ route('admin.nodes.view.settings', $node->id) }}">{{ __('strings.settings') }}</a></li>
                <li><a href="{{ route('admin.nodes.view.configuration', $node->id) }}">{{ __('strings.configuration') }}</a></li>
                <li class="active"><a href="{{ route('admin.nodes.view.allocation', $node->id) }}">{{ __('admin/node.view.tabs.allocation') }}</a></li>
                <li><a href="{{ route('admin.nodes.view.servers', $node->id) }}">{{ __('strings.servers') }}</a></li>
            </ul>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-sm-8">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ __('admin/node.view.allocation.existing') }}</h3>
            </div>
            <div class="box-body table-responsive no-padding" style="overflow-x: visible">
                <table class="table table-hover" style="margin-bottom:0;">
                    <tr>
                        <th>
                            <input type="checkbox" class="select-all-files hidden-xs" data-action="selectAll">
                        </th>
                        <th>{{ __('strings.ip') }} <i class="fa fa-fw fa-minus-square" style="font-weight:normal;color:#d9534f;cursor:pointer;" data-toggle="modal" data-target="#allocationModal"></i></th>
                        <th>{{ __('admin/node.view.allocation.ip_alias') }}</th>
                        <th>{{ __('strings.port') }}</th>
                        <th>{{ __('admin/node.view.allocation.assigned_to') }}</th>
                        <th>
                            <div class="btn-group hidden-xs">
                                <button type="button" id="mass_actions" class="btn btn-sm btn-default dropdown-toggle disabled"
                                        data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{{ __('admin/node.view.allocation.mass_actions') }} <span class="caret"></span>
                                </button>
                                <ul class="dropdown-menu dropdown-massactions">
                                    <li><a href="#" id="selective-deletion" data-action="selective-deletion">{{ __('strings.delete') }} <i class="fa fa-fw fa-trash-o"></i></a></li>
                                </ul>
                            </div>
                        </th>
                    </tr>
                    @foreach($node->allocations as $allocation)
                        <tr>
                            <td class="middle min-size" data-identifier="type">
                                @if(is_null($allocation->server_id))
                                <input type="checkbox" class="select-file hidden-xs" data-action="addSelection">
                                @else
                                <input disabled="disabled" type="checkbox" class="select-file hidden-xs" data-action="addSelection">
                                @endif
                            </td>
                            <td class="col-sm-3 middle" data-identifier="ip">{{ $allocation->ip }}</td>
                            <td class="col-sm-3 middle">
                                <input class="form-control input-sm" type="text" value="{{ $allocation->ip_alias }}" data-action="set-alias" data-id="{{ $allocation->id }}" placeholder="{{ __('admin/node.view.allocation.no_alias_placeholder') }}" />
                                <span class="input-loader"><i class="fa fa-refresh fa-spin fa-fw"></i></span>
                            </td>
                            <td class="col-sm-2 middle" data-identifier="port">{{ $allocation->port }}</td>
                            <td class="col-sm-3 middle">
                                @if(! is_null($allocation->server))
                                    <a href="{{ route('admin.servers.view', $allocation->server_id) }}">{{ $allocation->server->name }}</a>
                                @endif
                            </td>
                            <td class="col-sm-1 middle">
                                @if(is_null($allocation->server_id))
                                    <button data-action="deallocate" data-id="{{ $allocation->id }}" class="btn btn-sm btn-danger"><i class="fa fa-trash-o"></i></button>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </table>
            </div>
            @if($node->allocations->hasPages())
                <div class="box-footer text-center">
                    {{ $node->allocations->render() }}
                </div>
            @endif
        </div>
    </div>
    <div class="col-sm-4">
        <form action="{{ route('admin.nodes.view.allocation', $node->id) }}" method="POST">
            <div class="box box-success">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('admin/node.view.allocation.assign_new') }}</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label for="pAllocationIP" class="control-label">{{ __('strings.ip') }}</label>
                        <div>
                            <select class="form-control" name="allocation_ip" id="pAllocationIP" multiple>
                                @foreach($allocations as $allocation)
                                    <option value="{{ $allocation->ip }}">{{ $allocation->ip }}</option>
                                @endforeach
                            </select>
                            <p class="text-muted small">{{ __('admin/node.view.allocation.ip_help') }}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="pAllocationIP" class="control-label">{{ __('admin/node.view.allocation.ip_alias') }}</label>
                        <div>
                            <input type="text" id="pAllocationAlias" class="form-control" name="allocation_alias" placeholder="{{ __('admin/node.view.allocation.alias_placeholder') }}" />
                            <p class="text-muted small">{{ __('admin/node.view.allocation.alias_help') }}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="pAllocationPorts" class="control-label">{{ __('admin/node.view.allocation.ports') }}</label>
                        <div>
                            <select class="form-control" name="allocation_ports[]" id="pAllocationPorts" multiple></select>
                            <p class="text-muted small">{{ __('admin/node.view.allocation.ports_help') }}</p>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-success btn-sm pull-right">{{ __('strings.submit') }}</button>
                </div>
            </div>
        </form>
    </div>
</div>
<div class="modal fade" id="allocationModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="{{ __('strings.close') }}"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">{{ __('admin/node.view.allocation.delete_block_title') }}</h4>
            </div>
            <form action="{{ route('admin.nodes.view.allocation.removeBlock', $node->id) }}" method="POST">
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-12">
                            <select class="form-control" name="ip">
                                @foreach($allocations as $allocation)
                                    <option value="{{ $allocation->ip }}">{{ $allocation->ip }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    {{{ csrf_field() }}}
                    <button type="button" class="btn btn-default" data-dismiss="modal">{{ __('strings.close') }}</button>
                    <button type="submit" class="btn btn-danger">{{ __('admin/node.view.allocation.delete_allocations') }}</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
    $('[data-action="addSelection"]').on('click', function () {
        updateMassActions();
    });

    $('[data-action="selectAll"]').on('click', function () {
        $('input.select-file').not(':disabled').prop('checked', function (i, val) {
            return !val;
        });

        updateMassActions();
    });

    $('[data-action="selective-deletion"]').on('mousedown', function () {
        deleteSelected();
    });

    $('#pAllocationIP').select2({
        tags: true,
        maximumSelectionLength: 1,
        selectOnClose: true,
        tokenSeparators: [',', ' '],
    });

    $('#pAllocationPorts').select2({
        tags: true,
        selectOnClose: true,
        tokenSeparators: [',', ' '],
    });

    $('button[data-action="deallocate"]').click(function (event) {
        event.preventDefault();
        var element = $(this);
        var allocation = $(this).data('id');
        swal({
            title: '',
            text: @js(__('admin/node.view.allocation.confirm_delete')),
            type: 'warning',
            showCancelButton: true,
            allowOutsideClick: true,
            closeOnConfirm: false,
            confirmButtonText: @js(__('strings.delete')),
            confirmButtonColor: '#d9534f',
            showLoaderOnConfirm: true
        }, function () {
            $.ajax({
                method: 'DELETE',
                url: '/admin/nodes/view/' + {{ $node->id }} + '/allocation/remove/' + allocation,
                headers: { 'X-CSRF-TOKEN': $('meta[name="_token"]').attr('content') },
            }).done(function (data) {
                element.parent().parent().addClass('warning').delay(100).fadeOut();
                swal({ type: 'success', title: @js(__('admin/node.view.allocation.deleted')) });
            }).fail(function (jqXHR) {
                console.error(jqXHR);
                swal({
                    title: @js(__('admin/node.view.allocation.whoops')),
                    text: jqXHR.responseJSON.error,
                    type: 'error'
                });
            });
        });
    });

    var typingTimer;
    $('input[data-action="set-alias"]').keyup(function () {
        clearTimeout(typingTimer);
        $(this).parent().removeClass('has-error has-success');
        typingTimer = setTimeout(sendAlias, 250, $(this));
    });

    var fadeTimers = [];
    function sendAlias(element) {
        element.parent().find('.input-loader').show();
        clearTimeout(fadeTimers[element.data('id')]);
        $.ajax({
            method: 'POST',
            url: '/admin/nodes/view/' + {{ $node->id }} + '/allocation/alias',
            headers: { 'X-CSRF-TOKEN': $('meta[name="_token"]').attr('content') },
            data: {
                alias: element.val(),
                allocation_id: element.data('id'),
            }
        }).done(function () {
            element.parent().addClass('has-success');
        }).fail(function (jqXHR) {
            console.error(jqXHR);
            element.parent().addClass('has-error');
        }).always(function () {
            element.parent().find('.input-loader').hide();
            fadeTimers[element.data('id')] = setTimeout(clearHighlight, 2500, element);
        });
    }

    function clearHighlight(element) {
        element.parent().removeClass('has-error has-success');
    }

    function updateMassActions() {
        if ($('input.select-file:checked').length > 0) {
            $('#mass_actions').removeClass('disabled');
        } else {
            $('#mass_actions').addClass('disabled');
        }
    }

    function deleteSelected() {
        var selectedIds = [];
        var selectedItems = [];
        var selectedItemsElements = [];

        $('input.select-file:checked').each(function () {
            var $parent = $($(this).closest('tr'));
            var id = $parent.find('[data-action="deallocate"]').data('id');
            var $ip = $parent.find('td[data-identifier="ip"]');
            var $port = $parent.find('td[data-identifier="port"]');
            var block = `${$ip.text()}:${$port.text()}`;

            selectedIds.push({
                id: id
            });
            selectedItems.push(block);
            selectedItemsElements.push($parent);
        });

        if (selectedItems.length !== 0) {
            var formattedItems = "";
            var i = 0;
            $.each(selectedItems, function (key, value) {
                formattedItems += ("<code>" + value + "</code>, ");
                i++;
                return i < 5;
            });

            formattedItems = formattedItems.slice(0, -2);
            if (selectedItems.length > 5) {
                formattedItems += @js(__('admin/node.view.allocation.more_allocations')).replace(':count', selectedItems.length - 5);
            }

            swal({
                type: 'warning',
                title: '',
                text: @js(__('admin/node.view.allocation.confirm_delete_multi')).replace(':allocations', formattedItems),
                html: true,
                showCancelButton: true,
                showConfirmButton: true,
                closeOnConfirm: false,
                showLoaderOnConfirm: true
            }, function () {
                $.ajax({
                    method: 'DELETE',
                    url: '/admin/nodes/view/' + {{ $node->id }} + '/allocations',
                    headers: {'X-CSRF-TOKEN': $('meta[name="_token"]').attr('content')},
                    data: JSON.stringify({
                        allocations: selectedIds
                    }),
                    contentType: 'application/json',
                    processData: false
                }).done(function () {
                    $('#file_listing input:checked').each(function () {
                        $(this).prop('checked', false);
                    });

                    $.each(selectedItemsElements, function () {
                        $(this).addClass('warning').delay(200).fadeOut();
                    });

                    swal({
                        type: 'success',
                        title: @js(__('admin/node.view.allocation.deleted_multi'))
                    });
                }).fail(function (jqXHR) {
                    console.error(jqXHR);
                    swal({
                        type: 'error',
                        title: @js(__('admin/node.view.allocation.whoops')),
                        html: true,
                        text: @js(__('admin/node.view.allocation.delete_error')),
                    });
                });
            });
        } else {
            swal({
                type: 'warning',
                title: '',
                text: @js(__('admin/node.view.allocation.select_required')),
            });
        }
    }
    </script>
@endsection
