@extends('layouts.admin')

@section('title')
  {{ __('admin/index.title') }}
@endsection

@section('content-header')
  <h1>{{ __('admin/index.overview.title') }}<small>{{ __('admin/index.overview.description') }}</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">{{ __('admin/navigation.breadcrumb.admin') }}</a></li>
    <li class="active">{{ __('admin/index.breadcrumb.index') }}</li>
  </ol>
@endsection

@section('content')
  <div class="row">
    <div class="col-xs-12">
      <div class="box">
        <div class="box-header with-border">
          <h3 class="box-title">{{ __('admin/index.system_information') }}</h3>
        </div>
        <div class="box-body">
          {!! __('admin/index.running_version', ['version' => '<code>' . config('app.version') . '</code>']) !!}
        </div>
      </div>
    </div>
  </div>

  <div id="admin-dashboard"></div>
  <div class="row">
    <div class="col-xs-6 col-sm-3 text-center">
    <a href="https://discord.gg/HmSeFTNas4"><button class="btn btn-warning" style="width:100%;"><i
        class="fa fa-fw fa-support"></i> {{ __('admin/index.buttons.get_help') }} <small>{{ __('admin/index.buttons.get_help_note') }}</small></button></a>
    </div>
    <div class="col-xs-6 col-sm-3 text-center">
    <a href="https://hydrodactyl.dev"><button class="btn btn-primary" style="width:100%;"><i
        class="fa fa-fw fa-link"></i> {{ __('admin/index.buttons.documentation') }}</button></a>
    </div>
    <div class="clearfix visible-xs-block">&nbsp;</div>
    <div class="col-xs-6 col-sm-3 text-center">
    <a href="https://github.com/BlueprintFramework/hydrodactyl"><button class="btn btn-primary" style="width:100%;"><i
        class="fa fa-fw fa-support"></i> {{ __('admin/index.buttons.github') }}</button></a>
    </div>
    <div class="col-xs-6 col-sm-3 text-center">
    <button class="btn btn-success" style="width:100%;" data-toggle="modal" data-target="#supportModal"><i
        class="fa fa-fw fa-money"></i> {{ __('admin/index.buttons.support') }}</button>
    </div>
  </div>

  <div class="modal fade" id="supportModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-label="{{ __('strings.close') }}"><span aria-hidden="true">&times;</span></button>
          <h4 class="modal-title"><i class="fa fa-fw fa-heart" style="color:#e74c3c;"></i> {{ __('admin/index.support.title') }}</h4>
        </div>
        <div class="modal-body">
          <p style="margin-bottom:16px;">{{ __('admin/index.support.description') }}</p>
          <div class="list-group" style="margin-bottom:0;">
            <a href="https://ko-fi.com/naterfute" target="_blank" rel="noopener" class="list-group-item support-item">
              <h4 class="list-group-item-heading"><i class="fa fa-fw fa-coffee"></i> Ko-Fi</h4>
              <p class="list-group-item-text">{{ __('admin/index.support.ko_fi_description') }}</p>
            </a>
            <a href="https://bpfw.io/donate" target="_blank" rel="noopener" class="list-group-item support-item">
              <h4 class="list-group-item-heading"><i class="fa fa-fw fa-gift"></i> Blueprint</h4>
              <p class="list-group-item-text">{{ __('admin/index.support.blueprint_description') }}</p>
            </a>
            <a href="https://discord.gg/sK686yHdaK" target="_blank" rel="noopener" class="list-group-item support-item">
              <h4 class="list-group-item-heading"><i class="fa fa-fw fa-comments"></i> Discord</h4>
              <p class="list-group-item-text">{{ __('admin/index.support.discord_description') }}</p>
            </a>
            <a href="https://github.com/BlueprintFramework/hydrodactyl" target="_blank" rel="noopener" class="list-group-item support-item">
              <h4 class="list-group-item-heading"><i class="fa fa-fw fa-star"></i> {{ __('admin/index.support.share_title') }}</h4>
              <p class="list-group-item-text">{{ __('admin/index.support.share_description') }}</p>
            </a>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-dismiss="modal">{{ __('strings.close') }}</button>
        </div>
      </div>
    </div>
  </div>
@endsection

@section('footer-scripts')
  @parent
  <style>
    #admin-dashboard .small-box { transition: transform 0.2s ease; }
    #admin-dashboard .small-box:hover { transform: translateY(-3px); }
    .support-item { background:#222 !important; border-color:#444 !important; color:#ccc !important; }
    .support-item:hover { background:#2a2a2a !important; border-color:#52A9FF !important; }
    .support-item .list-group-item-heading { color:#eee !important; }
    .support-item .list-group-item-text { color:#999 !important; }
  </style>
@endsection
