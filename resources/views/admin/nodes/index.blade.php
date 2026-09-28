@extends('layouts.admin')

@section('title')
    {{ __('admin/node.index.title') }}
@endsection

@section('scripts')
    @parent
    {!! Theme::css('vendor/fontawesome/animation.min.css') !!}
@endsection

@section('content-header')
    <h1>{{ __('admin/navigation.sidebar.nodes') }}<small>{{ __('admin/node.index.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li class="active">{{ __('admin/navigation.sidebar.nodes') }}</li>
    </ol>
@endsection

@section('content')

<div class="row">
    <div class="col-xs-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">{{ __('admin/node.index.node_list') }}</h3>
                <div class="box-tools search01">
                    <form action="{{ route('admin.nodes') }}" method="GET">
                        <div class="input-group input-group-sm">
                            <input type="text" name="filter[name]" class="form-control pull-right" value="{{ request()->input('filter.name') }}" placeholder="{{ __('admin/node.index.search_placeholder') }}">
                            <div class="input-group-btn">
                                <button type="submit" class="btn btn-default"><i class="fa fa-search"></i></button>
                                <a href="{{ route('admin.nodes.new') }}"><button type="button" class="btn btn-sm btn-primary" style="border-radius: 0 3px 3px 0;margin-left:-1px;">{{ __('admin/node.index.create_new') }}</button></a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tbody>
                        <tr>
                            <th></th>
                            <th>{{ __('strings.name') }}</th>
                            <th>{{ __('admin/node.index.location') }}</th>
                            <th>{{ __('admin/node.index.memory_percent') }}</th>
                            <th>{{ __('admin/node.index.allocated_memory') }}</th>
                            <th>{{ __('admin/node.index.total_memory') }}</th>
                            <th>{{ __('admin/node.index.disk_percent') }}</th>
                            <th>{{ __('admin/node.index.allocated_disk') }}</th>
                            <th>{{ __('admin/node.index.total_disk') }}</th>
                            <th class="text-center">{{ __('strings.servers') }}</th>
                            <th class="text-center">{{ __('admin/node.index.daemon_type') }}</th>
                            <th class="text-center">{{ __('admin/node.index.public') }}</th>
                        </tr>
                        @foreach ($nodes as $node)
                            <tr>
                                <td class="text-center text-muted left-icon" data-action="ping" data-secret="{{ $node->getDecryptedKey() }}" data-location="{{ $node->scheme }}://{{ $node->fqdn }}:{{ $node->daemonListen }}/api/system"><i class="fa fa-fw fa-refresh fa-spin"></i></td>
                                <td>{!! $node->maintenance_mode ? '<span class="label label-warning"><i class="fa fa-wrench"></i></span> ' : '' !!}<a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></td>
                                <td>{{ $node->location->short }}</td>
                                <td style="color: {{ $node->memory_color }}">{{ $node->memory_percent }}%</td>
                                <td>{{ $node->allocated_memory }}</td>
                                <td>{{ $node->total_memory }}</td>
                                <td style="color: {{ $node->disk_color }}">{{ $node->disk_percent }}%</td>
                                <td>{{ $node->allocated_disk }}</td>
                                <td>{{ $node->total_disk }}</td>
                                <td class="text-center">{{ $node->servers_count }}</td>
                                <td class="text-center">{{ $node->daemonType }}</td>
                                <td class="text-center"><i class="fa fa-{{ ($node->public) ? 'eye' : 'eye-slash' }}"></i></td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            @if($nodes->hasPages())
                <div class="box-footer with-border">
                    <div class="col-md-12 text-center">{!! $nodes->appends(['query' => Request::input('query')])->render() !!}</div>
                </div>
            @endif
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>
    (function pingNodes() {
        $('td[data-action="ping"]').each(function(i, element) {
            $.ajax({
                type: 'GET',
                url: $(element).data('location'),
                headers: {
                    'Authorization': 'Bearer ' + $(element).data('secret'),
                },
                timeout: 5000
            }).done(function (data) {
                $(element).find('i').tooltip({
                    title: 'v' + data.version,
                });
                $(element).removeClass('text-muted').find('i').removeClass().addClass('fa fa-fw fa-heartbeat faa-pulse animated').css('color', '#50af51');
            }).fail(function (error) {
                var errorText = @js(__('admin/node.index.connection_error'));
                try {
                    errorText = error.responseJSON.errors[0].detail || errorText;
                } catch (ex) {}

                $(element).removeClass('text-muted').find('i').removeClass().addClass('fa fa-fw fa-heart-o').css('color', '#d9534f');
                $(element).find('i').tooltip({ title: errorText });
            });
        }).promise().done(function () {
            setTimeout(pingNodes, 10000);
        });
    })();
    </script>
@endsection
