@extends('layouts.admin')

@section('title')
    {!! __('admin/node.new.title') !!}
@endsection

@section('content-header')
    <h1>{{ __('admin/node.new.heading') }}<small>{{ __('admin/node.new.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.nodes') }}">{{ __('admin/navigation.sidebar.nodes') }}</a></li>
        <li class="active">{{ __('strings.new') }}</li>
    </ol>
@endsection

@section('content')
<form action="{{ route('admin.nodes.new') }}" method="POST">
    <div class="row">
        <div class="col-sm-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('admin/node.new.basic_details') }}</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label for="pName" class="form-label">{{ __('strings.name') }}</label>
                        <input type="text" name="name" id="pName" class="form-control" value="{{ old('name') }}"/>
                        <p class="text-muted small">{!! __('admin/node.new.name_help') !!}</p>
                    </div>
                    <div class="form-group">
                        <label for="pDescription" class="form-label">{{ __('admin/node.new.description') }}</label>
                        <textarea name="description" id="pDescription" rows="4" class="form-control">{{ old('description') }}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="pLocationId" class="form-label">{{ __('admin/node.new.location') }}</label>
                        <select name="location_id" id="pLocationId">
                            @foreach($locations as $location)
                                <option value="{{ $location->id }}" {{ $location->id != old('location_id') ?: 'selected' }}>{{ $location->short }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pDaemonType" class="form-label">{{ __('admin/node.new.daemon') }}</label>
                        <select name="daemonType" id="pDaemonType" class="form-control">
                            @foreach($daemonTypes as $daemon => $label)
                                <option value="{{ $daemon }}" {{ $daemon == old('daemon_type', 'wings') ? 'selected' : '' }}>
                                    {{ $label }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pBackupDisk" class="form-label">{{ __('admin/node.new.backup_disk') }}</label>
                        <div>
                        <select name="backupDisk" id="pBackupDisk" class="form-control">
                            <!-- Populated via Script-->
                        </select>
                        </div>
                    </div>
                    <div class="form-group" id="pS3BucketGroup" style="display: none;">
                        <label for="pS3Bucket" class="form-label">{{ __('admin/node.new.s3_bucket') }}</label>
                        <div>
                        <select name="bucket" id="pS3Bucket" class="form-control">
                            <option value="">{{ __('admin/node.new.none_option') }}</option>
                            @foreach($s3Buckets as $s3)
                                <option value="{{ $s3->id }}" {{ old('bucket') == $s3->id ? 'selected' : '' }}>
                                    {{ $s3->name }} ({{ $s3->bucket_name }})
                                </option>
                            @endforeach
                        </select>
                        </div>
                        <p class="text-muted small">{{ __('admin/node.new.s3_bucket_help') }}</p>
                    </div>


                    <div class="form-group">
                        <label class="form-label">{{ __('admin/node.new.node_visibility') }}</label>
                        <div>
                            <div class="radio radio-success radio-inline">

                                <input type="radio" id="pPublicTrue" value="1" name="public" checked>
                                <label for="pPublicTrue"> {{ __('admin/node.new.public') }} </label>
                            </div>
                            <div class="radio radio-danger radio-inline">
                                <input type="radio" id="pPublicFalse" value="0" name="public">
                                <label for="pPublicFalse"> {{ __('admin/node.new.private') }} </label>
                            </div>
                        </div>
                        <p class="text-muted small">{!! __('admin/node.new.node_visibility_help') !!}
                    </div>
                    <div class="form-group">
                        <label for="pFQDN" class="form-label">{{ __('admin/node.new.public_fqdn') }}</label>
                        <input type="text" name="fqdn" id="pFQDN" class="form-control" value="{{ old('fqdn') }}" />
                        <p class="text-muted small">
                            {!! __('admin/node.new.public_fqdn_help') !!}
                        </p>
                    </div>
                    <div class="form-group">
                        <label for="pInternalFQDN" class="form-label">
                            {{ __('admin/node.new.internal_fqdn') }}
                            <strong>({{ __('strings.optional') }})</strong>
                        </label>
                        <input type="text" name="internal_fqdn" id="pInternalFQDN" class="form-control"
                            value="{{ old('internal_fqdn') }}" />
                        <p class="text-muted small">
                            {!! __('admin/node.new.internal_fqdn_help') !!}
                        </p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">{{ __('admin/node.new.communicate_over_ssl') }}</label>
                        <div>
                            <div class="radio radio-success radio-inline">
                                <input type="radio" id="pSSLTrue" value="https" name="scheme" checked>
                                <label for="pSSLTrue"> {{ __('admin/node.new.use_ssl') }}</label>
                            </div>
                            <div class="radio radio-danger radio-inline">
                                <input type="radio" id="pSSLFalse" value="http" name="scheme" @if(request()->isSecure()) disabled @endif>
                                <label for="pSSLFalse"> {{ __('admin/node.new.use_http') }}</label>
                            </div>
                        </div>
                        @if(request()->isSecure())
                            <p class="text-danger small">{!! __('admin/node.new.ssl_required_help') !!}</p>
                        @else
                            <p class="text-muted small">{{ __('admin/node.new.ssl_help') }}</p>
                        @endif
                    </div>
                    <div class="form-group">
                        <label class="form-label">{{ __('admin/node.new.behind_proxy') }}</label>
                        <div>
                            <div class="radio radio-success radio-inline">
                                <input type="radio" id="pProxyFalse" value="0" name="behind_proxy" checked>
                                <label for="pProxyFalse"> {{ __('admin/node.new.not_behind_proxy') }} </label>
                            </div>
                            <div class="radio radio-info radio-inline">
                                <input type="radio" id="pProxyTrue" value="1" name="behind_proxy">
                                <label for="pProxyTrue"> {{ __('admin/node.new.behind_proxy') }} </label>
                            </div>
                        </div>
                        <p class="text-muted small">{{ __('admin/node.new.behind_proxy_help') }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-sm-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('strings.configuration') }}</h3>
                </div>
                <div class="box-body">
                    <div class="row">
                        <div class="form-group col-md-6">
                            <label for="pDaemonBase" class="form-label">{{ __('admin/node.new.daemon_base') }}</label>
                            <input type="text" name="daemonBase" id="pDaemonBase" class="form-control" value="/var/lib/elytra/volumes" />
                            <p class="text-muted small">{!! __('admin/node.new.daemon_base_help') !!}</p>
                        </div>
                        <div class="form-group col-md-6">
                            <label for="pMemory" class="form-label">{{ __('admin/node.new.total_memory') }}</label>
                            <div class="input-group">
                                <input type="text" name="memory" data-multiplicator="true" class="form-control" id="pMemory" value="{{ old('memory') }}"/>
                                <span class="input-group-addon">MiB</span>
                            </div>
                        </div>
                        <div class="form-group col-md-6">
                            <label for="pMemoryOverallocate" class="form-label">{{ __('admin/node.new.memory_overallocate') }}</label>
                            <div class="input-group">
                                <input type="text" name="memory_overallocate" class="form-control" id="pMemoryOverallocate" value="{{ old('memory_overallocate') }}"/>
                                <span class="input-group-addon">%</span>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <p class="text-muted small">{!! __('admin/node.new.memory_help') !!}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group col-md-6">
                            <label for="pDisk" class="form-label">{{ __('admin/node.new.total_disk') }}</label>
                            <div class="input-group">
                                <input type="text" name="disk" data-multiplicator="true" class="form-control" id="pDisk" value="{{ old('disk') }}"/>
                                <span class="input-group-addon">MiB</span>
                            </div>
                        </div>
                        <div class="form-group col-md-6">
                            <label for="pDiskOverallocate" class="form-label">{{ __('admin/node.new.disk_overallocate') }}</label>
                            <div class="input-group">
                                <input type="text" name="disk_overallocate" class="form-control" id="pDiskOverallocate" value="{{ old('disk_overallocate') }}"/>
                                <span class="input-group-addon">%</span>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <p class="text-muted small">{!! __('admin/node.new.disk_help') !!}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group col-md-6">
                            <label for="pDaemonListen" class="form-label">{{ __('admin/node.new.daemon_port') }}</label>
                            <input type="text" name="daemonListen" class="form-control" id="pDaemonListen" value="8080" />
                        </div>
                        <div class="form-group col-md-6">
                            <label for="pDaemonSFTP" class="form-label">{{ __('admin/node.new.daemon_sftp_port') }}</label>
                            <input type="text" name="daemonSFTP" class="form-control" id="pDaemonSFTP" value="2022" />
                        </div>
                        <div class="col-md-12">
                            <p class="text-muted small">{!! __('admin/node.new.daemon_sftp_help') !!}</p>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-success pull-right">{{ __('admin/node.new.submit') }}</button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $('#pLocationId').select2();

        $(document).ready(function() {
            const daemonSelect = document.getElementById('pDaemonType');
            const backupDiskSelect = document.getElementById('pBackupDisk');

            const s3Types = ['s3', 'rustic_s3'];

            // Auto Update backup disks based on the selected daemon type
            function updateBackupDisks() {
                const daemonValue = daemonSelect.value;
                const disks = {!! json_encode($backupDisks ?? []) !!}[daemonValue] || [];

                backupDiskSelect.innerHTML = '';

                disks.forEach(disk => {
                    const option = document.createElement('option');
                    option.value = disk;
                    option.textContent = disk;

                    backupDiskSelect.appendChild(option);
                });

                updateS3Visibility();
            }

            function updateS3Visibility() {
                const s3Group = document.getElementById('pS3BucketGroup');
                if (s3Group) {
                    s3Group.style.display = s3Types.includes(backupDiskSelect.value) ? '' : 'none';
                }
            }

            updateBackupDisks();

            daemonSelect.addEventListener('change', updateBackupDisks);
            backupDiskSelect.addEventListener('change', updateS3Visibility);

            $('[data-toggle="popover"]').popover({
                placement: 'auto'
            });

            $('select[name="location_id"]').select2();
        });



    </script>
@endsection
