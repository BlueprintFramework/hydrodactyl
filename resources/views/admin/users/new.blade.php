@extends('layouts.admin')

@section('title')
    {{ __('admin/user.new.title') }}
@endsection

@section('content-header')
    <h1>{{ __('admin/user.new.title') }}<small>{{ __('admin/user.new.subtitle') }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
        <li><a href="{{ route('admin.users') }}">{{ __('admin/navigation.sidebar.users') }}</a></li>
        <li class="active">{{ __('admin/user.new.breadcrumb') }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <form method="post">
        <div class="col-md-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('admin/user.new.identity') }}</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label for="email" class="control-label">{{ __('strings.email') }}</label>
                        <div>
                            <input type="text" autocomplete="off" name="email" value="{{ old('email') }}" class="form-control" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="username" class="control-label">{{ __('strings.username') }}</label>
                        <div>
                            <input type="text" autocomplete="off" name="username" value="{{ old('username') }}" class="form-control" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="name_first" class="control-label">{{ __('admin/user.new.name_first') }}</label>
                        <div>
                            <input type="text" autocomplete="off" name="name_first" value="{{ old('name_first') }}" class="form-control" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="name_last" class="control-label">{{ __('admin/user.new.name_last') }}</label>
                        <div>
                            <input type="text" autocomplete="off" name="name_last" value="{{ old('name_last') }}" class="form-control" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="control-label">{{ __('admin/user.new.default_language') }}</label>
                        <div>
                            <select name="language" class="form-control">
                                @foreach($languages as $key => $value)
                                    <option value="{{ $key }}" @if(config('app.locale') === $key) selected @endif>{{ $value }}</option>
                                @endforeach
                            </select>
                            <p class="text-muted"><small>{{ __('admin/user.new.default_language_help') }}</small></p>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    <input type="submit" value="{{ __('admin/user.new.submit') }}" class="btn btn-success btn-sm">
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('admin/user.new.permissions') }}</h3>
                </div>
                <div class="box-body">
                    <div class="form-group col-md-12">
                        <label for="root_admin" class="control-label">{{ __('admin/user.new.administrator') }}</label>
                        <div>
                            <select name="root_admin" class="form-control">
                                <option value="0">{{ __('strings.no') }}</option>
                                <option value="1">{{ __('strings.yes') }}</option>
                            </select>
                            <p class="text-muted"><small>{{ __('admin/user.new.administrator_help') }}</small></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">{{ __('strings.password') }}</h3>
                </div>
                <div class="box-body">
                    <div class="alert alert-info">
                        <p>{{ __('admin/user.new.password_notice') }}</p>
                    </div>
                    <div id="gen_pass" class=" alert alert-success" style="display:none;margin-bottom: 10px;"></div>
                    <div class="form-group">
                        <label for="pass" class="control-label">{{ __('strings.password') }}</label>
                        <div>
                            <input type="password" name="password" class="form-control" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>
@endsection

@section('footer-scripts')
    @parent
    <script>$("#gen_pass_bttn").click(function (event) {
            event.preventDefault();
            $.ajax({
                type: "GET",
                url: "/password-gen/12",
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
               },
                success: function(data) {
                    $("#gen_pass").html('<strong>' + @js(__('admin/user.new.generated_password')) + '</strong> ' + data).slideDown();
                    $('input[name="password"], input[name="password_confirmation"]').val(data);
                    return false;
                }
            });
            return false;
        });
    </script>
@endsection
